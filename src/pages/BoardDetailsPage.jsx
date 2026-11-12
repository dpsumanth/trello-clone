import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { TaskCardPreview } from '../components/TaskCard';
import TaskColumn from '../components/TaskColumn';
import TaskModal from '../components/TaskModal';
import { getBoardById } from '../services/boardService';
import {
  createCard,
  deleteCard,
  getCardsByBoard,
  persistCardPositions,
  updateCard,
} from '../services/cardService';
import { createList, getListsByBoard } from '../services/listService';
import './BoardDetailsPage.css';

function normalizeCardsByList(allCards, lists) {
  const grouped = new Map();
  lists.forEach((list) => grouped.set(list.id, []));

  allCards.forEach((card) => {
    if (!grouped.has(card.list_id)) {
      grouped.set(card.list_id, []);
    }
    grouped.get(card.list_id).push(card);
  });

  const normalized = [];
  grouped.forEach((listCards) => {
    listCards.forEach((card, index) => {
      normalized.push({ ...card, position: index });
    });
  });

  return normalized;
}

export default function BoardDetailsPage() {
  const { boardId } = useParams();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListFilter, setSelectedListFilter] = useState('all');

  // Task modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalListId, setModalListId] = useState('');
  const [editingCard, setEditingCard] = useState(null);

  // Add list inline state
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingList, setAddingList] = useState(false);

  // Drag-and-drop state
  const [activeCard, setActiveCard] = useState(null);
  const dragStartCardsRef = useRef([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    let active = true;

    async function loadBoardData() {
      setLoading(true);
      setError('');
      try {
        const [boardData, listsData, cardsData] = await Promise.all([
          getBoardById(boardId),
          getListsByBoard(boardId),
          getCardsByBoard(boardId),
        ]);

        if (!active) return;
        setBoard(boardData);
        setLists(listsData);
        setCards(cardsData);
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load this board.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBoardData();
    return () => {
      active = false;
    };
  }, [boardId]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltered = Boolean(normalizedQuery || selectedListFilter !== 'all');

  const visibleLists = useMemo(() => {
    if (selectedListFilter === 'all') return lists;
    return lists.filter((list) => list.id === selectedListFilter);
  }, [lists, selectedListFilter]);

  const cardsByList = useMemo(() => {
    const map = new Map();
    lists.forEach((list) => map.set(list.id, []));

    cards.forEach((card) => {
      if (normalizedQuery && !card.title.toLowerCase().includes(normalizedQuery)) {
        return;
      }
      if (!map.has(card.list_id)) {
        map.set(card.list_id, []);
      }
      map.get(card.list_id).push(card);
    });

    return map;
  }, [cards, lists, normalizedQuery]);

  const totalMatchingTasks = useMemo(() => {
    return visibleLists.reduce(
      (sum, list) => sum + (cardsByList.get(list.id)?.length || 0),
      0
    );
  }, [visibleLists, cardsByList]);

  const openCreateModal = (listId) => {
    setModalMode('create');
    setEditingCard(null);
    setModalListId(listId || lists[0]?.id || '');
    setModalOpen(true);
  };

  const openEditModal = (card) => {
    setModalMode('edit');
    setEditingCard(card);
    setModalListId(card.list_id);
    setModalOpen(true);
  };

  const handleSaveTask = async ({ title, description, listId }) => {
    if (modalMode === 'create') {
      const targetCards = cards.filter((c) => c.list_id === listId);
      const nextPosition = targetCards.length;
      const created = await createCard({
        boardId,
        listId,
        title,
        description,
        position: nextPosition,
      });
      setCards((prev) => [...prev, created]);
      return;
    }

    const movingLists = editingCard.list_id !== listId;
    const targetCardsCount = cards.filter((c) => c.list_id === listId).length;
    const updated = await updateCard(editingCard.id, {
      title,
      description,
      list_id: listId,
      position: movingLists ? targetCardsCount : editingCard.position,
    });

    const replaced = cards.map((c) => (c.id === updated.id ? updated : c));
    const normalized = normalizeCardsByList(replaced, lists);
    setCards(normalized);

    if (movingLists) {
      const affected = normalized
        .filter((c) => c.list_id === editingCard.list_id || c.list_id === listId)
        .map(({ id, list_id, position }) => ({ id, list_id, position }));
      await persistCardPositions(affected);
    }
  };

  const handleDeleteTask = async (card) => {
    const confirmed = window.confirm(`Delete task "${card.title}"?`);
    if (!confirmed) return;

    setError('');
    try {
      await deleteCard(card.id);
      const remaining = cards.filter((c) => c.id !== card.id);
      const normalized = normalizeCardsByList(remaining, lists);
      setCards(normalized);

      const affected = normalized
        .filter((c) => c.list_id === card.list_id)
        .map(({ id, list_id, position }) => ({ id, list_id, position }));
      await persistCardPositions(affected);
    } catch (err) {
      setError(err.message || 'Could not delete task.');
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    const trimmed = newListTitle.trim();
    if (!trimmed) return;

    setAddingList(true);
    setError('');
    try {
      const created = await createList({
        boardId,
        title: trimmed,
        position: lists.length,
      });
      setLists((prev) => [...prev, created]);
      setNewListTitle('');
      setShowAddList(false);
    } catch (err) {
      setError(err.message || 'Could not create list.');
    } finally {
      setAddingList(false);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (event) => {
    const dragged = cards.find((c) => c.id === event.active.id) || null;
    setActiveCard(dragged);
    dragStartCardsRef.current = cards;
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeItem = cards.find((c) => c.id === activeId);
    if (!activeItem) return;

    const overType = over.data?.current?.type;
    const targetListId =
      overType === 'list'
        ? over.data.current.listId
        : cards.find((c) => c.id === overId)?.list_id;

    if (!targetListId || activeItem.list_id === targetListId) return;

    setCards((prev) => {
      const moving = prev.find((c) => c.id === activeId);
      if (!moving || moving.list_id === targetListId) return prev;

      const withoutMoving = prev.filter((c) => c.id !== activeId);
      const targetCards = withoutMoving.filter((c) => c.list_id === targetListId);
      const otherCards = withoutMoving.filter((c) => c.list_id !== targetListId);

      let insertIndex = targetCards.length;
      if (overType === 'card') {
        const overIndex = targetCards.findIndex((c) => c.id === overId);
        if (overIndex >= 0) {
          insertIndex = overIndex;
        }
      }

      const updatedMoving = { ...moving, list_id: targetListId };
      const nextTargetCards = [
        ...targetCards.slice(0, insertIndex),
        updatedMoving,
        ...targetCards.slice(insertIndex),
      ];

      return normalizeCardsByList([...otherCards, ...nextTargetCards], lists);
    });
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setCards(dragStartCardsRef.current);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      setCards(dragStartCardsRef.current);
      return;
    }

    const activeId = active.id;
    const overId = over.id;
    const overType = over.data?.current?.type;

    let nextCards = cards;

    if (activeId !== overId && overType === 'card') {
      const activeItem = nextCards.find((c) => c.id === activeId);
      const overItem = nextCards.find((c) => c.id === overId);

      if (activeItem && overItem && activeItem.list_id === overItem.list_id) {
        const listId = activeItem.list_id;
        const listCards = nextCards.filter((c) => c.list_id === listId);
        const otherCards = nextCards.filter((c) => c.list_id !== listId);

        const oldIndex = listCards.findIndex((c) => c.id === activeId);
        const newIndex = listCards.findIndex((c) => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedList = arrayMove(listCards, oldIndex, newIndex);
          nextCards = normalizeCardsByList([...otherCards, ...reorderedList], lists);
        }
      }
    } else {
      nextCards = normalizeCardsByList(nextCards, lists);
    }

    setCards(nextCards);

    const originalById = new Map(
      dragStartCardsRef.current.map((card) => [card.id, card])
    );

    const changedUpdates = nextCards
      .filter((card) => {
        const prev = originalById.get(card.id);
        return (
          !prev || prev.list_id !== card.list_id || prev.position !== card.position
        );
      })
      .map(({ id, list_id, position }) => ({ id, list_id, position }));

    if (!changedUpdates.length) return;

    try {
      setError('');
      await persistCardPositions(changedUpdates);
    } catch (err) {
      setCards(dragStartCardsRef.current);
      setError(err.message || 'Failed to save task position. Changes were reverted.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-loader">
          <div className="spinner" aria-hidden="true" />
          <span>Loading board...</span>
        </div>
      </>
    );
  }

  if (!board) {
    return (
      <>
        <Navbar />
        <main className="dashboard-main">
          <div className="alert alert-error" role="alert">
            {error || 'Board not found.'}
          </div>
          <Link to="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar boardTitle={board.title} />

      <main className="board-page">
        <div className="board-toolbar">
          <div className="board-toolbar-left">
            <h1 className="board-heading">{board.title}</h1>
            <span className="board-stats">
              {totalMatchingTasks} {totalMatchingTasks === 1 ? 'task' : 'tasks'}
              {isFiltered ? ' shown' : ''}
            </span>
          </div>

          <div className="board-toolbar-controls">
            <input
              type="search"
              className="input board-search-input"
              placeholder="Search tasks by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search tasks by title"
            />

            <select
              className="select board-filter-select"
              value={selectedListFilter}
              onChange={(e) => setSelectedListFilter(e.target.value)}
              aria-label="Filter tasks by list"
            >
              <option value="all">All Lists</option>
              {lists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>

            {isFiltered && (
              <button
                type="button"
                className="btn btn-sm board-toolbar-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedListFilter('all');
                }}
              >
                Clear
              </button>
            )}

            <button
              type="button"
              className="btn board-toolbar-btn"
              onClick={() =>
                openCreateModal(
                  selectedListFilter !== 'all' ? selectedListFilter : lists[0]?.id
                )
              }
              disabled={lists.length === 0}
            >
              + Add Task
            </button>
          </div>
        </div>

        {error && (
          <div className="board-alerts">
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          </div>
        )}

        <div className="board-columns-scroll">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
          >
            <div className="board-columns">
              {visibleLists.map((list) => (
                <TaskColumn
                  key={list.id}
                  list={list}
                  cards={cardsByList.get(list.id) || []}
                  onAddTask={openCreateModal}
                  onEditTask={openEditModal}
                  onDeleteTask={handleDeleteTask}
                  isFiltered={isFiltered}
                />
              ))}

              {selectedListFilter === 'all' && (
                <div className="add-list-card">
                  {showAddList ? (
                    <form className="add-list-form" onSubmit={handleAddList}>
                      <input
                        className="input"
                        type="text"
                        placeholder="Enter list title..."
                        value={newListTitle}
                        onChange={(e) => setNewListTitle(e.target.value)}
                        autoFocus
                        required
                      />
                      <div className="add-list-actions">
                        <button
                          type="submit"
                          className="btn btn-primary btn-sm"
                          disabled={addingList || !newListTitle.trim()}
                        >
                          {addingList ? 'Adding...' : 'Add List'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setShowAddList(false);
                            setNewListTitle('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ width: '100%', justifyContent: 'flex-start' }}
                      onClick={() => setShowAddList(true)}
                    >
                      + Add Another List
                    </button>
                  )}
                </div>
              )}
            </div>

            <DragOverlay>
              {activeCard ? <TaskCardPreview card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {modalOpen && (
        <TaskModal
          key={editingCard?.id || `create-${modalListId}`}
          mode={modalMode}
          lists={lists}
          initialListId={modalListId}
          initialCard={editingCard}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSaveTask}
        />
      )}
    </>
  );
}
