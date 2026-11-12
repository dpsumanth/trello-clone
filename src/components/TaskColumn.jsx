import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import './TaskColumn.css';

export default function TaskColumn({
  list,
  cards,
  onAddTask,
  onEditTask,
  onDeleteTask,
  isFiltered,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: {
      type: 'list',
      listId: list.id,
    },
  });

  return (
    <section className="task-column" aria-label={`${list.title} column`}>
      <header className="task-column-header">
        <div className="task-column-title-wrap">
          <h3 className="task-column-title">{list.title}</h3>
          <span className="task-column-count">{cards.length}</span>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={`task-column-list ${isOver ? 'task-column-list--over' : ''}`}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.length === 0 ? (
            <div className="task-column-empty">
              {isFiltered ? 'No matching tasks' : 'Drop a task here or add one below'}
            </div>
          ) : (
            cards.map((card) => (
              <TaskCard
                key={card.id}
                card={card}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>

      <button
        type="button"
        className="btn btn-ghost task-column-add-btn"
        onClick={() => onAddTask(list.id)}
      >
        + Add Task
      </button>
    </section>
  );
}
