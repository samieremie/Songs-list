import { useEffect, useRef, useState } from "react";
import { setLastSung } from "../api/songs";
import { formatDayMonth, isRecent, sungAgo, todayISO } from "../utils/dates";
import "../css/SongCard.css";

function SongCard({
  song,
  plannedDates = [],
  expanded = false,
  onToggle,
  onDelete,
  onAddToSetlist,
}) {
  const rowRef = useRef(null);
  const [lastSung, setLastSungState] = useState(song.last_sung ?? null);
  // Remembers the date before "today" so a wrong tap can be undone.
  const [previousSung, setPreviousSung] = useState(null);
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [justSung, setJustSung] = useState(false);

  const today = todayISO();
  const sungToday = lastSung === today;
  const detailsId = `song-${song.id}-details`;

  // When another open row above collapses, this row moves up: keep it on screen.
  useEffect(() => {
    if (!expanded) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    rowRef.current?.scrollIntoView?.({
      block: "nearest",
      behavior: reduce ? "auto" : "smooth",
    });
  }, [expanded]);

  const saveDate = async (date, previous) => {
    setSaving(true);
    const { error } = await setLastSung(song.id, date);
    setSaving(false);

    if (error) {
      console.error("Error updating last_sung:", error.message);
      setUpdateError("Nu s-a putut actualiza cântarea. Încearcă din nou.");
      return;
    }
    setUpdateError(null);
    setPreviousSung(previous);
    setLastSungState(date);
    setJustSung(date === today);
  };

  const handleMarkSung = () => saveDate(today, lastSung);
  const handleUndo = () => saveDate(previousSung, null);

  return (
    <li ref={rowRef} className={`song-row${isRecent(lastSung) ? " is-recent" : ""}`}>
      <button
        type="button"
        className="song-summary"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
      >
        <span className="song-text">
          <span className="song-title">{song.title}</span>
          {lastSung && (
            <span className={`song-sung${justSung ? " pop" : ""}`}>
              Cântată {sungAgo(lastSung)}
            </span>
          )}
          {plannedDates.length > 0 && (
            <span className="song-planned">
              {plannedDates.length === 1 ? "În sub-lista din " : "În sub-listele din "}
              {plannedDates.map(formatDayMonth).join(", ")}
            </span>
          )}
        </span>
        <span className="song-key">
          <span className="visually-hidden">Gama </span>
          {song.music_scale}
        </span>
      </button>

      <div id={detailsId} className="song-actions" hidden={!expanded}>
        {sungToday ? (
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleUndo}
            disabled={saving}
          >
            Anulează „cântată azi”
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-palm"
            onClick={handleMarkSung}
            disabled={saving}
          >
            Marchează cântată azi
          </button>
        )}
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onAddToSetlist(song)}
        >
          Adaugă în sub-listă
        </button>
        <button
          type="button"
          className="btn btn-text-danger"
          onClick={() => onDelete(song)}
        >
          Șterge
        </button>
        {updateError && <p className="error-message song-error">{updateError}</p>}
      </div>
    </li>
  );
}

export default SongCard;
