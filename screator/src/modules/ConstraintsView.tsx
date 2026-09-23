import { useAppStore } from '../store';
import { SlidersHorizontal, Clock, GraduationCap, BookOpen, Info } from 'lucide-react';

export const ConstraintsView = () => {
  const { constraints, toggleConstraint, updateConstraint, teachers, lessons, settings } = useAppStore();
  const totalWeeklyLessons = lessons.reduce((sum, lesson) => sum + lesson.hoursPerWeek, 0);
  const totalTeacherCapacity = teachers.reduce((sum, teacher) => sum + teacher.contractHours, 0);
  const totalSlotsPerWeek = settings.daysPerWeek * settings.maxLessonsPerDay;

  return (
    <div className="space-y-8 select-none w-full">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Связи и ограничения</h2>
        <p className="text-sm text-slate-500 mt-1">Параметры для будущей генерации расписания. Эти правила пока не проверяют размещение уроков.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs"><span>Часов в учебном плане:</span><BookOpen className="w-4 h-4 text-emerald-600" /></div>
          <div className="text-2xl font-bold text-slate-900">{totalWeeklyLessons} ч.</div>
          <p className="text-[11px] text-slate-400">Сумма часов всех записей нагрузки</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs"><span>Фонд часов учителей:</span><GraduationCap className="w-4 h-4 text-blue-600" /></div>
          <div className="text-2xl font-bold text-slate-900">{totalTeacherCapacity} ч.</div>
          <p className="text-[11px] text-slate-500">{totalWeeklyLessons > totalTeacherCapacity ? 'Суммарный дефицит часов; проверьте нагрузку каждого учителя.' : 'Общего фонда часов достаточно, но это не гарантирует выполнимость расписания.'}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs"><span>Слотов в неделе:</span><Clock className="w-4 h-4 text-purple-600" /></div>
          <div className="text-2xl font-bold text-slate-900">{totalSlotsPerWeek}</div>
          <p className="text-[11px] text-slate-400">{settings.daysPerWeek} дней × {settings.maxLessonsPerDay} уроков</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-emerald-600" />Настройки будущего решателя</h3>
          <span className="text-xs text-slate-500">Выбрано: {constraints.filter((constraint) => constraint.isEnabled).length} из {constraints.length}</span>
        </div>
        {constraints.map((constraint) => (
          <div key={constraint.id} className={`p-5 rounded-xl border ${constraint.isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/70 border-slate-200 opacity-60'}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 text-sm">{constraint.title}</span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${constraint.strength === 'hard' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{constraint.strength === 'hard' ? 'Жёсткое' : 'Мягкое'}</span>
                  <span className="text-[10px] text-slate-500">Пока не применяется</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{constraint.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {constraint.strength === 'soft' && constraint.isEnabled && (
                  <label className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                    <span className="text-slate-500">Вес:</span>
                    <input type="range" min="1" max="10" value={constraint.weight} onChange={(event) => updateConstraint(constraint.id, { weight: Number(event.target.value) })} className="w-20 accent-emerald-600" />
                    <span className="font-mono font-bold text-slate-800">{constraint.weight}</span>
                  </label>
                )}
                <button type="button" role="switch" aria-label={`Включить настройку: ${constraint.title}`} aria-checked={constraint.isEnabled} onClick={() => toggleConstraint(constraint.id)} className={`relative inline-flex h-6 w-11 items-center rounded-full ${constraint.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${constraint.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <p>Готовность к составлению расписания ещё не проверена. Выбранные здесь правила пока не применяются при ручной расстановке и не запускают автоматическую генерацию.</p>
      </div>
    </div>
  );
};
