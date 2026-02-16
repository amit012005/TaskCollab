import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { boards as boardsApi } from '../api/client';
import { useSocket } from '../context/SocketContext';
import BoardContent from '../components/BoardContent';
import ActivityPanel from '../components/ActivityPanel';
import styles from './BoardView.module.css';

export default function BoardView() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivity, setShowActivity] = useState(true);

  const fetchBoard = async () => {
    try {
      const data = await boardsApi.get(id);
      setBoard(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load board');
      setBoard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
  }, [id]);

  useEffect(() => {
    if (!socket || !board?._id) return;
    socket.emit('join_board', board._id);
    const handler = (payload) => {
      fetchBoard();
    };
    socket.on('board:updated', handler);
    return () => {
      socket.emit('leave_board', board._id);
      socket.off('board:updated', handler);
    };
  }, [socket, board?._id]);

  const refreshBoard = () => fetchBoard();

  if (loading) return <div className={styles.loading}>Loading board...</div>;
  if (error || !board) return <div className={styles.error}>{error || 'Board not found'}</div>;

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div>
          <h1>{board.title}</h1>
          {board.description && <p className={styles.desc}>{board.description}</p>}
        </div>
        <button
          onClick={() => setShowActivity(!showActivity)}
          className={styles.activityToggle}
        >
          {showActivity ? 'Hide' : 'Show'} Activity
        </button>
      </header>
      <div className={styles.content}>
        <BoardContent board={board} onRefresh={refreshBoard} />
        {showActivity && (
          <aside className={styles.sidebar}>
            <ActivityPanel boardId={board._id} />
          </aside>
        )}
      </div>
    </div>
  );
}
