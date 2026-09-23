import type {
  ClassGroup,
  Classroom,
  ConflictInfo,
  LessonCard,
  SchoolSettings,
  Subject,
  Teacher,
  TimeAvailability,
} from '../types';

export interface TimetableValidationContext {
  cards: LessonCard[];
  classes: ClassGroup[];
  classrooms: Classroom[];
  settings: SchoolSettings;
  subjects: Subject[];
  teachers: Teacher[];
}

export interface Placement {
  day: number;
  slot: number;
}

const isForbidden = (grid: Record<number, TimeAvailability[]>, day: number, slot: number) =>
  grid[day - 1]?.[slot - 1] === 0;

const targetsOverlap = (left: LessonCard, right: LessonCard) =>
  left.targets.some((leftTarget) =>
    right.targets.some((rightTarget) => {
      if (leftTarget.classId !== rightTarget.classId) return false;
      return !leftTarget.subgroupId || !rightTarget.subgroupId || leftTarget.subgroupId === rightTarget.subgroupId;
    })
  );

const conflict = (cardId: string, type: ConflictInfo['type'], message: string): ConflictInfo => ({
  cardId,
  type,
  message,
});

export const validateCardPlacement = (
  card: LessonCard,
  placement: Placement,
  context: TimetableValidationContext
): ConflictInfo[] => {
  const { day, slot } = placement;
  const conflicts: ConflictInfo[] = [];

  if (day < 1 || day > context.settings.daysPerWeek || slot < 1 || slot > context.settings.maxLessonsPerDay) {
    return [conflict(card.id, 'availability', 'Выбранный день или урок находится вне учебной сетки.')];
  }

  const subject = context.subjects.find((item) => item.id === card.subjectId);
  if (!subject) return [conflict(card.id, 'availability', 'Для карточки не найден предмет.')];
  if (isForbidden(subject.timeGrid, day, slot)) {
    conflicts.push(conflict(card.id, 'availability', 'Предмет запрещён в выбранное время.'));
  }

  card.teacherIds.forEach((teacherId) => {
    const teacher = context.teachers.find((item) => item.id === teacherId);
    if (!teacher) {
      conflicts.push(conflict(card.id, 'teacher', 'Для карточки не найден учитель.'));
    } else if (isForbidden(teacher.timeGrid, day, slot)) {
      conflicts.push(conflict(card.id, 'availability', `Учитель ${teacher.shortName} недоступен в выбранное время.`));
    }
  });

  card.targets.forEach((target) => {
    const classGroup = context.classes.find((item) => item.id === target.classId);
    if (!classGroup) {
      conflicts.push(conflict(card.id, 'class', 'Для карточки не найден класс.'));
      return;
    }
    if (isForbidden(classGroup.timeGrid, day, slot)) {
      conflicts.push(conflict(card.id, 'availability', `Класс ${classGroup.name} недоступен в выбранное время.`));
    }
    if (target.subgroupId && !classGroup.subgroups.some((group) => group.id === target.subgroupId)) {
      conflicts.push(conflict(card.id, 'class', `В классе ${classGroup.name} не найдена выбранная подгруппа.`));
    }
  });

  if (card.roomId) {
    const room = context.classrooms.find((item) => item.id === card.roomId);
    if (!room) {
      conflicts.push(conflict(card.id, 'classroom', 'Для карточки не найден кабинет.'));
    } else if (isForbidden(room.timeGrid, day, slot)) {
      conflicts.push(conflict(card.id, 'availability', `Кабинет ${room.shortName} недоступен в выбранное время.`));
    }
  }

  context.cards
    .filter((other) => other.id !== card.id && other.day === day && other.slot === slot)
    .forEach((other) => {
      if (other.teacherIds.some((teacherId) => card.teacherIds.includes(teacherId))) {
        conflicts.push(conflict(card.id, 'teacher', 'Учитель уже занят другим уроком.'));
      }
      if (card.roomId && other.roomId === card.roomId) {
        conflicts.push(conflict(card.id, 'classroom', 'Кабинет уже занят другим уроком.'));
      }
      if (targetsOverlap(card, other)) {
        conflicts.push(conflict(card.id, 'class', 'Класс или та же подгруппа уже заняты другим уроком.'));
      }
    });

  return conflicts;
};

export const getTimetableConflicts = (context: TimetableValidationContext): ConflictInfo[] =>
  context.cards.flatMap((card) => {
    if (card.day === null || card.slot === null) return [];
    return validateCardPlacement(card, { day: card.day, slot: card.slot }, context);
  });
