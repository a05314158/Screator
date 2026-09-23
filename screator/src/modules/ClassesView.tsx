import { useState } from 'react';
import { useAppStore } from '../store';
import type { ClassGroup, Subgroup } from '../types';
import { TimeGridPicker } from '../components/TimeGridPicker';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Users,
  GraduationCap,
  DoorClosed,
  Clock,
  Split
} from 'lucide-react';

const presetColors = ['#3b82f6', '#06b6d4', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

const presetSubgroupTemplates: { name: string; groups: Omit<Subgroup, 'id'>[] }[] = [
  {
    name: 'Стандарт (2 группы: языки / инф)',
    groups: [
      { name: '1 группа', shortName: 'Гр.1' },
      { name: '2 группа', shortName: 'Гр.2' },
    ],
  },
  {
    name: 'Гендерное (Мальчики / Девочки: труд / физ-ра)',
    groups: [
      { name: 'Мальчики', shortName: 'М' },
      { name: 'Девочки', shortName: 'Д' },
    ],
  },
  {
    name: '3 группы (Интенсивные языки)',
    groups: [
      { name: '1 группа', shortName: 'Гр.1' },
      { name: '2 группа', shortName: 'Гр.2' },
      { name: '3 группа', shortName: 'Гр.3' },
    ],
  },
  {
    name: 'Профильное (База / Профиль)',
    groups: [
      { name: 'Базовый уровень', shortName: 'База' },
      { name: 'Профильный уровень', shortName: 'Проф' },
    ],
  },
];

export const ClassesView = () => {
  const { classes, addClass, updateClass, deleteClass, teachers, classrooms, settings } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<ClassGroup>>({
    name: '',
    shortName: '',
    gradeLevel: 7,
    shift: 1,
    studentsCount: 28,
    classTeacherId: '',
    homeRoomId: '',
    colorHex: '#3b82f6',
    subgroups: [
      { id: 'sg1', name: '1 группа', shortName: 'Гр.1' },
      { id: 'sg2', name: '2 группа', shortName: 'Гр.2' },
    ],
    timeGrid: {},
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      shortName: '',
      gradeLevel: 7,
      shift: 1,
      studentsCount: 28,
      classTeacherId: '',
      homeRoomId: '',
      colorHex: presetColors[Math.floor(Math.random() * presetColors.length)],
      subgroups: [
        { id: 'sg1', name: '1 группа', shortName: 'Гр.1' },
        { id: 'sg2', name: '2 группа', shortName: 'Гр.2' },
      ],
      timeGrid: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (classGroup: ClassGroup) => {
    setEditingClass(classGroup);
    setErrorMessage(null);
    setFormData({ ...classGroup });
    setIsModalOpen(true);
  };

  const handleApplySubgroupTemplate = (templateIndex: number) => {
    const template = presetSubgroupTemplates[templateIndex];
    if (!template) return;
    const newGroups: Subgroup[] = template.groups.map((g) => ({
      ...g,
      id: crypto.randomUUID(),
    }));
    setFormData((prev) => ({ ...prev, subgroups: newGroups }));
  };

  const handleAddCustomSubgroup = () => {
    const current = formData.subgroups || [];
    const newIndex = current.length + 1;
    setFormData((prev) => ({
      ...prev,
      subgroups: [
        ...current,
        { id: crypto.randomUUID(), name: `${newIndex} группа`, shortName: `Гр.${newIndex}` },
      ],
    }));
  };

  const handleRemoveSubgroup = (subgroupId: string) => {
    const current = formData.subgroups || [];
    if (current.length <= 1) {
      setErrorMessage('Класс должен иметь минимум одну группу.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      subgroups: current.filter((sg) => sg.id !== subgroupId),
    }));
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      setErrorMessage('Укажите обозначение класса (например, 7А).');
      return;
    }

    if (editingClass) {
      const res = updateClass(editingClass.id, formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при сохранении.');
        return;
      }
    } else {
      const res = addClass({
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim(),
        gradeLevel: Number(formData.gradeLevel) || 7,
        shift: formData.shift === 2 ? 2 : 1,
        studentsCount: Number(formData.studentsCount) || 28,
        classTeacherId: formData.classTeacherId || undefined,
        homeRoomId: formData.homeRoomId || undefined,
        colorHex: formData.colorHex || '#3b82f6',
        subgroups: formData.subgroups || [],
        timeGrid: formData.timeGrid || {},
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при добавлении.');
        return;
      }
    }
    setIsModalOpen(false);
  };

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesShift = filterShift === 'all' || String(c.shift) === filterShift;
    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-6 select-none w-full">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Учебные классы и параллели</h2>
          <p className="text-sm text-slate-500 mt-1">
            Список классов школы, смены обучения, классные руководители, домашние кабинеты и подгруппы.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить класс</span>
        </button>
      </div>

      {/* Поиск и фильтр по сменам */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию класса (напр. 7А, 11)..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Смена:</label>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все смены</option>
            <option value="1">1-я смена (утро)</option>
            <option value="2">2-я смена (обед)</option>
          </select>
        </div>
      </div>

      {/* Адаптивная таблица классов */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[820px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-28">Класс</th>
                <th className="py-3.5 px-4 w-32">Смена</th>
                <th className="py-3.5 px-4 w-32">Учеников</th>
                <th className="py-3.5 px-4">Классный руководитель</th>
                <th className="py-3.5 px-4 w-44">Кабинет</th>
                <th className="py-3.5 px-4 w-52">Подгруппы</th>
                <th className="py-3.5 px-4 w-24 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClasses.map((cl) => {
                const teacher = teachers.find((t) => t.id === cl.classTeacherId);
                const room = classrooms.find((r) => r.id === cl.homeRoomId);
                return (
                  <tr key={cl.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0"
                          style={{ backgroundColor: cl.colorHex }}
                        />
                        <span className="font-bold text-slate-900 text-sm">
                          {cl.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                        cl.shift === 1 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <Clock className="w-3 h-3" />
                        <span>{cl.shift}-я смена</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cl.studentsCount} чел.</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-800">
                      {teacher ? (
                        <div className="flex items-center gap-1.5 font-medium">
                          <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{teacher.shortName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Не назначен</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {room ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <DoorClosed className="w-3 h-3 text-slate-500" />
                          <span>{room.shortName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {cl.subgroups?.map((sg) => (
                          <span
                            key={sg.id}
                            className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono border border-slate-200"
                          >
                            {sg.shortName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(cl)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Редактировать класс и подгруппы"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClass(cl.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить класс"
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

      {/* Модальное окно создания / редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingClass ? `Редактирование класса: ${editingClass.name}` : 'Новый класс'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">Название класса *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Например: 7А"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Параллель (1..11)</label>
                  <input
                    type="number"
                    min="1"
                    max="11"
                    value={formData.gradeLevel || 7}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Смена</label>
                  <select
                    value={formData.shift || 1}
                    onChange={(e) => setFormData({ ...formData, shift: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1-я смена</option>
                    <option value={2}>2-я смена</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Учеников в классе</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.studentsCount || 28}
                    onChange={(e) => setFormData({ ...formData, studentsCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Классный руководитель</label>
                  <select
                    value={formData.classTeacherId || ''}
                    onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Не назначен</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.shortName} ({t.fullName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Домашний кабинет</label>
                  <select
                    value={formData.homeRoomId || ''}
                    onChange={(e) => setFormData({ ...formData, homeRoomId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Без закрепления</option>
                    {classrooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.shortName} ({r.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Выбор цвета маркера */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border">
                <label className="text-xs font-semibold text-slate-700">Цвет маркера:</label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, colorHex: color })}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        formData.colorHex === color ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Конструктор подгрупп класса */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    <Split className="w-4 h-4 text-emerald-600" />
                    <span>Деление класса на подгруппы</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCustomSubgroup}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    + Добавить подгруппу
                  </button>
                </div>

                {/* Быстрые шаблоны деления */}
                <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                  <span className="text-slate-500">Шаблоны:</span>
                  {presetSubgroupTemplates.map((tpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplySubgroupTemplate(idx)}
                      className="px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700 transition"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>

                {/* Список текущих подгрупп */}
                <div className="space-y-2 pt-2">
                  {formData.subgroups?.map((sg, index) => (
                    <div key={sg.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center">#{index + 1}</span>
                      <input
                        type="text"
                        value={sg.name}
                        onChange={(e) => {
                          const updated = [...(formData.subgroups || [])];
                          updated[index] = { ...sg, name: e.target.value };
                          setFormData({ ...formData, subgroups: updated });
                        }}
                        placeholder="Название (напр. 1 группа)"
                        className="flex-1 px-2.5 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={sg.shortName}
                        onChange={(e) => {
                          const updated = [...(formData.subgroups || [])];
                          updated[index] = { ...sg, shortName: e.target.value };
                          setFormData({ ...formData, subgroups: updated });
                        }}
                        placeholder="Код (Гр.1)"
                        maxLength={8}
                        className="w-20 px-2 py-1 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubgroup(sg.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Удалить подгруппу"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Матрица доступности класса Time-Off */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                    Ограничения по времени класса (Time-Off)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Запреты на определенные часы (напр. поздние уроки для младших классов)
                  </span>
                </div>
                <TimeGridPicker
                  daysCount={settings.daysPerWeek}
                  maxLessons={settings.maxLessonsPerDay}
                  timeGrid={formData.timeGrid || {}}
                  onChange={(newGrid) => setFormData({ ...formData, timeGrid: newGrid })}
                />
              </div>
            </div>

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