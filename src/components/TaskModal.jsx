import { useEffect, useState } from 'react';
import './TaskModal.css';

export default function TaskModal({
  mode,
  lists,
  initialListId,
  initialCard,
  onClose,
  onSubmit,
}) {
  const [title, setTitle] = useState(() => initialCard?.title || '');
  const [description, setDescription] = useState(() => initialCard?.description || '');
  const [listId, setListId] = useState(
    () => initialCard?.list_id || initialListId || lists[0]?.id || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        listId,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      onClick={onClose}
    >
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="task-modal-title" className="modal-title">
            {mode === 'edit' ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            type="button"
            className="btn btn-ghost modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: 0 }}>
              {error}
            </div>
          )}

          {lists.length > 0 && (
            <div className="form-field">
              <label className="form-label" htmlFor="task-list-select">
                List / Status
              </label>
              <select
                id="task-list-select"
                className="select"
                value={listId}
                onChange={(e) => setListId(e.target.value)}
              >
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="task-title-input">
              Title
            </label>
            <input
              id="task-title-input"
              className="input"
              type="text"
              placeholder="e.g. Design landing page wireframe"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="task-desc-input">
              Description
            </label>
            <textarea
              id="task-desc-input"
              className="textarea"
              placeholder="Add details, acceptance criteria, or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
