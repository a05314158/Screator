import { useState } from 'react';
import { useAppStore } from '../store';
import type { Teacher } from '../types';
import { TimeGridPicker } from '../components/TimeGridPicker';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  GraduationCap,
  DoorClosed,
  Phone,
  Clock
} from 'lucide-react';

const presetColors = ['#3b82f6', '#06b6d4', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

// Функция для автогенерации сокращения из полного ФИО
function generateShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} ${parts[1][0]}.`;
  return `${parts[0]} ${parts[1][0]}.${parts[2][0]}.`;
}

export const TeachersView = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, classrooms, settings } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Teacher>>({
    fullName: '',
    shortName: '',
    contractHours: 18,
    phone: '',
    email: '',
    defaultRoomId: '',
    colorHex: '#3b82f6',
    timeGrid: {},
  });

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setErrorMessage(null);
    setFormData({
      fullName: '',
      shortName: '',
      contractHours: 18,
      phone: '',
      email: '',
      defaultRoomId: '',
      colorHex: presetColors[Math.floor(Math.random() * presetColors.length)],
      timeGrid: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setErrorMessage(null);
    setFormData({ ...teacher });
    setIsModalOpen(true);
  };

  const handleFullNameChange = (name: string) => {
    const updated: Partial<Teacher> = { fullName: name };
    // Если сокращение еще не трогали руками или оно пустое — генерируем автоматически
    if (!formData.shortName || formData.shortName === generateShortName(formData.fullName || '')) {
      updated.shortName = generateShortName(name);
    }
    setFormData((prev) => ({ ...prev, ...updated }));
  };

  const handleSave = () => {
    if (!formData.fullName?.trim()) {
      setErrorMessage('Укажите ФИО преподавателя.');
      return;
    }

    const hours = Math.floor(Number(formData.contractHours));
    if (isNaN(hours) || hours <= 0 || hours > 60) {
      setErrorMessage('Ставка должна быть числом от 1 до 60 часов в неделю.');
      return;
    }

    if (editingTeacher) {
      const res = updateTeacher(editingTeacher.id, { ...formData, contractHours: hours });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при сохранении.');
        return;
      }
    } else {
      const res = addTeacher({
        fullName: formData.fullName.trim(),
        shortName: formData.shortName?.trim() || generateShortName(formData.fullName),
        contractHours: hours,
        phone: formData.phone?.trim() || undefined,
        email: formData.email?.trim() || undefined,
        defaultRoomId: formData.defaultRoomId || undefined,
        colorHex: formData.colorHex || '#3b82f6',
        timeGrid: formData.timeGrid || {},
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при добавлении.');
        return;
      }
    }
    setIsModalOpen(false);
  };

  const filteredTeachers = teachers.filter((t) => {
    const term = searchTerm.toLowerCase();
    return (
      t.fullName.toLowerCase().includes(term) ||
      t.shortName.toLowerCase().includes(term) ||
      (t.phone && t.phone.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 select-none w-full">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Преподавательский состав</h2>
          <p className="text-sm text-slate-500 mt-1">
            Список учителей школы, нормы недельной нагрузки, закрепленные кабинеты и метод-дни (Time-Off).
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить учителя</span>
        </button>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по ФИО, сокращению или телефону..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Адаптивная таблица учителей */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-44">Сокращение</th>
                <th className="py-3.5 px-4">ФИО преподавателя</th>
                <th className="py-3.5 px-4 w-36">Ставка</th>
                <th className="py-3.5 px-4 w-48">Свой кабинет</th>
                <th className="py-3.5 px-4 w-44">Контакты</th>
                <th className="py-3.5 px-4 w-24 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => {
                const assignedRoom = classrooms.find((r) => r.id === teacher.defaultRoomId);
                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0"
                          style={{ backgroundColor: teacher.colorHex }}
                        />
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                          {teacher.shortName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {teacher.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800">{teacher.contractHours} ч.</span>
                        <span className="text-slate-400">/ нед.</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {assignedRoom ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <DoorClosed className="w-3 h-3 text-slate-500" />
                          <span>{assignedRoom.shortName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Не закреплен</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {teacher.phone ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Редактировать учителя"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteTeacher(teacher.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить учителя"
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
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingTeacher ? `Редактирование: ${editingTeacher.fullName}` : 'Новый преподаватель'}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">ФИО преподавателя *</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleFullNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Иванова Елена Петровна"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Сокращение</label>
                  <input
                    type="text"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    maxLength={16}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Иванова Е.П."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ставка (часов/нед.)</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formData.contractHours || 18}
                    onChange={(e) => setFormData({ ...formData, contractHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Закрепленный кабинет</label>
                  <select
                    value={formData.defaultRoomId || ''}
                    onChange={(e) => setFormData({ ...formData, defaultRoomId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Без закрепления</option>
                    {classrooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.shortName} ({room.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Телефон для связи</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="+7 (999) 000-00-00"
                  />
                </div>
              </div>

              {/* Выбор цвета маркера */}
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border">
                <label className="text-xs font-semibold text-slate-700">Цвет маркера в расписании:</label>
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

              {/* Персональная матрица доступности (Time-Off) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider">
                    Индивидуальная доступность (Метод-дни / Ограничения)
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Установите запреты на дни или уроки
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