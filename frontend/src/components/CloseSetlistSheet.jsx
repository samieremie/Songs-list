import { useState } from "react";
import Sheet from "./Sheet";
import { formatDayMonth, formatServiceDate, nextMondayAfter } from "../utils/dates";

// Closes a past sub-list: the user ticks the songs that were not sung.
// Calls onConfirm(unsungIds); the parent does the saving.
function CloseSetlistSheet({ date, songs, busy, error, onConfirm, onCancel }) {
  const [unsung, setUnsung] = useState(() => new Set());
  const nextMonday = formatServiceDate(nextMondayAfter(date));

  const toggle = (id, checked) =>
    setUnsung((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const confirm = () => onConfirm(songs.filter((s) => unsung.has(s.id)).map((s) => s.id));

  return (
    <Sheet
      title={`Încheie sub-lista din ${formatDayMonth(date)}`}
      description={
        songs.length > 0
          ? `Bifează cântările care nu s-au cântat. Ele vor fi mutate în sub-lista din ${nextMonday}. Celelalte vor fi marcate ca fiind cântate.`
          : "Sub-lista e goală. Ea va fi ștearsă."
      }
      onClose={onCancel}
    >
      {songs.length > 0 && (
        <div className="sheet-body">
          <ul className="choice-list" aria-label="Cântări care nu s-au cântat">
            {songs.map((song) => (
              <li key={song.id}>
                <label className="choice">
                  <input
                    type="checkbox"
                    checked={unsung.has(song.id)}
                    disabled={busy}
                    onChange={(e) => toggle(song.id, e.target.checked)}
                  />
                  <span className="choice-label">{song.title}</span>
                  <span className="choice-meta">{song.music_scale}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div aria-live="polite">{error && <p className="error-message">{error}</p>}</div>

      <div className="sheet-actions">
        <button type="button" className="btn btn-sun" onClick={confirm} disabled={busy}>
          {busy ? "Se încheie…" : "Încheie"}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          Renunță
        </button>
      </div>
    </Sheet>
  );
}

export default CloseSetlistSheet;
