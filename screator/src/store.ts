import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ActiveStep,
  SchoolSettings,
  Subject,
  Classroom,
  Teacher,
  ClassGroup,
  Lesson,
  SchoolConstraint,
  TimeSlot,
  LessonCard,
  TimetableViewMode,
  ConflictInfo,
} from './types';
import {
  sanitizeString,
  sanitizeHexColor,
  sanitizePhone,
  sanitizeEmail,
  normalizeTimeGrid,
} from './utils/security';
import { getTimetableConflicts, validateCardPlacement } from './utils/timetableValidation';

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 8, (mins || 0) + minutesToAdd, 0, 0);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function generateCalculatedSlots(
  count: number,
  firstLessonStart = '08:30',
  lessonDuration = 45,
  defaultBreak = 10
): TimeSlot[] {
  const safeCount = Math.max(1, Math.min(count, 12));
  const slots: TimeSlot[] = [];
  let currentStart = firstLessonStart;

  for (let i = 1; i <= safeCount; i++) {
    const lessonEnd = addMinutesToTime(currentStart, lessonDuration);
    const breakMin = i === 2 || i === 3 ? 15 : i === safeCount ? 0 : defaultBreak;
    slots.push({
      slotNumber: i,
      startTime: currentStart,
      endTime: lessonEnd,
      breakDurationMinutes: breakMin,
    });
    currentStart = addMinutesToTime(lessonEnd, breakMin);
  }
  return slots;
}

const initialSubjects: Subject[] = [
  { id: 'sub_math', name: 'Математика', shortName: 'Мат', colorHex: '#3b82f6', allowDoubleLessons: false, timeGrid: {} },
  { id: 'sub_rus', name: 'Русский язык', shortName: 'Рус', colorHex: '#ef4444', allowDoubleLessons: false, timeGrid: {} },
  { id: 'sub_lit', name: 'Литература', shortName: 'Лит', colorHex: '#ec4899', allowDoubleLessons: true, timeGrid: {} },
  { id: 'sub_eng', name: 'Иностранный язык', shortName: 'Англ', colorHex: '#8b5cf6', allowDoubleLessons: false, timeGrid: {} },
  { id: 'sub_phys', name: 'Физика', shortName: 'Физ', colorHex: '#06b6d4', allowDoubleLessons: true, timeGrid: {} },
  { id: 'sub_inf', name: 'Информатика', shortName: 'Инф', colorHex: '#10b981', allowDoubleLessons: true, timeGrid: {} },
  { id: 'sub_pe', name: 'Физкультура', shortName: 'Физ-ра', colorHex: '#f59e0b', allowDoubleLessons: false, timeGrid: {} },
];

const initialClassrooms: Classroom[] = [
  { id: 'r101', name: 'Кабинет 101', shortName: '101', building: 'Главный корпус', roomType: 'regular', capacity: 30, isShared: false, colorHex: '#64748b', timeGrid: {} },
  { id: 'r102', name: 'Кабинет 102', shortName: '102', building: 'Главный корпус', roomType: 'regular', capacity: 30, isShared: false, colorHex: '#64748b', timeGrid: {} },
  { id: 'r201', name: 'Кабинет математики 201', shortName: '201', building: 'Главный корпус', roomType: 'regular', capacity: 32, isShared: false, colorHex: '#3b82f6', timeGrid: {} },
  { id: 'r204', name: 'Кабинет физики и лаборатория', shortName: '204', building: 'Главный корпус', roomType: 'lab_physics', capacity: 28, isShared: false, colorHex: '#06b6d4', timeGrid: {} },
  { id: 'r305', name: 'Компьютерный класс 1', shortName: 'ИКТ-1', building: 'Главный корпус', roomType: 'computer', capacity: 16, isShared: false, colorHex: '#10b981', timeGrid: {} },
  { id: 'r306', name: 'Компьютерный класс 2', shortName: 'ИКТ-2', building: 'Главный корпус', roomType: 'computer', capacity: 16, isShared: false, colorHex: '#10b981', timeGrid: {} },
  { id: 'rgym', name: 'Большой спортивный зал', shortName: 'Спортзал', building: 'Спортивный блок', roomType: 'gym', capacity: 60, isShared: true, colorHex: '#f59e0b', timeGrid: {} },
  { id: 'rakt', name: 'Актовый зал', shortName: 'Актовый', building: 'Главный корпус', roomType: 'auditorium', capacity: 150, isShared: true, colorHex: '#8b5cf6', timeGrid: {} },
];

const initialTeachers: Teacher[] = [
  { id: 't1', fullName: 'Иванова Елена Петровна', shortName: 'Иванова Е.П.', contractHours: 18, defaultRoomId: 'r201', phone: '+7 (999) 111-22-33', colorHex: '#3b82f6', timeGrid: {} },
  { id: 't2', fullName: 'Смирнов Алексей Викторович', shortName: 'Смирнов А.В.', contractHours: 24, defaultRoomId: 'r204', phone: '+7 (999) 222-33-44', colorHex: '#06b6d4', timeGrid: {} },
  { id: 't3', fullName: 'Кузнецова Ольга Николаевна', shortName: 'Кузнецова О.Н.', contractHours: 20, defaultRoomId: 'r101', colorHex: '#ef4444', timeGrid: {} },
  { id: 't4', fullName: 'Попов Дмитрий Сергеевич', shortName: 'Попов Д.С.', contractHours: 18, defaultRoomId: 'r305', colorHex: '#10b981', timeGrid: {} },
  { id: 't5', fullName: 'Васильев Михаил Романович', shortName: 'Васильев М.Р.', contractHours: 22, defaultRoomId: 'rgym', colorHex: '#f59e0b', timeGrid: {} },
];

const defaultSubgroups: { id: string; name: string; shortName: string }[] = [
  { id: 'sg1', name: '1 группа', shortName: 'Гр.1' },
  { id: 'sg2', name: '2 группа', shortName: 'Гр.2' },
];

const initialClasses: ClassGroup[] = [
  { id: 'c5a', name: '5А', shortName: '5А', gradeLevel: 5, shift: 1, studentsCount: 28, classTeacherId: 't1', homeRoomId: 'r201', colorHex: '#3b82f6', subgroups: defaultSubgroups, timeGrid: {} },
  { id: 'c7b', name: '7Б', shortName: '7Б', gradeLevel: 7, shift: 1, studentsCount: 30, classTeacherId: 't2', homeRoomId: 'r204', colorHex: '#06b6d4', subgroups: defaultSubgroups, timeGrid: {} },
  { id: 'c9a', name: '9А', shortName: '9А', gradeLevel: 9, shift: 1, studentsCount: 26, classTeacherId: 't3', homeRoomId: 'r101', colorHex: '#ef4444', subgroups: defaultSubgroups, timeGrid: {} },
  { id: 'c11a', name: '11А', shortName: '11А', gradeLevel: 11, shift: 1, studentsCount: 24, classTeacherId: 't4', homeRoomId: 'r305', colorHex: '#10b981', subgroups: defaultSubgroups, timeGrid: {} },
];

const initialLessons: Lesson[] = [
  { id: 'l1', subjectId: 'sub_math', teacherIds: ['t1'], targets: [{ classId: 'c5a' }], hoursPerWeek: 5, slotLength: 1, allowedRoomIds: ['r201'], useHomeRoom: true, useTeacherRoom: true },
  { id: 'l2', subjectId: 'sub_phys', teacherIds: ['t2'], targets: [{ classId: 'c7b' }], hoursPerWeek: 3, slotLength: 1, allowedRoomIds: ['r204'], useHomeRoom: false, useTeacherRoom: true },
  { id: 'l3', subjectId: 'sub_inf', teacherIds: ['t4'], targets: [{ classId: 'c7b', subgroupId: 'sg1' }], hoursPerWeek: 2, slotLength: 1, allowedRoomIds: ['r305'], useHomeRoom: false, useTeacherRoom: true },
  { id: 'l4', subjectId: 'sub_pe', teacherIds: ['t5'], targets: [{ classId: 'c9a' }, { classId: 'c11a' }], hoursPerWeek: 2, slotLength: 1, allowedRoomIds: ['rgym'], useHomeRoom: false, useTeacherRoom: true },
];

const initialConstraints: SchoolConstraint[] = [
  {
    id: 'c_gaps',
    title: 'Минимизация «окон» у преподавателей',
    description: 'Не допускать разрывов между уроками у одного учителя в течение дня.',
    category: 'teachers',
    strength: 'soft',
    weight: 9,
    isEnabled: true,
    params: { maxGapsPerWeek: 2 },
  },
  {
    id: 'c_consecutive',
    title: 'Максимум уроков подряд у учителя',
    description: 'Ограничение на количество проведенных уроков подряд без перерыва.',
    category: 'teachers',
    strength: 'soft',
    weight: 7,
    isEnabled: true,
    params: { maxConsecutive: 5 },
  },
  {
    id: 'c_daily_class_limit',
    title: 'Равномерное распределение нагрузки классов',
    description: 'Предотвращение резких перепадов количества уроков по дням недели.',
    category: 'classes',
    strength: 'hard',
    weight: 10,
    isEnabled: true,
    params: { maxDailyVariance: 1 },
  },
  {
    id: 'c_subject_distribution',
    title: 'Распределение предметов по неделе',
    description: 'Не ставить один и тот же предмет в разные дни дважды, если это не спаренная пара.',
    category: 'subjects',
    strength: 'soft',
    weight: 8,
    isEnabled: true,
    params: { idealDistribution: true },
  },
];

interface AppState {
  activeStep: ActiveStep;
  settings: SchoolSettings;
  subjects: Subject[];
  classrooms: Classroom[];
  teachers: Teacher[];
  classes: ClassGroup[];
  lessons: Lesson[];
  constraints: SchoolConstraint[];
  setActiveStep: (step: ActiveStep) => void;
  updateSettings: (partial: Partial<SchoolSettings>) => void;
  setMaxLessonsPerDay: (count: number) => void;
  updateTimeSlot: <K extends keyof TimeSlot>(slotNumber: number, field: K, value: TimeSlot[K]) => void;
  recalculateAllSlots: (firstLessonStart: string, lessonDuration: number, defaultBreak: number) => void;

  // Предметы
  addSubject: (subject: Omit<Subject, 'id'>) => { success: boolean; error?: string };
  updateSubject: (id: string, partial: Partial<Subject>) => { success: boolean; error?: string };
  deleteSubject: (id: string) => void;

  // Кабинеты
  addClassroom: (classroom: Omit<Classroom, 'id'>) => { success: boolean; error?: string };
  updateClassroom: (id: string, partial: Partial<Classroom>) => { success: boolean; error?: string };
  deleteClassroom: (id: string) => void;

  // Учителя
  addTeacher: (teacher: Omit<Teacher, 'id'>) => { success: boolean; error?: string };
  updateTeacher: (id: string, partial: Partial<Teacher>) => { success: boolean; error?: string };
  deleteTeacher: (id: string) => void;

  // Классы
  addClass: (classGroup: Omit<ClassGroup, 'id'>) => { success: boolean; error?: string };
  updateClass: (id: string, partial: Partial<ClassGroup>) => { success: boolean; error?: string };
  deleteClass: (id: string) => void;

  // Уроки
  addLesson: (lesson: Omit<Lesson, 'id'>) => { success: boolean; error?: string };
  updateLesson: (id: string, partial: Partial<Lesson>) => { success: boolean; error?: string };
  deleteLesson: (id: string) => void;

  // Ограничения
  toggleConstraint: (id: string) => void;
  updateConstraint: (id: string, partial: Partial<SchoolConstraint>) => void;

  // Доска расписания
  timetableView: TimetableViewMode;
  cards: LessonCard[];
  setTimetableView: (mode: TimetableViewMode) => void;
  generateCardsFromLessons: () => void;
  placeCard: (cardId: string, day: number, slot: number) => { success: boolean; error?: string };
  unplaceCard: (cardId: string) => void;
  getConflicts: () => ConflictInfo[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeStep: 'settings',
      settings: {
        schoolName: 'МАОУ Средняя общеобразовательная школа № 12',
        academicYear: '2026/2027',
        daysPerWeek: 5,
        maxLessonsPerDay: 7,
        defaultLessonDurationMinutes: 45,
        timeSlots: generateCalculatedSlots(10),
      },
      subjects: initialSubjects,
      classrooms: initialClassrooms,
      teachers: initialTeachers,
      classes: initialClasses,
      lessons: initialLessons,
      constraints: initialConstraints,
      timetableView: 'classes',
      cards: [],

      setActiveStep: (step) => set({ activeStep: step }),

      updateSettings: (partial) =>
        set((state) => {
          const sanitized: Partial<SchoolSettings> = { ...partial };
          if (partial.schoolName !== undefined) sanitized.schoolName = sanitizeString(partial.schoolName);
          if (partial.academicYear !== undefined) sanitized.academicYear = sanitizeString(partial.academicYear, 20);
          if (partial.daysPerWeek !== undefined) sanitized.daysPerWeek = Math.max(5, Math.min(partial.daysPerWeek, 6));
          return { settings: { ...state.settings, ...sanitized } };
        }),

      setMaxLessonsPerDay: (count) =>
        set((state) => {
          const safeCount = Math.max(5, Math.min(count, 10));
          let slots = [...state.settings.timeSlots];
          if (safeCount > slots.length) {
            slots = generateCalculatedSlots(safeCount, slots[0]?.startTime || '08:30');
          }
          return {
            settings: {
              ...state.settings,
              maxLessonsPerDay: safeCount,
              timeSlots: slots,
            },
          };
        }),

      updateTimeSlot: (slotNumber, field, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            timeSlots: state.settings.timeSlots.map((slot) =>
              slot.slotNumber === slotNumber ? { ...slot, [field]: value } : slot
            ),
          },
        })),

      recalculateAllSlots: (firstLessonStart, lessonDuration, defaultBreak) =>
        set((state) => ({
          settings: {
            ...state.settings,
            defaultLessonDurationMinutes: Math.max(20, Math.min(lessonDuration, 90)),
            timeSlots: generateCalculatedSlots(
              state.settings.maxLessonsPerDay,
              firstLessonStart,
              lessonDuration,
              defaultBreak
            ),
          },
        })),

      addSubject: (newSub) => {
        const state = get();
        const cleanName = sanitizeString(newSub.name);
        const cleanShort = sanitizeString(newSub.shortName, 8);
        if (!cleanName) return { success: false, error: 'Укажите название предмета.' };

        const duplicate = state.subjects.find(
          (s) => s.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) return { success: false, error: 'Предмет с таким названием уже существует.' };

        set((s) => ({
          subjects: [
            ...s.subjects,
            {
              id: crypto.randomUUID(),
              name: cleanName,
              shortName: cleanShort || cleanName.slice(0, 4),
              colorHex: sanitizeHexColor(newSub.colorHex),
              allowDoubleLessons: !!newSub.allowDoubleLessons,
              timeGrid: normalizeTimeGrid(newSub.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay),
            },
          ],
        }));
        return { success: true };
      },

      updateSubject: (id, partial) => {
        const state = get();
        const cleanName = partial.name !== undefined ? sanitizeString(partial.name) : undefined;
        if (cleanName !== undefined) {
          if (!cleanName) return { success: false, error: 'Название предмета не может быть пустым.' };
          const duplicate = state.subjects.find(
            (s) => s.id !== id && s.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (duplicate) return { success: false, error: 'Предмет с таким названием уже существует.' };
        }

        set((s) => ({
          subjects: s.subjects.map((sub) => {
            if (sub.id !== id) return sub;
            return {
              ...sub,
              ...partial,
              name: cleanName !== undefined ? cleanName : sub.name,
              shortName: partial.shortName !== undefined ? sanitizeString(partial.shortName, 8) : sub.shortName,
              colorHex: partial.colorHex ? sanitizeHexColor(partial.colorHex) : sub.colorHex,
              timeGrid: partial.timeGrid
                ? normalizeTimeGrid(partial.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay)
                : sub.timeGrid,
            };
          }),
        }));
        return { success: true };
      },

      deleteSubject: (id) =>
        set((state) => ({
          lessons: state.lessons.filter((l) => l.subjectId !== id),
          subjects: state.subjects.filter((sub) => sub.id !== id),
        })),

      addClassroom: (newRoom) => {
        const state = get();
        const cleanName = sanitizeString(newRoom.name);
        const cleanShort = sanitizeString(newRoom.shortName, 10);
        const cleanBuilding = sanitizeString(newRoom.building, 40);
        if (!cleanName) return { success: false, error: 'Укажите название или номер кабинета.' };

        const duplicate = state.classrooms.find(
          (r) => r.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) return { success: false, error: 'Кабинет с таким названием уже существует.' };

        const capacity = Math.max(1, Math.min(Math.floor(Number(newRoom.capacity)) || 30, 500));

        set((s) => ({
          classrooms: [
            ...s.classrooms,
            {
              id: crypto.randomUUID(),
              name: cleanName,
              shortName: cleanShort || cleanName.slice(0, 5),
              building: cleanBuilding || 'Главный корпус',
              roomType: newRoom.roomType || 'regular',
              capacity,
              isShared: !!newRoom.isShared,
              colorHex: sanitizeHexColor(newRoom.colorHex),
              timeGrid: normalizeTimeGrid(newRoom.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay),
            },
          ],
        }));
        return { success: true };
      },

      updateClassroom: (id, partial) => {
        const state = get();
        const cleanName = partial.name !== undefined ? sanitizeString(partial.name) : undefined;
        if (cleanName !== undefined) {
          if (!cleanName) return { success: false, error: 'Название кабинета не может быть пустым.' };
          const duplicate = state.classrooms.find(
            (r) => r.id !== id && r.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (duplicate) return { success: false, error: 'Кабинет с таким названием уже существует.' };
        }

        set((s) => ({
          classrooms: s.classrooms.map((r) => {
            if (r.id !== id) return r;
            const capacity = partial.capacity !== undefined
              ? Math.max(1, Math.min(Math.floor(Number(partial.capacity)) || 30, 500))
              : r.capacity;

            return {
              ...r,
              ...partial,
              name: cleanName !== undefined ? cleanName : r.name,
              shortName: partial.shortName !== undefined ? sanitizeString(partial.shortName, 10) : r.shortName,
              building: partial.building !== undefined ? sanitizeString(partial.building, 40) : r.building,
              capacity,
              colorHex: partial.colorHex ? sanitizeHexColor(partial.colorHex) : r.colorHex,
              timeGrid: partial.timeGrid
                ? normalizeTimeGrid(partial.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay)
                : r.timeGrid,
            };
          }),
        }));
        return { success: true };
      },

      deleteClassroom: (id) =>
        set((state) => ({
          teachers: state.teachers.map((t) => (t.defaultRoomId === id ? { ...t, defaultRoomId: undefined } : t)),
          classes: state.classes.map((c) => (c.homeRoomId === id ? { ...c, homeRoomId: undefined } : c)),
          lessons: state.lessons.map((l) => ({ ...l, allowedRoomIds: l.allowedRoomIds.filter((rid) => rid !== id) })),
          classrooms: state.classrooms.filter((r) => r.id !== id),
        })),

      addTeacher: (newTeacher) => {
        const state = get();
        const cleanFullName = sanitizeString(newTeacher.fullName);
        const cleanShort = sanitizeString(newTeacher.shortName, 20);
        if (!cleanFullName) return { success: false, error: 'Укажите ФИО преподавателя.' };

        const duplicate = state.teachers.find(
          (t) => t.fullName.trim().toLowerCase() === cleanFullName.toLowerCase()
        );
        if (duplicate) return { success: false, error: 'Преподаватель с таким ФИО уже существует.' };

        const contractHours = Math.max(1, Math.min(Math.floor(Number(newTeacher.contractHours)) || 18, 60));

        set((s) => ({
          teachers: [
            ...s.teachers,
            {
              id: crypto.randomUUID(),
              fullName: cleanFullName,
              shortName: cleanShort || cleanFullName.slice(0, 15),
              contractHours,
              phone: sanitizePhone(newTeacher.phone),
              email: sanitizeEmail(newTeacher.email),
              defaultRoomId: newTeacher.defaultRoomId || undefined,
              colorHex: sanitizeHexColor(newTeacher.colorHex),
              timeGrid: normalizeTimeGrid(newTeacher.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay),
            },
          ],
        }));
        return { success: true };
      },

      updateTeacher: (id, partial) => {
        const state = get();
        const cleanFullName = partial.fullName !== undefined ? sanitizeString(partial.fullName) : undefined;
        if (cleanFullName !== undefined) {
          if (!cleanFullName) return { success: false, error: 'ФИО преподавателя не может быть пустым.' };
          const duplicate = state.teachers.find(
            (t) => t.id !== id && t.fullName.trim().toLowerCase() === cleanFullName.toLowerCase()
          );
          if (duplicate) return { success: false, error: 'Преподаватель с таким ФИО уже существует.' };
        }

        set((s) => ({
          teachers: s.teachers.map((t) => {
            if (t.id !== id) return t;
            const contractHours = partial.contractHours !== undefined
              ? Math.max(1, Math.min(Math.floor(Number(partial.contractHours)) || 18, 60))
              : t.contractHours;

            return {
              ...t,
              ...partial,
              fullName: cleanFullName !== undefined ? cleanFullName : t.fullName,
              shortName: partial.shortName !== undefined ? sanitizeString(partial.shortName, 20) : t.shortName,
              contractHours,
              phone: partial.phone !== undefined ? sanitizePhone(partial.phone) : t.phone,
              email: partial.email !== undefined ? sanitizeEmail(partial.email) : t.email,
              colorHex: partial.colorHex ? sanitizeHexColor(partial.colorHex) : t.colorHex,
              timeGrid: partial.timeGrid
                ? normalizeTimeGrid(partial.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay)
                : t.timeGrid,
            };
          }),
        }));
        return { success: true };
      },

      deleteTeacher: (id) =>
        set((state) => ({
          classes: state.classes.map((c) => (c.classTeacherId === id ? { ...c, classTeacherId: undefined } : c)),
          lessons: state.lessons.map((l) => ({ ...l, teacherIds: l.teacherIds.filter((tid) => tid !== id) })),
          teachers: state.teachers.filter((t) => t.id !== id),
        })),

      addClass: (newClass) => {
        const state = get();
        const cleanName = sanitizeString(newClass.name, 10);
        const cleanShort = sanitizeString(newClass.shortName, 8);
        if (!cleanName) return { success: false, error: 'Укажите название класса.' };

        const duplicate = state.classes.find(
          (c) => c.name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) return { success: false, error: 'Класс с таким названием уже добавлен.' };

        const gradeLevel = Math.max(1, Math.min(Number(newClass.gradeLevel) || 1, 11));
        const studentsCount = Math.max(1, Math.min(Number(newClass.studentsCount) || 25, 60));

        set((s) => ({
          classes: [
            ...s.classes,
            {
              id: crypto.randomUUID(),
              name: cleanName,
              shortName: cleanShort || cleanName,
              gradeLevel,
              shift: newClass.shift === 2 ? 2 : 1,
              studentsCount,
              classTeacherId: newClass.classTeacherId || undefined,
              homeRoomId: newClass.homeRoomId || undefined,
              colorHex: sanitizeHexColor(newClass.colorHex),
              subgroups: newClass.subgroups && newClass.subgroups.length > 0 ? newClass.subgroups : defaultSubgroups,
              timeGrid: normalizeTimeGrid(newClass.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay),
            },
          ],
        }));
        return { success: true };
      },

      updateClass: (id, partial) => {
        const state = get();
        const cleanName = partial.name !== undefined ? sanitizeString(partial.name, 10) : undefined;
        if (cleanName !== undefined) {
          if (!cleanName) return { success: false, error: 'Название класса не может быть пустым.' };
          const duplicate = state.classes.find(
            (c) => c.id !== id && c.name.trim().toLowerCase() === cleanName.toLowerCase()
          );
          if (duplicate) return { success: false, error: 'Класс с таким названием уже существует.' };
        }

        set((s) => ({
          classes: s.classes.map((c) => {
            if (c.id !== id) return c;
            const gradeLevel = partial.gradeLevel !== undefined
              ? Math.max(1, Math.min(Number(partial.gradeLevel) || 1, 11))
              : c.gradeLevel;
            const studentsCount = partial.studentsCount !== undefined
              ? Math.max(1, Math.min(Number(partial.studentsCount) || 25, 60))
              : c.studentsCount;

            return {
              ...c,
              ...partial,
              name: cleanName !== undefined ? cleanName : c.name,
              shortName: partial.shortName !== undefined ? sanitizeString(partial.shortName, 8) : c.shortName,
              gradeLevel,
              studentsCount,
              colorHex: partial.colorHex ? sanitizeHexColor(partial.colorHex) : c.colorHex,
              timeGrid: partial.timeGrid
                ? normalizeTimeGrid(partial.timeGrid, s.settings.daysPerWeek, s.settings.maxLessonsPerDay)
                : c.timeGrid,
            };
          }),
        }));
        return { success: true };
      },

      deleteClass: (id) =>
        set((state) => ({
          lessons: state.lessons.filter((l) => !l.targets.some((t) => t.classId === id)),
          classes: state.classes.filter((c) => c.id !== id),
        })),

      addLesson: (newLesson) => {
        if (!newLesson.subjectId) return { success: false, error: 'Выберите предмет.' };
        if (!newLesson.teacherIds || newLesson.teacherIds.length === 0) {
          return { success: false, error: 'Назначьте хотя бы одного преподавателя.' };
        }
        if (!newLesson.targets || newLesson.targets.length === 0) {
          return { success: false, error: 'Выберите хотя бы один класс или подгруппу.' };
        }

        const hours = Math.max(1, Math.min(Number(newLesson.hoursPerWeek) || 1, 30));

        set((s) => ({
          lessons: [
            ...s.lessons,
            {
              id: crypto.randomUUID(),
              subjectId: newLesson.subjectId,
              teacherIds: newLesson.teacherIds,
              targets: newLesson.targets,
              hoursPerWeek: hours,
              slotLength: newLesson.slotLength === 2 ? 2 : 1,
              allowedRoomIds: newLesson.allowedRoomIds || [],
              useHomeRoom: !!newLesson.useHomeRoom,
              useTeacherRoom: !!newLesson.useTeacherRoom,
            },
          ],
        }));
        return { success: true };
      },

      updateLesson: (id, partial) => {
        set((s) => ({
          lessons: s.lessons.map((l) => {
            if (l.id !== id) return l;
            const hours = partial.hoursPerWeek !== undefined
              ? Math.max(1, Math.min(Number(partial.hoursPerWeek) || 1, 30))
              : l.hoursPerWeek;

            return {
              ...l,
              ...partial,
              hoursPerWeek: hours,
            };
          }),
        }));
        return { success: true };
      },

      deleteLesson: (id) =>
        set((state) => ({
          lessons: state.lessons.filter((l) => l.id !== id),
        })),

      toggleConstraint: (id) =>
        set((s) => ({
          constraints: s.constraints.map((c) => (c.id === id ? { ...c, isEnabled: !c.isEnabled } : c)),
        })),

      updateConstraint: (id, partial) =>
        set((s) => ({
          constraints: s.constraints.map((c) => (c.id === id ? { ...c, ...partial } : c)),
        })),

      setTimetableView: (mode) => set({ timetableView: mode }),

      generateCardsFromLessons: () => {
        const { lessons } = get();
        const newCards: LessonCard[] = [];

        lessons.forEach((lesson) => {
          const isDouble = lesson.slotLength === 2;
          const quantum = isDouble ? 2 : 1;
          const totalUnits = Math.ceil(lesson.hoursPerWeek / quantum);

          for (let i = 0; i < totalUnits; i++) {
            if (isDouble) {
              const pairGroupId = crypto.randomUUID();
              newCards.push({
                id: crypto.randomUUID(),
                lessonId: lesson.id,
                subjectId: lesson.subjectId,
                teacherIds: lesson.teacherIds,
                targets: lesson.targets,
                roomId: lesson.allowedRoomIds[0] || null,
                day: null,
                slot: null,
                pairIndex: 1,
                pairGroupId,
              });
              newCards.push({
                id: crypto.randomUUID(),
                lessonId: lesson.id,
                subjectId: lesson.subjectId,
                teacherIds: lesson.teacherIds,
                targets: lesson.targets,
                roomId: lesson.allowedRoomIds[0] || null,
                day: null,
                slot: null,
                pairIndex: 2,
                pairGroupId,
              });
            } else {
              newCards.push({
                id: crypto.randomUUID(),
                lessonId: lesson.id,
                subjectId: lesson.subjectId,
                teacherIds: lesson.teacherIds,
                targets: lesson.targets,
                roomId: lesson.allowedRoomIds[0] || null,
                day: null,
                slot: null,
              });
            }
          }
        });

        set({ cards: newCards });
      },

      placeCard: (cardId, day, slot) => {
        const state = get();
        const card = state.cards.find((item) => item.id === cardId);
        if (!card) return { success: false, error: 'Карточка не найдена.' };

        const lesson = state.lessons.find((item) => item.id === card.lessonId);
        if (!lesson) return { success: false, error: 'Для карточки не найдена учебная нагрузка.' };
        const homeRoomId = card.targets.length === 1
          ? state.classes.find((item) => item.id === card.targets[0].classId)?.homeRoomId
          : undefined;
        const teacherRoomId = state.teachers.find((item) => item.id === card.teacherIds[0])?.defaultRoomId;
        const roomId = card.roomId ?? lesson.allowedRoomIds[0]
          ?? (lesson.useHomeRoom ? homeRoomId : undefined)
          ?? (lesson.useTeacherRoom ? teacherRoomId : undefined);
        if (!roomId) return { success: false, error: 'Уроку необходимо назначить кабинет.' };

        const partner = card.pairGroupId
          ? state.cards.find((item) => item.pairGroupId === card.pairGroupId && item.id !== card.id)
          : undefined;
        if (card.pairGroupId && (!partner || !card.pairIndex || !partner.pairIndex || card.pairIndex === partner.pairIndex)) {
          return { success: false, error: 'Пара повреждена: не найдены обе половины урока.' };
        }
        const partnerSlot = card.pairIndex === 1 ? slot + 1 : slot - 1;
        const groupIds = new Set([card.id, ...(partner ? [partner.id] : [])]);
        const context = {
          cards: state.cards.filter((item) => !groupIds.has(item.id)),
          classes: state.classes,
          classrooms: state.classrooms,
          settings: state.settings,
          subjects: state.subjects,
          teachers: state.teachers,
        };
        const proposals = [
          { item: { ...card, roomId }, position: slot },
          ...(partner ? [{ item: { ...partner, roomId }, position: partnerSlot }] : []),
        ];
        const issues = proposals.flatMap(({ item, position }) =>
          validateCardPlacement(item, { day, slot: position }, context)
        );
        if (issues.length > 0) return { success: false, error: issues[0].message };

        set((current) => ({
          cards: current.cards.map((item) => {
            const proposal = proposals.find(({ item: next }) => next.id === item.id);
            return proposal ? { ...item, roomId, day, slot: proposal.position } : item;
          }),
        }));
        return { success: true };
      },

      unplaceCard: (cardId) =>
        set((state) => {
          const card = state.cards.find((item) => item.id === cardId);
          if (!card) return state;
          return {
            cards: state.cards.map((item) =>
              item.id === cardId || (card.pairGroupId && item.pairGroupId === card.pairGroupId)
                ? { ...item, day: null, slot: null }
                : item
            ),
          };
        }),

      getConflicts: () => {
        const state = get();
        return getTimetableConflicts({
          cards: state.cards,
          classes: state.classes,
          classrooms: state.classrooms,
          settings: state.settings,
          subjects: state.subjects,
          teachers: state.teachers,
        });
      },
    }),
    {
      name: 'screator-project-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
