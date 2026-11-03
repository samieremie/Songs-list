import { useState } from "react";
import { Link } from "react-router-dom";
import Sheet from "./Sheet";
import { formatServiceDate, untilLabel } from "../utils/dates";

// From the main list: tick the upcoming sub-lists this song should be in.
function SetlistPickerSheet({ song, setlists, error, onToggle, onClose }) {
  const [busyId, setBusyId] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const handleChange = async (setlist, include) => {
    setBusyId(setlist.id);
    const ok = await onToggle(setlist, include);
    setBusyId(null);
    setToggleError(ok ? null : "Sub-lista nu a putut fi actualizată. Încearcă din nou.");
  };

  const hasSong = (setlist) =>
    (setlist.setlist_songs ?? []).some((row) => row.song_id === song.id);

  return (
    <Sheet title={`Adaugă „${song.title}” în sub-listă`} onClose={onClose}>
      <div className="sheet-body">
        {error && <p className="error-message">{error}</p>}

        {!error && setlists.length === 0 && (
          <p className="sheet-message">Nu există nicio sub-listă pentru zilele care urmează.</p>
        )}

        <ul className="choice-list">
          {setlists.map((setlist) => (
            <li key={setlist.id}>
              <label className="choice">
                <input
                  type="checkbox"
                  checked={hasSong(setlist)}
                  disabled={busyId === setlist.id}
                  onChange={(e) => handleChange(setlist, e.target.checked)}
                />
                <span className="choice-label">{formatServiceDate(setlist.date)}</span>
                <span className="choice-meta">{untilLabel(setlist.date)}</span>
              </label>
            </li>
          ))}
        </ul>

        {toggleError && <p className="error-message">{toggleError}</p>}
      </div>

      <div className="sheet-footer">
        {!error && setlists.length === 0 ? (
          <Link to="/sub-liste" className="btn btn-sun">
            Creează o sub-listă
          </Link>
        ) : (
          <button type="button" className="btn btn-sun" onClick={onClose}>
            Gata
          </button>
        )}
      </div>
    </Sheet>
  );
}

export default SetlistPickerSheet;
