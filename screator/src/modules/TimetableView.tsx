import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useAppStore } from '../store';
import type { LessonCard, TimetableViewMode } from '../types';
import { RefreshCw, AlertTriangle, LayoutGrid } from 'lucide-react';

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function CardChip({ card, subjectName, subjectColor, label, isConflict }: {
  card: LessonCard;
  subjectName: string;
  subjectColor: string;
  label: string;
  isConflict: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { card },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ borderLeftColor: subjectColor, opacity: isDragging ? 0.4 : 1 }}
      className={`cursor-grab active:cursor-grabbing rounded-lg border-l-4 bg-white shadow-sm p-2 text-xs select-none touch-none ${
        isConflict ? 'ring-2 ring-rose-500 bg-rose-50' : 'border border-slate-200'
      }`}
    >
      <div className="font-bold text-slate-800 truncate">{subjectName}</div>
      <div className="text-slate-500 truncate">{label}</div>
      {card.pairIndex && (
        <div className="text-[10px] text-slate-400 mt-0.5">Пара {card.pairIndex}/2</div>
      )}
      {isConflict && (
        <div className="flex items-center gap-1 text-[10px] text-rose-600 mt-1 font-semibold">
          <AlertTriangle className="w-3 h-3" /> Конфликт
        </div>
      )}
    </div>
  );
}

function DroppableCell({ day, slot, children }: { day: number; slot: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${day}-${slot}`, data: { day, slot } });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[72px] p-1.5 border border-slate-200 rounded-lg transition-colors space-y-1 ${
        isOver ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50/50'
      }`}
    >
      {children}
    </div>
  );
}

export const TimetableView = () => {
  const {
    cards,
    lessons,
    subjects,
    teachers,
    classes,
    settings,
    timetableView,
    setTimetableView,
    generateCardsFromLessons,
    placeCard,
    unplaceCard,
    getConflicts,
  } = useAppStore();

  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [activeCard, setActiveCard] = useState<LessonCard | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (cards.length === 0 && lessons.length > 0) {
      generateCardsFromLessons();
    }
  }, [cards.length, lessons.length, generateCardsFromLessons]);

  const entityOptions = useMemo(() => {
  const allOption = { id: 'all', label: 'Все' };
  if (timetableView === 'classes') return [allOption, ...classes.map((c) => ({ id: c.id, label: c.name }))];
  if (timetableView === 'teachers') return [allOption, ...teachers.map((t) => ({ id: t.id, label: t.shortName }))];
  return [allOption];
}, [timetableView, classes, teachers]);

useEffect(() => {
  if (entityOptions.length > 0 && !entityOptions.find((e) => e.id === selectedEntityId)) {
    setSelectedEntityId('all');
  }
}, [entityOptions, selectedEntityId]);

  const conflicts = getConflicts();
  const conflictCardIds = new Set(conflicts.map((c) => c.cardId));

const visibleCards = useMemo(() => {
  if (!selectedEntityId || selectedEntityId === 'all') return cards;
  if (timetableView === 'classes') {
    return cards.filter((c) => c.targets.some((t) => t.classId === selectedEntityId));
  }
  if (timetableView === 'teachers') {
    return cards.filter((c) => c.teacherIds.includes(selectedEntityId));
  }
  return cards;
}, [cards, selectedEntityId, timetableView]);

  const unplacedCards = visibleCards.filter((c) => c.day === null || c.slot === null);

  const getSubject = (id: string) => subjects.find((s) => s.id === id);
  const getCardLabel = (card: LessonCard) => {
    if (timetableView === 'teachers') {
      const classNames = card.targets.map((t) => classes.find((c) => c.id === t.classId)?.shortName).filter(Boolean);
      return classNames.join(', ');
    }
    const teacherNames = card.teacherIds.map((tid) => teachers.find((t) => t.id === tid)?.shortName).filter(Boolean);
    return teacherNames.join(', ');
  };

  const handleDragStart = (event: DragStartEvent) => {
    const found = cards.find((c) => c.id === event.active.id);
    setActiveCard(found || null);
    setErrorMsg('');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cellData = over.data.current as { day: number; slot: number } | undefined;
    if (!cellData) return;

    const result = placeCard(String(active.id), cellData.day, cellData.slot);
    if (!result.success && result.error) {
      setErrorMsg(result.error);
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleViewChange = (mode: TimetableViewMode) => {
    setTimetableView(mode);
    setSelectedEntityId('');
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-6 w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Доска расписания</h2>
            <p className="text-sm text-slate-500 mt-1">
              Перетаскивайте карточки уроков из пула в ячейки сетки. Конфликты подсвечиваются красным.
            </p>
          </div>
          <button
            type="button"
            onClick={generateCardsFromLessons}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Пересобрать карточки из уроков
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(['classes', 'teachers', 'classrooms'] as TimetableViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleViewChange(mode)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                  timetableView === mode ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {mode === 'classes' ? 'По классам' : mode === 'teachers' ? 'По учителям' : 'По кабинетам'}
              </button>
            ))}
          </div>

          {entityOptions.length > 0 && (
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white"
            >
              {entityOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          )}

          {conflicts.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              Конфликтов: {conflicts.length}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2 max-h-[600px] overflow-y-auto">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mb-1">
              <LayoutGrid className="w-3.5 h-3.5" />
              Нерасставлено ({unplacedCards.length})
            </div>
            {unplacedCards.length === 0 && (
              <p className="text-xs text-slate-400">Все уроки расставлены.</p>
            )}
            {unplacedCards.map((card) => {
              const subject = getSubject(card.subjectId);
              return (
                <CardChip
                  key={card.id}
                  card={card}
                  subjectName={subject?.shortName || '—'}
                  subjectColor={subject?.colorHex || '#94a3b8'}
                  label={getCardLabel(card)}
                  isConflict={conflictCardIds.has(card.id)}
                />
              );
            })}
          </div>

          <div className="overflow-x-auto">
            <div
              className="grid gap-2 min-w-[720px]"
              style={{ gridTemplateColumns: `70px repeat(${settings.daysPerWeek}, 1fr)` }}
            >
              <div />
              {DAY_NAMES.slice(0, settings.daysPerWeek).map((day) => (
                <div key={day} className="text-xs font-bold text-slate-700 text-center pb-1">{day}</div>
              ))}

              {Array.from({ length: settings.maxLessonsPerDay }, (_, i) => i + 1).map((slot) => (
                <div key={slot} className="contents">
                  <div className="text-xs font-semibold text-slate-400 flex items-center justify-center">
                    Урок {slot}
                  </div>
                  {Array.from({ length: settings.daysPerWeek }, (_, i) => i + 1).map((day) => {
                    const cardsHere = visibleCards.filter((c) => c.day === day && c.slot === slot);
                    return (
                      <DroppableCell key={`${day}-${slot}`} day={day} slot={slot}>
                        {cardsHere.map((card) => {
                          const subject = getSubject(card.subjectId);
                          return (
                            <div
                              key={card.id}
                              onDoubleClick={() => unplaceCard(card.id)}
                              title="Двойной клик — вернуть в пул"
                            >
                              <CardChip
                                card={card}
                                subjectName={subject?.shortName || '—'}
                                subjectColor={subject?.colorHex || '#94a3b8'}
                                label={getCardLabel(card)}
                                isConflict={conflictCardIds.has(card.id)}
                              />
                            </div>
                          );
                        })}
                      </DroppableCell>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCard ? (
          <CardChip
            card={activeCard}
            subjectName={getSubject(activeCard.subjectId)?.shortName || '—'}
            subjectColor={getSubject(activeCard.subjectId)?.colorHex || '#94a3b8'}
            label={getCardLabel(activeCard)}
            isConflict={conflictCardIds.has(activeCard.id)}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
