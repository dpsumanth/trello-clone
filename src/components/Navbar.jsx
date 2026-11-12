import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

export default function Navbar({ boardTitle = '' }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = user?.user_metadata?.full_name || user?.email || '';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <Link to="/dashboard" className="navbar-brand">
          <span className="navbar-brand-mark" aria-hidden="true">
            T
          </span>
          <span>TaskFlow</span>
        </Link>

        {boardTitle && <h2 className="navbar-board-title">{boardTitle}</h2>}
      </div>

      <div className="navbar-right">
        {boardTitle && (
          <Link to="/dashboard" className="btn btn-sm navbar-btn">
            Boards
          </Link>
        )}
        {displayName && (
          <span className="navbar-user" title={user?.email || displayName}>
            {displayName}
          </span>
        )}
        <button type="button" className="btn btn-sm navbar-btn" onClick={handleLogout}>
          Log Out
        </button>
      </div>
    </header>
  );
}
