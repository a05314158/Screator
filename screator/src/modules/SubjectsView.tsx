import { useState } from 'react';
import { useAppStore } from '../store';
import type { Subject } from '../types';
import { TimeGridPicker } from '../components/TimeGridPicker';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

const presetColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export const SubjectsView = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, settings } = useAppStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    shortName: '',
    colorHex: '#3b82f6',
    allowDoubleLessons: false,
    timeGrid: {},
  });

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setErrorMessage(null);
    setFormData({
      name: '',
      shortName: '',
      colorHex: presetColors[Math.floor(Math.random() * presetColors.length)],
      allowDoubleLessons: false,
      timeGrid: {},
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setErrorMessage(null);
    setFormData({ ...subject });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      setErrorMessage('Укажите название предмета.');
      return;
    }

    if (editingSubject) {
      const res = updateSubject(editingSubject.id, formData);
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при сохранении.');
        return;
      }
    } else {
      const res = addSubject({
        name: formData.name.trim(),
        shortName: formData.shortName?.trim() || formData.name.trim().slice(0, 4),
        colorHex: formData.colorHex || '#3b82f6',
        allowDoubleLessons: !!formData.allowDoubleLessons,
        timeGrid: formData.timeGrid || {},
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Ошибка при добавлении.');
        return;
      }
    }
    setIsModalOpen(false);
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Справочник предметов</h2>
          <p className="text-sm text-slate-500 mt-1">Список дисциплин, параметры сдвоенных уроков и матрица ограничений по времени.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-lg shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить предмет</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск предмета..."
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 w-28">Код</th>
                <th className="py-3.5 px-4">Название предмета</th>
                <th className="py-3.5 px-4 w-44">Сдвоенные уроки</th>
                <th className="py-3.5 px-4 w-24 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubjects.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full shadow-inner border border-black/10 shrink-0" style={{ backgroundColor: sub.colorHex }} />
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">{sub.shortName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{sub.name}</td>
                  <td className="py-3.5 px-4">
                    {sub.allowDoubleLessons ? (
                      <span className="inline-flex items-center text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Разрешены</span>
                    ) : (
                      <span className="text-xs text-slate-500">Строго по 1 уроку</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleOpenEdit(sub)} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteSubject(sub.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модалка предмета */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">
                {editingSubject ? `Редактирование: ${editingSubject.name}` : 'Новый предмет'}
              </h3>
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
                  <label className="block font-medium text-slate-700 mb-1">Название предмета *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Например: Химия"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Сокращение</label>
                  <input
                    type="text"
                    value={formData.shortName || ''}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    maxLength={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="Хим"
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
                    checked={!!formData.allowDoubleLessons}
                    onChange={(e) => setFormData({ ...formData, allowDoubleLessons: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Сдвоенные уроки (пары)</span>
                </label>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Доступность по времени (Сетка ограничений)
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