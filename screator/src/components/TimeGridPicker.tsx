import type { TimeAvailability } from '../types';
import { normalizeTimeGrid } from '../utils/security';
import { Check, HelpCircle, X } from 'lucide-react';

interface TimeGridPickerProps {
  daysCount: number;
  maxLessons: number;
  timeGrid: Record<number, TimeAvailability[]>;
  onChange: (newGrid: Record<number, TimeAvailability[]>) => void;
}

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const TimeGridPicker = ({
  daysCount,
  maxLessons,
  timeGrid,
  onChange,
}: TimeGridPickerProps) => {
  // Гарантируем строгую нормализацию без undefined при любых изменениях глобальных параметров
  const normalized = normalizeTimeGrid(timeGrid, daysCount, maxLessons);

  const toggleCell = (day: number, slot: number) => {
    const current = normalized[day]?.[slot] ?? 1;
    let next: TimeAvailability = 1;
    if (current === 1) next = 2;
    else if (current === 2) next = 0;
    else next = 1;

    const daySlots = [...normalized[day]];
    daySlots[slot] = next;
    onChange({ ...normalized, [day]: daySlots });
  };

  const toggleDayRow = (day: number) => {
    const daySlots = normalized[day] || [];
    const allAllowed = daySlots.every((s) => s === 1);
    const nextVal: TimeAvailability = allAllowed ? 0 : 1;
    onChange({ ...normalized, [day]: Array(maxLessons).fill(nextVal) });
  };

  const setAll = (val: TimeAvailability) => {
    const newGrid: Record<number, TimeAvailability[]> = {};
    for (let d = 0; d < daysCount; d++) {
      newGrid[d] = Array(maxLessons).fill(val);
    }
    onChange(newGrid);
  };

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 font-medium text-emerald-700">
            <Check className="w-3.5 h-3.5" /> Разрешено
          </span>
          <span className="flex items-center gap-1 font-medium text-amber-600">
            <HelpCircle className="w-3.5 h-3.5" /> Нежелательно
          </span>
          <span className="flex items-center gap-1 font-medium text-rose-600">
            <X className="w-3.5 h-3.5" /> Запрещено
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAll(1)}
            className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 transition text-[11px] font-medium text-slate-700"
          >
            Разрешить всё
          </button>
          <button
            type="button"
            onClick={() => setAll(0)}
            className="px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 transition text-[11px] font-medium text-rose-600"
          >
            Запретить всё
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
        <table className="w-full text-center text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
              <th className="py-2 px-3 text-left w-14 font-semibold">День</th>
              {Array.from({ length: maxLessons }).map((_, i) => (
                <th key={i} className="py-2 px-2 w-10 font-semibold border-l border-slate-200">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {Array.from({ length: daysCount }).map((_, dayIdx) => {
              const daySlots = normalized[dayIdx] || [];
              return (
                <tr key={dayIdx}>
                  <td
                    onClick={() => toggleDayRow(dayIdx)}
                    title="Кликните для переключения всего дня"
                    className="py-2 px-3 text-left font-bold text-slate-700 bg-slate-50 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    {dayNames[dayIdx] || `Д${dayIdx + 1}`}
                  </td>
                  {Array.from({ length: maxLessons }).map((_, slotIdx) => {
                    const status = daySlots[slotIdx] ?? 1;
                    return (
                      <td
                        key={slotIdx}
                        onClick={() => toggleCell(dayIdx, slotIdx)}
                        className={`py-2 px-2 border-l border-slate-200 cursor-pointer transition-colors ${
                          status === 1
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            : status === 2
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {status === 1 && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                          {status === 2 && <HelpCircle className="w-3.5 h-3.5 stroke-[2.5]" />}
                          {status === 0 && <X className="w-3.5 h-3.5 stroke-[2.5]" />}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-400 italic">
        * Клик по ячейке меняет статус. Клик по названию дня переключает весь день.
      </p>
    </div>
  );
};