export type ActiveStep =
  | 'settings'
  | 'subjects'
  | 'classrooms'
  | 'teachers'
  | 'classes'
  | 'lessons'
  | 'constraints'
  | 'timetable';

export type TimeAvailability = 1 | 2 | 0; // 1 = Разрешено, 2 = Нежелательно, 0 = Запрещено

export interface TimeSlot {
  slotNumber: number;
  startTime: string; // "08:30"
  endTime: string;   // "09:15"
  breakDurationMinutes: number;
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  daysPerWeek: number;
  maxLessonsPerDay: number;
  defaultLessonDurationMinutes: number;
  timeSlots: TimeSlot[];
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  colorHex: string;
  allowDoubleLessons: boolean;
  timeGrid: Record<number, TimeAvailability[]>;
}

export type ClassroomType =
  | 'regular'      // Обычный учебный
  | 'computer'     // Компьютерный класс / ИКТ
  | 'gym'          // Спортивный зал
  | 'lab_physics'  // Лаборатория физики
  | 'lab_chem_bio' // Лаборатория химии и биологии
  | 'workshop'     // Мастерская технологии / труда
  | 'auditorium';  // Актовый зал / лекционная

export interface Classroom {
  id: string;
  name: string;
  shortName: string;
  building: string;
  roomType: ClassroomType;
  capacity: number;
  isShared: boolean;
  colorHex: string;
  timeGrid: Record<number, TimeAvailability[]>;
}

export interface Teacher {
  id: string;
  fullName: string;
  shortName: string;
  contractHours: number;
  phone?: string;
  email?: string;
  defaultRoomId?: string;
  colorHex: string;
  timeGrid: Record<number, TimeAvailability[]>;
}

export interface Subgroup {
  id: string;
  name: string;
  shortName: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  shortName: string;
  gradeLevel: number;
  shift: 1 | 2;
  studentsCount: number;
  classTeacherId?: string;
  homeRoomId?: string;
  colorHex: string;
  subgroups: Subgroup[];
  timeGrid: Record<number, TimeAvailability[]>;
}

export interface LessonTarget {
  classId: string;
  subgroupId?: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  teacherIds: string[];
  targets: LessonTarget[];
  hoursPerWeek: number;
  slotLength: 1 | 2;
  allowedRoomIds: string[];
  useHomeRoom: boolean;
  useTeacherRoom: boolean;
}

export type ConstraintStrength = 'hard' | 'soft';

export interface SchoolConstraint {
  id: string;
  title: string;
  description: string;
  category: 'teachers' | 'classes' | 'subjects' | 'general';
  strength: ConstraintStrength;
  weight: number; // 1..10 для мягких ограничений
  isEnabled: boolean;
  params: Record<string, any>;
}

export interface LessonCard {
  id: string;          // уникальный id карточки-кванта
  lessonId: string;    // ссылка на Lesson из справочника
  subjectId: string;
  teacherIds: string[];
  targets: LessonTarget[];
  roomId: string | null;   // назначенный кабинет (или null, если ещё не выбран)
  day: number | null;      // 1..daysPerWeek, null = не расставлен
  slot: number | null;     // 1..maxLessonsPerDay, null = не расставлен
  pairIndex?: 1 | 2;       // для сдвоенных уроков — какая половина пары
  pairGroupId?: string;    // связывает 2 карточки одной пары между собой
}

export type TimetableViewMode = 'classes' | 'teachers' | 'classrooms';

export interface ConflictInfo {
  cardId: string;
  type: 'teacher' | 'classroom' | 'class' | 'availability';
  message: string;
}