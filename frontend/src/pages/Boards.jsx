import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { boards as boardsApi } from '../api/client';
import styles from './Boards.module.css';

export default function Boards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const res = await boardsApi.list({ page, limit: 8, search });
      setBoards(res.boards);
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
      setBoards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [page, search]);

  useEffect(() => {
    const refetch = () => fetchBoards();
    const onVisible = () => document.visibilityState === 'visible' && refetch();
    window.addEventListener('focus', refetch);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', refetch);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [page, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await boardsApi.create({ title: newTitle.trim() });
      setNewTitle('');
      setShowCreate(false);
      fetchBoards();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1>My Boards</h1>
        <div className={styles.actions}>
          <input
            type="search"
            placeholder="Search boards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
          />
          <button onClick={() => setShowCreate(!showCreate)} className={styles.addBtn}>
            + New Board
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className={styles.createForm}>
          <input
            type="text"
            placeholder="Board title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={creating}>Create</button>
          <button type="button" onClick={() => { setShowCreate(false); setNewTitle(''); }}>Cancel</button>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Loading boards...</div>
      ) : boards.length === 0 ? (
        <div className={styles.empty}>
          <p>No boards yet. Create one to get started!</p>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {boards.map((board) => (
              <Link key={board._id} to={`/boards/${board._id}`} className={styles.card}>
                <h3>{board.title}</h3>
                {board.description && <p>{board.description}</p>}
              </Link>
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
              <span>Page {page} of {totalPages} ({total} total)</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
