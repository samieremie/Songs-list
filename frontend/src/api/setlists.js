import supabase from "./songsApi";

// All queries on `setlists` and `setlist_songs`. Every helper returns
// { data, error }. Expired lists are deleted by the expire_setlists() job
// (see supabase/setlists.sql); callers still filter by date in case the job
// has not run yet.

export const DUPLICATE_DATE = "23505";

// Upcoming lists with their song ids and positions, soonest first.
export function listUpcomingSetlists(today) {
  return supabase
    .from("setlists")
    .select("id, date, setlist_songs(song_id, position)")
    .gte("date", today)
    .order("date", { ascending: true });
}

// One list with its songs (each with its `position`) in singing order,
// or data = null if there is no list for that date.
export async function getSetlistByDate(date) {
  const { data, error } = await supabase
    .from("setlists")
    .select("id, date, setlist_songs(position, songs(id, title, music_scale, last_sung))")
    .eq("date", date)
    .maybeSingle();

  if (error || !data) return { data: null, error };

  const songs = [...(data.setlist_songs ?? [])]
    .sort((a, b) => a.position - b.position)
    .filter((row) => row.songs)
    .map((row) => ({ ...row.songs, position: row.position }));
  return { data: { id: data.id, date: data.date, songs }, error: null };
}

export function createSetlist(date) {
  return supabase.from("setlists").insert([{ date }]).select("id, date").single();
}

export function deleteSetlist(id) {
  return supabase.from("setlists").delete().eq("id", id);
}

export function addSongToSetlist(setlistId, songId, position) {
  return supabase
    .from("setlist_songs")
    .insert([{ setlist_id: setlistId, song_id: songId, position }]);
}

export function removeSongFromSetlist(setlistId, songId) {
  return supabase
    .from("setlist_songs")
    .delete()
    .eq("setlist_id", setlistId)
    .eq("song_id", songId);
}

// Saves the whole order at once: position = index in orderedSongIds.
export function reorderSetlist(setlistId, orderedSongIds) {
  const rows = orderedSongIds.map((songId, position) => ({
    setlist_id: setlistId,
    song_id: songId,
    position,
  }));
  return supabase
    .from("setlist_songs")
    .upsert(rows, { onConflict: "setlist_id,song_id" });
}
