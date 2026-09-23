import { useState } from 'react';
import { useAppStore } from '../store';
import type { Classroom, ClassroomType } from '../types';
import { TimeGridPicker } from '../components/TimeGridPicker';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  DoorClosed,
  Building,
  Users
} from 'lucide-react';

const presetColors = ['#64748b', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const roomTypeMeta: Record<ClassroomType, { label: string; dotColor: string; bg: string; text: string }> = {
  regular: { label: 'Обычный учебный', dotColor: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-700' },
  computer: { label: 'Компьютерный класс', dotColor: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  gym: { label: 'Спортивный зал', dotColor: 'bg-amber-500', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800' },
  lab_physics: { label: 'Лаборатория физики', dotColor: 'bg-cyan-500', bg: 'bg-cyan-50 border-cyan-200', text: 'text-cyan-800' },
  lab_chem_bio: { label: 'Химия / Биология', dotColor: 'bg-teal-500', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800' },
  workshop: { label: 'Мастерская труда', dotColor: 'bg-orange-500', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800' },
  auditorium: { label: 'Актовый зал', dotColor: 'bg-purple-500', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
};

export const ClassroomsView = () => {
  const { classrooms, addClassroom, updateClassroom, deleteClassroom, settings } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Classroom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Classroom>>({
    name: '',
    shortName: '',
    building: 'Главный корпус',
    roomType: 'regular',
    capacity: 30,
    isShared: false,
    colorHex: '#64748b',
    timeGrid: {},
  });

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      shortName: '',
      building: 'Главный корпус',
      roomType: 'regular',
      capacity: 30,
      isShared: false,
      colorHex: presetColors[Math.floor(Math.random() * presetColors.length)],
      timeGrid: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Classroom) => {
    setEditingRoom(room);
    setErrorMessage(null);
    setFormData({ ...room });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      setErrorMessage('Укажите название или номер кабинета.');
      return;
    }

    const cap = Math.floor(Number(formData.capacity));
    if (isNaN(cap) || cap <= 0 || cap > 500) {
      setErrorMessage('Вместимость должна быть целым числом от 1 до 500.');
      return;
    }

    if (editingRoom) {
      const res = updateClassroom(editingRoom.id, { ...formData, capacity: cap });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при сохранении.');
        return;
      }
    } else {
      const res = addClassroom({
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim().slice(0, 5),
        building: formData.building?.trim() || 'Главный корпус',
        roomType: formData.roomType || 'regular',
        capacity: cap,
        isShared: !!formData.isShared,
        colorHex: formData.colorHex || '#64748b',
        timeGrid: formData.timeGrid || {},
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при добавлении.');
        return;
      }
    }
    setIsModalOpen(false);
  };

  const filteredRooms = classrooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.building.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || r.roomType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 select-none w-full">
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Справочник кабинетов</h2>
          <p className="text-sm text-slate-500 mt-1">
            Фонд помещений школы, типы аудиторий, вместимость и графики доступности.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить кабинет</span>
        </button>
      </div>

      {/* Поиск и фильтры */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по номеру, названию или корпусу..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Тип:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Все типы помещений</option>
            <option value="regular">Обычные учебные</option>
            <option value="computer">Компьютерные классы</option>
            <option value="gym">Спортзалы</option>
            <option value="lab_physics">Лаборатории физики</option>
            <option value="lab_chem_bio">Химия / Биология</option>
            <option value="workshop">Мастерские труда</option>
            <option value="auditorium">Актовые залы</option>
          </select>
        </div>
      </div>

      {/* Адаптивный контейнер таблицы с защитой границ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[840px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-28">Код</th>
                <th className="py-3.5 px-4">Название кабинета</th>
                <th className="py-3.5 px-4 w-44">Корпус</th>
                <th className="py-3.5 px-4 w-52">Тип помещения</th>
                <th className="py-3.5 px-4 w-32">Вместимость</th>
                <th className="py-3.5 px-4 w-36">Режим</th>
                <th className="py-3.5 px-4 w-24 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRooms.map((room) => {
                const meta = roomTypeMeta[room.roomType] || roomTypeMeta.regular;
                return (
                  <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0"
                          style={{ backgroundColor: room.colorHex }}
                        />
                        <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                          {room.shortName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {room.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{room.building}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${meta.bg} ${meta.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dotColor}`} />
                        <span>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{room.capacity} мест</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {room.isShared ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-300">
                          Общий
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Один класс</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Редактировать кабинет"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteClassroom(room.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Удалить кабинет"
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

      {/* Модальное окно */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-2">
                <DoorClosed className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingRoom ? `Редактирование: ${editingRoom.name}` : 'Новый кабинет'}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Название / Номер кабинета *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Например: Кабинет 204"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Краткий код (для расписания)</label>
                  <input
                    type="text"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    maxLength={8}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="204"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Корпус / Здание</label>
                  <input
                    type="text"
                    value={formData.building || ''}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                    placeholder="Главный корпус"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Тип помещения</label>
                  <select
                    value={formData.roomType || 'regular'}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value as ClassroomType })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="regular">Обычный учебный</option>
                    <option value="computer">Компьютерный класс (ИКТ)</option>
                    <option value="gym">Спортивный зал</option>
                    <option value="lab_physics">Лаборатория физики</option>
                    <option value="lab_chem_bio">Химия / Биология</option>
                    <option value="workshop">Мастерская труда</option>
                    <option value="auditorium">Актовый зал</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Вместимость (чел.)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={formData.capacity || 30}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border">
                <div className="flex items-center gap-3">
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

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!formData.isShared}
                    onChange={(e) => setFormData({ ...formData, isShared: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Совместный режим (несколько групп одновременно)
                  </span>
                </label>
              </div>

              {/* Матрица доступности Time-Off */}
              <div>
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Доступность кабинета по времени (Time-Off)
                </h4>
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