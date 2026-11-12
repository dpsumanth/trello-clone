import { supabase } from '../lib/supabaseClient';

export async function getCardsByBoard(boardId) {
  const { data, error } = await supabase
    .from('cards')
    .select('id, list_id, board_id, title, description, position, created_at, updated_at')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createCard({ boardId, listId, title, description = '', position }) {
  const { data, error } = await supabase
    .from('cards')
    .insert({
      board_id: boardId,
      list_id: listId,
      title: title.trim(),
      description: description.trim(),
      position,
    })
    .select('id, list_id, board_id, title, description, position, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function updateCard(cardId, updates) {
  const payload = {};
  if (typeof updates.title === 'string') payload.title = updates.title.trim();
  if (typeof updates.description === 'string') payload.description = updates.description.trim();
  if (updates.list_id !== undefined) payload.list_id = updates.list_id;
  if (updates.position !== undefined) payload.position = updates.position;

  const { data, error } = await supabase
    .from('cards')
    .update(payload)
    .eq('id', cardId)
    .select('id, list_id, board_id, title, description, position, created_at, updated_at')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCard(cardId) {
  const { error } = await supabase.from('cards').delete().eq('id', cardId);
  if (error) throw error;
}

/**
 * Persists reordered card positions and list assignments to Supabase.
 */
export async function persistCardPositions(cardsToUpdate) {
  if (!cardsToUpdate.length) return;

  const results = await Promise.all(
    cardsToUpdate.map(({ id, list_id, position }) =>
      supabase.from('cards').update({ list_id, position }).eq('id', id)
    )
  );

  const failed = results.find((res) => res.error);
  if (failed?.error) throw failed.error;
}
