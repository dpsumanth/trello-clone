import { useEffect, useState } from 'react';
import BoardCard from '../components/BoardCard';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/useAuth';
import {
  createBoard,
  deleteBoard,
  getBoards,
  updateBoard,
} from '../services/boardService';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();

  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchBoards() {
      setLoading(true);
      setError('');
      try {
        const data = await getBoards();
        if (active) setBoards(data);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load boards.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchBoards();
    return () => {
      active = false;
    };
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    const trimmed = newBoardTitle.trim();
    if (!trimmed) return;

    setCreating(true);
    setError('');
    try {
      const created = await createBoard({ title: trimmed, user });
      setBoards((prev) => [created, ...prev]);
      setNewBoardTitle('');
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'Could not create board.');
    } finally {
      setCreating(false);
    }
  };

  const handleRenameBoard = async (boardId, title) => {
    setError('');
    try {
      const updated = await updateBoard(boardId, { title });
      setBoards((prev) => prev.map((b) => (b.id === boardId ? updated : b)));
    } catch (err) {
      setError(err.message || 'Could not update board name.');
      throw err;
    }
  };

  const handleDeleteBoard = async (board) => {
    const confirmed = window.confirm(
      `Delete "${board.title}" and all of its lists and tasks? This cannot be undone.`
    );
    if (!confirmed) return;

    setError('');
    try {
      await deleteBoard(board.id);
      setBoards((prev) => prev.filter((b) => b.id !== board.id));
    } catch (err) {
      setError(err.message || 'Could not delete board.');
    }
  };

  return (
    <>
      <Navbar />

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your Boards</h1>
            <p className="dashboard-subtitle">
              Create boards to organize projects, lists, and tasks.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowCreateForm((prev) => !prev)}
          >
            {showCreateForm ? 'Close' : '+ Create Board'}
          </button>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        {showCreateForm && (
          <section className="create-board-panel" aria-label="Create new board">
            <form className="create-board-form" onSubmit={handleCreateBoard}>
              <input
                className="input create-board-input"
                type="text"
                placeholder="Enter board name (e.g. Product Launch, Sprint 1)..."
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                autoFocus
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={creating || !newBoardTitle.trim()}
              >
                {creating ? 'Creating...' : 'Create Board'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewBoardTitle('');
                }}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {loading ? (
          <div className="page-loader">
            <div className="spinner" aria-hidden="true" />
            <span>Loading your boards...</span>
          </div>
        ) : boards.length === 0 ? (
          <section className="dashboard-empty">
            <h2>No boards yet</h2>
            <p>Create your first board to start tracking tasks across lists.</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateForm(true)}
            >
              + Create Your First Board
            </button>
          </section>
        ) : (
          <section className="boards-grid" aria-label="Boards list">
            {boards.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onRename={handleRenameBoard}
                onDelete={handleDeleteBoard}
              />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
