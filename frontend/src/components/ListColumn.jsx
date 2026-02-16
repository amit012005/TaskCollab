import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { lists as listsApi, tasks as tasksApi } from '../api/client';
import TaskCard from './TaskCard';
import styles from './ListColumn.module.css';

export default function ListColumn({ list, boardId, onRefresh, isBoardOwner }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title || '');
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const tasks = list.tasks || [];
  const taskIds = tasks.map((t) => t._id);

  const { setNodeRef, isOver } = useDroppable({ id: list._id });

  const handleUpdateTitle = async () => {
    if (title.trim() === list.title) {
      setEditing(false);
      return;
    }
    try {
      await listsApi.update(list._id, { title: title.trim() });
      onRefresh();
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteList = async () => {
    if (!window.confirm('Delete this list and all its tasks?')) return;
    try {
      await listsApi.delete(list._id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      await tasksApi.create(list._id, { title: newTaskTitle.trim() });
      setNewTaskTitle('');
      setAddingTask(false);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.isOver : ''}`}
    >
      <div className={styles.header}>
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
            autoFocus
            className={styles.titleInput}
          />
        ) : (
          <h3 onClick={() => setEditing(true)} className={styles.title}>
            {list.title}
          </h3>
        )}
        <button onClick={handleDeleteList} className={styles.deleteBtn} title="Delete list">
          ×
        </button>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className={styles.tasks}>
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              list={list}
              onRefresh={onRefresh}
              isBoardOwner={isBoardOwner}
            />
          ))}
        </div>
      </SortableContext>

      {addingTask ? (
        <form onSubmit={handleAddTask} className={styles.addTaskForm}>
          <input
            type="text"
            placeholder="Task title"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
            className={styles.taskInput}
          />
          <div className={styles.addTaskActions}>
            <button type="submit" disabled={creating}>Add</button>
            <button type="button" onClick={() => { setAddingTask(false); setNewTaskTitle(''); }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setAddingTask(true)} className={styles.addTaskBtn}>
          + Add Task
        </button>
      )}
    </div>
  );
}
