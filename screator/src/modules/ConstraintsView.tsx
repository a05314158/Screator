import { useAppStore } from '../store';
import {
  SlidersHorizontal,
  ShieldCheck,
  AlertTriangle,
  Clock,
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  Info
} from 'lucide-react';

export const ConstraintsView = () => {
  const { constraints, toggleConstraint, updateConstraint, teachers, classes, lessons, settings } = useAppStore();

  // Быстрый диагностический аудит данных
  const totalWeeklyLessons = lessons.reduce((acc, l) => acc + l.hoursPerWeek, 0);
  const totalTeacherCapacity = teachers.reduce((acc, t) => acc + t.contractHours, 0);
  const totalSlotsPerWeek = settings.daysPerWeek * settings.maxLessonsPerDay;

  return (
    <div className="space-y-8 select-none w-full">
      {/* Заголовок */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Связи и ограничения (Constraints)</h2>
        <p className="text-sm text-slate-500 mt-1">
          Настройка балансировки нагрузки, лимитов окон, санитарных правил и диагностика готовности к генерации.
        </p>
      </div>

      {/* Панель аудита и сводки нагрузки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Всего уроков в плане:</span>
            <BookOpen className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalWeeklyLessons} ч.</div>
          <p className="text-[11px] text-slate-400">Суммарно по всем классам</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Фонд часов учителей:</span>
            <GraduationCap className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalTeacherCapacity} ч.</div>
          <p className="text-[11px] text-slate-400">
            {totalWeeklyLessons > totalTeacherCapacity ? (
              <span className="text-rose-600 font-medium">Дефицит ставок!</span>
            ) : (
              <span className="text-emerald-600 font-medium">Ставок достаточно</span>
            )}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Слотов в неделе:</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSlotsPerWeek}</div>
          <p className="text-[11px] text-slate-400">{settings.daysPerWeek} дней × {settings.maxLessonsPerDay} уроков</p>
        </div>
      </div>

      {/* Список правил и ограничений */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
            <span>Каталог системных правил генерации</span>
          </h3>
          <span className="text-xs text-slate-500">
            Активно: {constraints.filter((c) => c.isEnabled).length} из {constraints.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {constraints.map((c) => (
            <div
              key={c.id}
              className={`p-5 rounded-xl border transition-all ${
                c.isEnabled
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50/70 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{c.title}</span>
                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                      c.strength === 'hard'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {c.strength === 'hard' ? 'Жёсткое (Hard)' : 'Мягкое (Soft)'}
                    </span>
                    <span className="text-xs text-slate-400">• Категория: {c.category}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{c.description}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Ползунок важности для мягких правил */}
                  {c.strength === 'soft' && c.isEnabled && (
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                      <span className="text-slate-500 font-medium">Вес:</span>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={c.weight}
                        onChange={(e) => updateConstraint(c.id, { weight: Number(e.target.value) })}
                        className="w-20 accent-emerald-600 cursor-pointer"
                      />
                      <span className="font-mono font-bold text-slate-800 w-4">{c.weight}</span>
                    </div>
                  )}

                  {/* Тумблер включения/выключения */}
                  <button
                    type="button"
                    onClick={() => toggleConstraint(c.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      c.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        c.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Информационный блок */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">Готовность к переходу на интерактивную доску расписания:</p>
          <p className="text-emerald-700">
            Все базовые справочники (Школа, Предметы, Кабинеты, Учителя, Классы и Уроки) сформированы и проверены.
            Следующий шаг откроет полноценную доску расписания с сеткой по классам и учителям.
          </p>
        </div>
      </div>
    </div>
  );
};