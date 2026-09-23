import { useState } from 'react';
import { useAppStore } from '../store';
import { School, Clock, CalendarDays, RefreshCw, CheckCircle2 } from 'lucide-react';

export const SchoolSettingsView: React.FC = () => {
  const { settings, updateSettings, setMaxLessonsPerDay, updateTimeSlot, recalculateAllSlots } = useAppStore();

  const [firstStart, setFirstStart] = useState('08:30');
  const [duration, setDuration] = useState(45);
  const [defaultBreak, setDefaultBreak] = useState(10);
  const [autoCalculatedMessage, setAutoCalculatedMessage] = useState(false);

  const handleRecalculate = () => {
    recalculateAllSlots(firstStart, duration, defaultBreak);
    setAutoCalculatedMessage(true);
    setTimeout(() => setAutoCalculatedMessage(false), 3000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Параметры учебного заведения</h2>
        <p className="text-sm text-slate-500 mt-1">Базовые настройки школы, структура недели и сетка звонков.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Левая панель: настройки организации */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold border-b pb-3">
            <School className="w-5 h-5" />
            <h3>Учебное заведение</h3>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Название организации</label>
              <input
                type="text"
                value={settings.schoolName}
                onChange={(e) => updateSettings({ schoolName: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-700 mb-1">Учебный год</label>
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => updateSettings({ academicYear: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
                <CalendarDays className="w-4 h-4 text-emerald-600" />
                <h4>Структура недели</h4>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Дней в неделю</label>
                <select
                  value={settings.daysPerWeek}
                  onChange={(e) => updateSettings({ daysPerWeek: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={5}>5 дней (Пн – Пт, пятидневка)</option>
                  <option value={6}>6 дней (Пн – Сб, шестидневка)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Максимум уроков в день</label>
                <select
                  value={settings.maxLessonsPerDay}
                  onChange={(e) => setMaxLessonsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {[5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} уроков</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Правая панель: сетка звонков */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
            <div className="flex items-center gap-2 text-emerald-600 font-semibold">
              <Clock className="w-5 h-5" />
              <h3>Сетка звонков (Уроков: {settings.maxLessonsPerDay})</h3>
            </div>

            {autoCalculatedMessage && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" /> Сетка пересчитана!
              </span>
            )}
          </div>

          {/* Быстрый автогенератор звонков */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Авторасчёт расписания звонков
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Старт 1-го урока</label>
                <input
                  type="time"
                  value={firstStart}
                  onChange={(e) => setFirstStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Длительность урока</label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Базовая перемена</label>
                <input
                  type="number"
                  min="5"
                  max="45"
                  value={defaultBreak}
                  onChange={(e) => setDefaultBreak(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono bg-white"
                />
              </div>
              <button
                type="button"
                onClick={handleRecalculate}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Рассчитать</span>
              </button>
            </div>
          </div>

          {/* Таблица слотов */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-y">
                <tr>
                  <th className="py-3 px-4">Урок</th>
                  <th className="py-3 px-4">Начало</th>
                  <th className="py-3 px-4">Окончание</th>
                  <th className="py-3 px-4">Перемена после урока</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settings.timeSlots.slice(0, settings.maxLessonsPerDay).map((slot) => (
                  <tr key={slot.slotNumber} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-bold text-slate-700">Урок {slot.slotNumber}</td>
                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => updateTimeSlot(slot.slotNumber, 'startTime', e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => updateTimeSlot(slot.slotNumber, 'endTime', e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="60"
                          value={slot.breakDurationMinutes}
                          onChange={(e) => updateTimeSlot(slot.slotNumber, 'breakDurationMinutes', Number(e.target.value))}
                          className="w-16 px-2 py-1 border border-slate-300 rounded-md text-xs font-mono"
                        />
                        <span className="text-xs text-slate-500">мин</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};