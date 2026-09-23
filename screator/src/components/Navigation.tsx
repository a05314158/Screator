import { useAppStore } from '../store';
import type { ActiveStep } from '../types';
import {
  Building2,
  BookOpen,
  DoorClosed,
  GraduationCap,
  Users,
  Layers,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';

const navItems = [
  { id: 'settings' as ActiveStep, label: 'Параметры', stepNumber: 1, icon: <Building2 className="w-4 h-4" /> },
  { id: 'subjects' as ActiveStep, label: 'Предметы', stepNumber: 2, icon: <BookOpen className="w-4 h-4" /> },
  { id: 'classrooms' as ActiveStep, label: 'Кабинеты', stepNumber: 3, icon: <DoorClosed className="w-4 h-4" /> },
  { id: 'teachers' as ActiveStep, label: 'Учителя', stepNumber: 4, icon: <GraduationCap className="w-4 h-4" /> },
  { id: 'classes' as ActiveStep, label: 'Классы', stepNumber: 5, icon: <Users className="w-4 h-4" /> },
  { id: 'lessons' as ActiveStep, label: 'Уроки', stepNumber: 6, icon: <Layers className="w-4 h-4" /> },
  { id: 'constraints' as ActiveStep, label: 'Связи', stepNumber: 7, icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'timetable' as ActiveStep, label: 'Расписание', stepNumber: 8, icon: <Calendar className="w-4 h-4" /> },
];

export const Navigation = () => {
  const { activeStep, setActiveStep, settings } = useAppStore();

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md select-none">
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white font-black text-sm px-2.5 py-1 rounded shadow">
            SC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide">SCreator</h1>
              <span className="text-xs text-slate-500">|</span>
              <span className="text-xs text-slate-300 font-medium">{settings.schoolName}</span>
            </div>
            <p className="text-[11px] text-slate-400">Учебный период: {settings.academicYear}</p>
          </div>
        </div>
      </div>

      <nav className="flex items-center px-4 overflow-x-auto bg-slate-950 scrollbar-none">
        {navItems.map((item) => {
          const isActive = activeStep === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveStep(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold tracking-wider transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-500'
              }`}>
                #{item.stepNumber}
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};