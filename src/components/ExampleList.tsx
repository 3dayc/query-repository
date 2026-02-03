import type { DbQuery } from '../types/db';
import clsx from 'clsx';
import { Lightbulb, Trash2, GripVertical } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragEndEvent,
    type DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

interface ExampleListProps {
    queries: DbQuery[];
    selectedQueryId: string | null;
    onSelect: (query: DbQuery) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
    onReorder: (queries: DbQuery[]) => void;
}

function SortableQueryItem({ query, selectedQueryId, onSelect, onDelete }: {
    query: DbQuery,
    selectedQueryId: string | null,
    onSelect: (query: DbQuery) => void,
    onDelete: (id: string) => void
}) {
    const { openConfirm } = useAppStore();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: query.id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.4 : 1
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group mb-2">
            <div
                className={clsx(
                    "w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden flex items-start gap-2 select-none",
                    selectedQueryId === query.id
                        ? "bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]"
                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                )}
            >
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing mt-1">
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(query)}>
                    <div className="flex items-center justify-between mb-1 pr-6">
                        <span className={clsx(
                            "font-medium transition-colors text-sm truncate",
                            selectedQueryId === query.id ? "text-cyan-300" : "text-slate-300 group-hover:text-slate-200"
                        )}>
                            {query.title}
                        </span>

                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 font-mono opacity-70">
                        {query.sql_code}
                    </p>
                </div>
            </div>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    openConfirm('Delete Query', `Delete query "${query.title}"?`, () => onDelete(query.id));
                }}
                className="absolute right-2 top-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900/80 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

export function ExampleList({ queries, selectedQueryId, onSelect, onDelete, onCreate, onReorder }: ExampleListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = queries.findIndex((q) => q.id === active.id);
            const newIndex = queries.findIndex((q) => q.id === over?.id);
            onReorder(arrayMove(queries, oldIndex, newIndex));
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-slate-200">Examples</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-700">
                {queries.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No queries yet.</p>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={queries.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {queries.map((query) => (
                                <SortableQueryItem
                                    key={query.id}
                                    query={query}
                                    selectedQueryId={selectedQueryId}
                                    onSelect={onSelect}
                                    onDelete={onDelete}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
