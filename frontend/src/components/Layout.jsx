import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <Link to="/boards" className={styles.logo}>
          TaskCollab
        </Link>
        <nav className={styles.nav}>
          <Link to="/boards">Boards</Link>
          <span className={styles.user}>{user?.name}</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
