// const API_BASE = "https://songs-list-ot8c.onrender.com";

// export async function listSongs() {
//   const res = await fetch(`${API_BASE}/songs`);
//   return res.json();
// }

// export async function addSong(title, music_scale) {
//   const res = await fetch(`${API_BASE}/songs`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ title, music_scale }),
//   });
//   return res.json();
// }

// export async function deleteSong(id) {
//   const res = await fetch(`${API_BASE}/songs/${id}`, {
//     method: "DELETE",
//   });
//   return res.json();
// }

import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
