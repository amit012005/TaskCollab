import React, { useState, useEffect } from 'react';
import { activities } from '../api/client';
import styles from './ActivityPanel.module.css';

const ACTION_LABELS = {
  create_board: 'created board',
  update_board: 'updated board',
  delete_board: 'deleted board',
  create_list: 'created list',
  update_list: 'updated list',
  delete_list: 'deleted list',
  create_task: 'created task',
  update_task: 'updated task',
  delete_task: 'deleted task',
  move_task: 'moved task',
  assign_task: 'assigned task',
  unassign_task: 'unassigned task',
};

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export default function ActivityPanel({ boardId }) {
  const [activitiesList, setActivitiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await activities.list(boardId, { page, limit: 15 });
      setActivitiesList(res.activities || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      setActivitiesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [boardId, page]);

  return (
    <div className={styles.panel}>
      <h3>Activity</h3>
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : activitiesList.length === 0 ? (
        <div className={styles.empty}>No activity yet</div>
      ) : (
        <>
          <ul className={styles.list}>
            {activitiesList.map((a) => (
              <li key={a._id} className={styles.item}>
                <span className={styles.user}>{a.user?.name || 'Someone'}</span>
                <span className={styles.action}>{ACTION_LABELS[a.action] || a.action}</span>
                {a.details?.title && (
                  <span className={styles.detail}>"{a.details.title}"</span>
                )}
                <span className={styles.time}>{formatTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Prev
              </button>
              <span>{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
