import SearchBar from "../components/SearchBar";
import SongCard from "../components/SongCard";
import { useState, useEffect } from "react";
import supabase from "../api/songsApi";
import "../css/Home.css";

function Home() {
  const [fetchError, setFetchError] = useState(null);
  const [songs, setSongs] = useState([]);

  // Fetch songs
  useEffect(() => {
    const fetchSongs = async () => {
      const { data, error } = await supabase.from("songs").select();

      if (error) {
        setFetchError("Nu s-au putut încărca cântările. Încearcă din nou.");
        setSongs([]);
        console.error("Error fetching songs:", error.message);
      }

      if (data) {
        setSongs(data);
        setFetchError(null);
      }
    };

    fetchSongs();
  }, []);

  // Delete a song
  const handleDelete = async (id) => {
    const { error } = await supabase.from("songs").delete().eq("id", id);

    if (error) {
      console.error("Error deleting song:", error.message);
      setFetchError("Cântarea nu a putut fi ștearsă. Încearcă din nou.");
    } else {
      setFetchError(null);
      // Remove the deleted song from state
      setSongs((prev) => prev.filter((song) => song.id !== id));
    }
  };

  // 1️⃣ Sort songs alphabetically
  const sortedSongs =
    songs.length > 0
      ? [...songs].sort((a, b) => a.title.localeCompare(b.title))
      : [];

  // 2️⃣ Group by first letter
  const grouped =
    sortedSongs.length > 0
      ? sortedSongs.reduce((acc, song) => {
          const firstLetter = song.title[0].toUpperCase();
          if (!acc[firstLetter]) acc[firstLetter] = [];
          acc[firstLetter].push(song);
          return acc;
        }, {})
      : {};

  // 3️⃣ Convert to entries for easy mapping
  const groupedEntries = Object.entries(grouped); // [['A', [...]], ['D', [...]]]

  return (
    <div>
      <h1 className="page-title">Lista de cântări tineret Elim Bruxelles</h1>
      {/* <SearchBar /> */}
      {fetchError && <p className="error-message">{fetchError}</p>}
      <div className="songs-list">
        {groupedEntries.map(([letter, songs]) => (
          <div key={letter} className="song-group">
            <h2 className="letter-heading">- {letter} -</h2>
            {songs.map((song) => (
              <SongCard key={song.id} song={song} onDelete={handleDelete} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
