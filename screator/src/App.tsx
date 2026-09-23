import { Navigation } from './components/Navigation';
import { SchoolSettingsView } from './modules/SchoolSettingsView';
import { SubjectsView } from './modules/SubjectsView';
import { ClassroomsView } from './modules/ClassroomsView';
import { TeachersView } from './modules/TeachersView';
import { ClassesView } from './modules/ClassesView';
import { LessonsView } from './modules/LessonsView';
import { ConstraintsView } from './modules/ConstraintsView';
import { TimetableView } from './modules/TimetableView';
import { useAppStore } from './store';

import './App.css';

export function App() {
  const { activeStep } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-800">
      <Navigation />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto">
        {activeStep === 'settings' && <SchoolSettingsView />}
        {activeStep === 'subjects' && <SubjectsView />}
        {activeStep === 'classrooms' && <ClassroomsView />}
        {activeStep === 'teachers' && <TeachersView />}
        {activeStep === 'classes' && <ClassesView />}
        {activeStep === 'lessons' && <LessonsView />}
          {activeStep === 'timetable' && <TimetableView />}
        {activeStep === 'constraints' && <ConstraintsView />}


        {activeStep === 'timetable' && (
          <div className="max-w-3xl mx-auto mt-20 text-center p-8 bg-white rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xl font-bold text-slate-800">Интерактивная доска расписания</h3>
            <p className="text-slate-500 text-sm mt-2">
              Переходим к Шагу 8: Drag-and-Drop расстановка карточек уроков по дням и слотам.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;