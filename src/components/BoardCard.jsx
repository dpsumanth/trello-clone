import { useState } from 'react';
import { Link } from 'react-router-dom';
import './BoardCard.css';

export default function BoardCard({ board, onRename, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [saving, setSaving] = useState(false);

  const formattedDate = new Date(board.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleSave = async (e) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setSaving(true);
    try {
      await onRename(board.id, trimmed);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(board.title);
    setIsEditing(false);
  };

  return (
    <article className="board-card">
      <div className="board-card-accent" />
      <div className="board-card-body">
        {isEditing ? (
          <form className="board-card-edit-form" onSubmit={handleSave}>
            <input
              className="input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Board name"
              autoFocus
              required
            />
            <div className="board-card-edit-actions">
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={saving || !title.trim()}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <Link to={`/boards/${board.id}`} className="board-card-link">
              <h3 className="board-card-title">{board.title}</h3>
              <p className="board-card-meta">Created {formattedDate}</p>
            </Link>

            <div className="board-card-actions">
              <Link to={`/boards/${board.id}`} className="btn btn-primary btn-sm">
                Open Board
              </Link>
              <div className="board-card-action-group">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setTitle(board.title);
                    setIsEditing(true);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onDelete(board)}
                  style={{ color: 'var(--color-danger)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
