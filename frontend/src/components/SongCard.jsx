import { useEffect, useRef } from "react";
import { formatDayMonth, isRecent, sungAgo } from "../utils/dates";
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
  const lastSung = song.last_sung ?? null;
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
          {lastSung && <span className="song-sung">Cântată {sungAgo(lastSung)}</span>}
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
      </div>
    </li>
  );
}

export default SongCard;
