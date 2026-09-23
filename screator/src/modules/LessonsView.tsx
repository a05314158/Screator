import { useState } from 'react';
import { useAppStore } from '../store';
import type { Lesson } from '../types';import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Layers,
  BookOpen,
  GraduationCap,
  Users,
  DoorClosed,
  Clock,
  Check
} from 'lucide-react';

export const LessonsView = () => {
  const { lessons, addLesson, updateLesson, deleteLesson, subjects, teachers, classes, classrooms } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Lesson>>({
    subjectId: '',
    teacherIds: [],
    targets: [],
    hoursPerWeek: 4,
    slotLength: 1,
    allowedRoomIds: [],
    useHomeRoom: true,
    useTeacherRoom: true,
  });

  const handleOpenCreate = () => {
    setEditingLesson(null);
    setErrorMessage(null);
    setFormData({
      subjectId: subjects[0]?.id || '',
      teacherIds: teachers[0]?.id ? [teachers[0].id] : [],
      targets: classes[0]?.id ? [{ classId: classes[0].id }] : [],
      hoursPerWeek: 4,
      slotLength: 1,
      allowedRoomIds: [],
      useHomeRoom: true,
      useTeacherRoom: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setErrorMessage(null);
    setFormData({ ...lesson });
    setIsModalOpen(true);
  };

  const toggleTeacher = (teacherId: string) => {
    const current = formData.teacherIds || [];
    if (current.includes(teacherId)) {
      if (current.length === 1) return; // Минимум 1 учитель
      setFormData({ ...formData, teacherIds: current.filter((id) => id !== teacherId) });
    } else {
      setFormData({ ...formData, teacherIds: [...current, teacherId] });
    }
  };

  const toggleClassTarget = (classId: string, subgroupId?: string) => {
    const current = formData.targets || [];
    const exists = current.some((t) => t.classId === classId && t.subgroupId === subgroupId);

    if (exists) {
      if (current.length === 1) return; // Минимум 1 класс
      setFormData({
        ...formData,
        targets: current.filter((t) => !(t.classId === classId && t.subgroupId === subgroupId)),
      });
    } else {
      setFormData({
        ...formData,
        targets: [...current, { classId, subgroupId }],
      });
    }
  };

  const toggleRoom = (roomId: string) => {
    const current = formData.allowedRoomIds || [];
    if (current.includes(roomId)) {
      setFormData({ ...formData, allowedRoomIds: current.filter((id) => id !== roomId) });
    } else {
      setFormData({ ...formData, allowedRoomIds: [...current, roomId] });
    }
  };

  const handleSave = () => {
    if (!formData.subjectId) {
      setErrorMessage('Выберите предмет.');
      return;
    }
    if (!formData.teacherIds || formData.teacherIds.length === 0) {
      setErrorMessage('Назначьте хотя бы одного преподавателя.');
      return;
    }
    if (!formData.targets || formData.targets.length === 0) {
      setErrorMessage('Выберите хотя бы один класс или подгруппу.');
      return;
    }

    if (editingLesson) {
      const res = updateLesson(editingLesson.id, formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при сохранении.');
        return;
      }
    } else {
      const res = addLesson({
        subjectId: formData.subjectId,
        teacherIds: formData.teacherIds,
        targets: formData.targets,
        hoursPerWeek: Number(formData.hoursPerWeek) || 1,
        slotLength: formData.slotLength === 2 ? 2 : 1,
        allowedRoomIds: formData.allowedRoomIds || [],
        useHomeRoom: !!formData.useHomeRoom,
        useTeacherRoom: !!formData.useTeacherRoom,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при добавлении.');
        return;
      }
    }
    setIsModalOpen(false);
  };

  // Фильтрация списка уроков
  const filteredLessons = lessons.filter((l) => {
    const subject = subjects.find((s) => s.id === l.subjectId);
    const subjectName = subject?.name.toLowerCase() || '';
    const matchesSearch = subjectName.includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'all' || l.targets.some((t) => t.classId === filterClass);
    const matchesTeacher = filterTeacher === 'all' || l.teacherIds.includes(filterTeacher);
    return matchesSearch && matchesClass && matchesTeacher;
  });

  return (
    <div className="space-y-6 select-none w-full">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Учебная нагрузка и уроки</h2>
          <p className="text-sm text-slate-500 mt-1">
            Связывание предметов, преподавателей, классов/подгрупп, недельных часов и фонда аудиторий.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Назначить урок</span>
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по предмету..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Класс:</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Все классы</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-semibold text-slate-600">Учитель:</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Все учителя</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.shortName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Таблица назначенных уроков */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[860px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-52">Предмет</th>
                <th className="py-3.5 px-4 w-56">Преподаватель</th>
                <th className="py-3.5 px-4">Класс / Подгруппы</th>
                <th className="py-3.5 px-4 w-28 text-center">Часов</th>
                <th className="py-3.5 px-4 w-32">Формат</th>
                <th className="py-3.5 px-4 w-44">Кабинеты</th>
                <th className="py-3.5 px-4 w-20 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLessons.map((lesson) => {
                const subject = subjects.find((s) => s.id === lesson.subjectId);
                const assignedTeachers = teachers.filter((t) => lesson.teacherIds.includes(t.id));

                return (
                  <tr key={lesson.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Предмет */}
                    <td className="py-3.5 px-4">
                      {subject ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0"
                            style={{ backgroundColor: subject.colorHex }}
                          />
                          <span className="font-semibold text-slate-900">{subject.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Удаленный предмет</span>
                      )}
                    </td>

                    {/* Учителя */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-800">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {assignedTeachers.map((t) => (
                          <span key={t.id} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            <GraduationCap className="w-3 h-3 text-emerald-600" />
                            <span>{t.shortName}</span>
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Классы и подгруппы */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lesson.targets.map((tgt, i) => {
                          const targetClass = classes.find((c) => c.id === tgt.classId);
                          const subgroup = targetClass?.subgroups.find((sg) => sg.id === tgt.subgroupId);
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200"
                            >
                              <span>{targetClass?.name || 'Класс'}</span>
                              {subgroup && (
                                <span className="font-normal text-[11px] bg-white px-1 rounded text-blue-900 border border-blue-200">
                                  {subgroup.shortName}
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Часы */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-900 text-sm">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-800">
                        {lesson.hoursPerWeek} ч.
                      </span>
                    </td>

                    {/* Формат (Одиночный / Сдвоенный) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {lesson.slotLength === 2 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Пара (2 урока)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">По 1 уроку</span>
                      )}
                    </td>

                    {/* Кабинеты */}
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="flex items-center gap-1 flex-wrap">
                        {lesson.useHomeRoom && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200" title="Домашний кабинет класса">
                            Дом.каб
                          </span>
                        )}
                        {lesson.useTeacherRoom && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] border border-slate-200" title="Кабинет учителя">
                            Каб.учителя
                          </span>
                        )}
                        {lesson.allowedRoomIds.map((rid) => {
                          const r = classrooms.find((cr) => cr.id === rid);
                          return r ? (
                            <span key={rid} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-200 font-mono">
                              {r.shortName}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>

                    {/* Действия */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(lesson)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Редактировать урок"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteLesson(lesson.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить урок"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно создания / редактирования урока */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Хедер модалки */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingLesson ? 'Редактирование урока' : 'Новый урок / Нагрузка'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Тело модалки */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Выбор предмета */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Предмет / Дисциплина *</label>
                <select
                  value={formData.subjectId || ''}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">Выберите предмет...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.shortName})</option>
                  ))}
                </select>
              </div>

              {/* Выбор преподавателей (поддержка со-преподавания) */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Преподаватель(и) * <span className="text-xs text-slate-400 font-normal">(кликните для выбора нескольких)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                  {teachers.map((t) => {
                    const isSelected = formData.teacherIds?.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeacher(t.id)}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition border text-left ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="truncate">{t.shortName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Выбор классов и подгрупп (поддержка объединений Joint classes) */}
              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Классы и подгруппы * <span className="text-xs text-slate-400 font-normal">(выберите целевую группу)</span>
                </label>
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 max-h-44 overflow-y-auto">
                  {classes.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      {/* Чекбокс всего класса */}
                      <button
                        type="button"
                        onClick={() => toggleClassTarget(c.id, undefined)}
                        className={`px-3 py-1 rounded text-xs font-bold transition border ${
                          formData.targets?.some((t) => t.classId === c.id && !t.subgroupId)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {c.name} (Весь класс)
                      </button>

                      {/* Подгруппы этого класса */}
                      <div className="flex items-center gap-1.5 flex-wrap pl-2 border-l border-slate-200">
                        {c.subgroups?.map((sg) => {
                          const isSelected = formData.targets?.some((t) => t.classId === c.id && t.subgroupId === sg.id);
                          return (
                            <button
                              key={sg.id}
                              type="button"
                              onClick={() => toggleClassTarget(c.id, sg.id)}
                              className={`px-2 py-0.5 rounded text-[11px] font-mono transition border ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {sg.shortName} ({sg.name})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Часы и формат (Одиночный / Пара) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Количество часов в неделю *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.hoursPerWeek || 4}
                    onChange={(e) => setFormData({ ...formData, hoursPerWeek: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Формат уроков</label>
                  <select
                    value={formData.slotLength || 1}
                    onChange={(e) => setFormData({ ...formData, slotLength: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>Одиночные уроки (по 1 слоту)</option>
                    <option value={2}>Сдвоенные уроки (пары по 2 слота)</option>
                  </select>
                </div>
              </div>

              {/* Назначение кабинетов */}
              <div className="space-y-3">
                <label className="block font-medium text-slate-700">Кабинеты для проведения</label>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.useHomeRoom}
                      onChange={(e) => setFormData({ ...formData, useHomeRoom: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Домашний кабинет класса</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!formData.useTeacherRoom}
                      onChange={(e) => setFormData({ ...formData, useTeacherRoom: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Кабинет учителя</span>
                  </label>
                </div>

                {/* Выбор спец-кабинетов */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {classrooms.map((room) => {
                    const isSelected = formData.allowedRoomIds?.includes(room.id);
                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => toggleRoom(room.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition border ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {room.shortName}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Футер модалки */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">
                Отмена
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};