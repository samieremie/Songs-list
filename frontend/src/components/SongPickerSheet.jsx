import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import SearchBar from "./SearchBar";
import { filterSongs, sortByTitle } from "../utils/text";

// Lets the user tick songs from the main list to put them in a sub-list.
function SongPickerSheet({ songs, selectedIds, loading, error, busyId, onToggle, onClose }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => sortByTitle(filterSongs(songs, query)), [songs, query]);

  return (
    <Sheet title="Adaugă cântări" onClose={onClose}>
      <div className="picker-search">
        <SearchBar value={query} onChange={setQuery} placeholder="Caută o cântare" />
      </div>

      <div className="sheet-body">
        {loading && <p className="sheet-message">Se încarcă cântările…</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && visible.length === 0 && (
          <p className="sheet-message">Nicio cântare pentru „{query.trim()}”.</p>
        )}
        <ul className="choice-list">
          {visible.map((song) => {
            const checked = selectedIds.has(song.id);
            return (
              <li key={song.id}>
                <label className="choice">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busyId === song.id}
                    onChange={(e) => onToggle(song, e.target.checked)}
                  />
                  <span className="choice-label">{song.title}</span>
                  <span className="choice-meta">{song.music_scale}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sheet-footer">
        <button type="button" className="btn btn-sun" onClick={onClose}>
          Gata
        </button>
      </div>
    </Sheet>
  );
}

export default SongPickerSheet;
