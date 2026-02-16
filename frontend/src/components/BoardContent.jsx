import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useAuth } from '../context/AuthContext';
import { lists as listsApi, tasks as tasksApi } from '../api/client';
import ListColumn from './ListColumn';
import TaskCard from './TaskCard';
import styles from './BoardContent.module.css';

export default function BoardContent({ board, onRefresh }) {
  const { user } = useAuth();
  const isBoardOwner = board?.createdBy?._id?.toString() === user?.id || board?.createdBy?.toString() === user?.id;
  const [lists, setLists] = useState(board?.lists || []);
  const [activeTask, setActiveTask] = useState(null);
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [creating, setCreating] = useState(false);

  React.useEffect(() => {
    setLists(board?.lists || []);
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = lists.flatMap((l) => l.tasks || []).find((t) => t._id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (!activeId || activeId === overId) return;

    const task = lists.flatMap((l) => l.tasks || []).find((t) => t._id === activeId);
    if (!task) return;

    const overList = lists.find((l) => l._id === overId || (l.tasks || []).some((t) => t._id === overId));
    const targetListId = overList?._id;
    if (!targetListId) return;

    const targetList = lists.find((l) => l._id === targetListId);
    const targetTasks = targetList?.tasks || [];
    let newOrder = 0;
    const overTask = targetTasks.find((t) => t._id === overId);
    if (overTask) {
      const idx = targetTasks.findIndex((t) => t._id === overId);
      newOrder = idx >= 0 ? idx : targetTasks.length;
    }

    try {
      await tasksApi.move(task._id, targetListId, newOrder);
      onRefresh();
    } catch (err) {
      console.error(err);
      onRefresh();
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;
    setCreating(true);
    try {
      await listsApi.create(board._id, newListTitle.trim());
      setNewListTitle('');
      setAddingList(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const allTaskIds = lists.flatMap((l) => (l.tasks || []).map((t) => t._id));

  return (
    <div className={styles.board}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allTaskIds} strategy={verticalListSortingStrategy}>
          {lists.map((list) => (
            <ListColumn
              key={list._id}
              list={list}
              boardId={board._id}
              onRefresh={onRefresh}
              isBoardOwner={isBoardOwner}
            />
          ))}

          {addingList ? (
            <form onSubmit={handleAddList} className={styles.addListForm}>
              <input
                type="text"
                placeholder="List title"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                autoFocus
                className={styles.input}
              />
              <div className={styles.addListActions}>
                <button type="submit" disabled={creating} className={styles.submitBtn}>
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddingList(false);
                    setNewListTitle('');
                  }}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className={styles.addListBtn}
            >
              + Add List
            </button>
          )}
        </SortableContext>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} list={{}} isOverlay />
            ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
