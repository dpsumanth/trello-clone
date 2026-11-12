import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TaskCard.css';

export function TaskCardPreview({ card }) {
  return (
    <div className="task-card task-card--overlay">
      <div className="task-card-header">
        <h4 className="task-card-title">{card.title}</h4>
      </div>
      {card.description && <p className="task-card-description">{card.description}</p>}
    </div>
  );
}

export default function TaskCard({ card, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? 'task-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="task-card-header">
        <h4 className="task-card-title">{card.title}</h4>
      </div>

      {card.description && <p className="task-card-description">{card.description}</p>}

      <div
        className="task-card-actions"
        onPointerDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn btn-ghost task-card-action-btn"
          onClick={() => onEdit(card)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-ghost task-card-action-btn task-card-delete-btn"
          onClick={() => onDelete(card)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
