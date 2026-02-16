import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { tasks as tasksApi, users } from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from './TaskCard.module.css';

export default function TaskCard({ task, list, onRefresh, isOverlay, isBoardOwner }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title || '');
  const [desc, setDesc] = useState(task.description || '');
  const [showAssign, setShowAssign] = useState(false);
  const [searchUser, setSearchUser] = useState('');
  const [userResults, setUserResults] = useState([]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignedTo = task.assignedTo || [];

  const handleUpdate = async () => {
    if (title.trim() === task.title && desc === (task.description || '')) {
      setEditing(false);
      return;
    }
    try {
      await tasksApi.update(task._id, { title: title.trim(), description: desc || '' });
      onRefresh();
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(task._id);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId) => {
    try {
      await tasksApi.assign(task._id, userId);
      onRefresh();
      setShowAssign(false);
      setSearchUser('');
      setUserResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnassign = async (userId) => {
    try {
      await tasksApi.unassign(task._id, userId);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchUser.trim()) return;
    try {
      const res = await users.search(searchUser);
      setUserResults(res.users || []);
    } catch (err) {
      setUserResults([]);
    }
  };

  const cardClass = `${styles.card} ${isDragging && !isOverlay ? styles.dragging : ''} ${isOverlay ? styles.overlay : ''}`;

  if (isOverlay) {
    return (
      <div className={cardClass}>
        <div className={styles.titleRow}>
          <span className={styles.taskTitle}>{task.title}</span>
        </div>
        {assignedTo.length > 0 && (
          <div className={styles.assigned}>
            {assignedTo.map((u) => (
              <span key={u._id} className={styles.avatar}>{u.name?.[0]}</span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style} className={cardClass}>
      <div className={styles.header} {...attributes} {...listeners}>
        {editing ? (
          <div className={styles.editForm}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              autoFocus
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Description"
              className={styles.textarea}
              rows={2}
            />
            <div className={styles.editActions}>
              <button onClick={handleUpdate} className={styles.saveBtn}>Save</button>
              <button onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <span
              className={styles.taskTitle}
              onClick={() => setEditing(true)}
            >
              {task.title}
            </span>
            <button onClick={handleDelete} className={styles.deleteBtn} title="Delete">×</button>
          </>
        )}
      </div>
      {task.description && !editing && (
        <p className={styles.desc}>{task.description}</p>
      )}
      {assignedTo.length > 0 && !editing && (
        <div className={styles.assigned}>
          {assignedTo.map((u) => (
            <span
              key={u._id}
              className={styles.avatar}
              title={u.name}
            >
              {u.name?.[0]}
              {isBoardOwner && (
                <button
                  className={styles.unassign}
                  onClick={(e) => { e.stopPropagation(); handleUnassign(u._id); }}
                  title="Unassign"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {isBoardOwner && !editing && (
        <div className={styles.footer}>
          <button
            onClick={() => setShowAssign(!showAssign)}
            className={styles.assignBtn}
          >
            + Assign
          </button>
        </div>
      )}
      {isBoardOwner && showAssign && !editing && (
        <div className={styles.assignForm}>
          <input
            type="text"
            placeholder="Search user..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
            className={styles.input}
          />
          <button onClick={handleSearchUsers} className={styles.searchBtn}>Search</button>
          <div className={styles.userResults}>
            {userResults.map((u) => (
              <button
                key={u._id}
                onClick={() => handleAssign(u._id)}
                className={styles.userItem}
              >
                {u.name} ({u.email})
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
