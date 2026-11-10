import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CloseSetlistSheet from "../components/CloseSetlistSheet";
import ConfirmSheet from "../components/ConfirmSheet";
import SongPickerSheet from "../components/SongPickerSheet";
import {
  addSongToSetlist,
  closeSetlist,
  deleteSetlist,
  getSetlistByDate,
  removeSongFromSetlist,
  reorderSetlist,
} from "../api/setlists";
import { listSongs } from "../api/songs";
import { formatDayMonth, formatWeekday, todayISO, untilLabel } from "../utils/dates";
import { plural } from "../utils/text";
import "../css/SongCard.css";
import "../css/Setlist.css";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function Setlist() {
  const { date } = useParams();
  const navigate = useNavigate();
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  // A list stays after its day until someone closes it.
  const isPast = validDate && date < todayISO();

  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(validDate);
  const [errorMessage, setErrorMessage] = useState(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [allSongs, setAllSongs] = useState(null);
  const [pickerError, setPickerError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState(null);

  useEffect(() => {
    if (!validDate) return;
    let cancelled = false;

    const fetchSetlist = async () => {
      const { data, error } = await getSetlistByDate(date);
      if (cancelled) return;
      if (error) {
        console.error("Error fetching setlist:", error.message);
        setErrorMessage("Sub-lista nu a putut fi încărcată. Încearcă din nou.");
      }
      setSetlist(data);
      setLoading(false);
    };

    fetchSetlist();
    return () => {
      cancelled = true;
    };
  }, [date, validDate]);

  const songs = useMemo(() => setlist?.songs ?? [], [setlist]);
  const selectedIds = useMemo(() => new Set(songs.map((s) => s.id)), [songs]);

  const setSongs = (next) => setSetlist((prev) => ({ ...prev, songs: next }));

  const move = async (index, offset) => {
    const target = index + offset;
    if (target < 0 || target >= songs.length) return;

    const previous = songs;
    const next = [...songs];
    [next[index], next[target]] = [next[target], next[index]];
    const renumbered = next.map((song, position) => ({ ...song, position }));
    setSongs(renumbered);

    const { error } = await reorderSetlist(setlist.id, renumbered.map((s) => s.id));
    if (error) {
      console.error("Error reordering setlist:", error.message);
      setSongs(previous);
      setErrorMessage("Ordinea nu a putut fi salvată. Încearcă din nou.");
    } else {
      setErrorMessage(null);
    }
  };

  const remove = async (song) => {
    const { error } = await removeSongFromSetlist(setlist.id, song.id);
    if (error) {
      console.error("Error removing song from setlist:", error.message);
      setErrorMessage("Cântarea nu a putut fi scoasă din sub-listă. Încearcă din nou.");
      return false;
    }
    setErrorMessage(null);
    setSongs(songs.filter((s) => s.id !== song.id));
    return true;
  };

  const add = async (song) => {
    const position = songs.reduce((max, s) => Math.max(max, s.position ?? 0), -1) + 1;
    const { error } = await addSongToSetlist(setlist.id, song.id, position);
    if (error) {
      console.error("Error adding song to setlist:", error.message);
      return false;
    }
    setSongs([...songs, { ...song, position }]);
    return true;
  };

  const openPicker = async () => {
    setPickerOpen(true);
    if (allSongs) return;
    const { data, error } = await listSongs();
    if (error) {
      console.error("Error fetching songs:", error.message);
      setPickerError("Nu s-au putut încărca cântările. Încearcă din nou.");
      setAllSongs([]);
    } else {
      setAllSongs(data ?? []);
    }
  };

  const togglePicked = async (song, include) => {
    setBusyId(song.id);
    const ok = include ? await add(song) : await remove(song);
    setBusyId(null);
    setPickerError(ok ? null : "Sub-lista nu a putut fi actualizată. Încearcă din nou.");
  };

  const closePicker = useCallback(() => setPickerOpen(false), []);
  const cancelDelete = useCallback(() => setConfirmDelete(false), []);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await deleteSetlist(setlist.id);
    setDeleting(false);
    setConfirmDelete(false);
    if (error) {
      console.error("Error deleting setlist:", error.message);
      setErrorMessage("Sub-lista nu a putut fi ștearsă. Încearcă din nou.");
      return;
    }
    navigate("/sub-liste", { state: { deleted: setlist.date } });
  };

  const cancelClose = useCallback(() => {
    setCloseOpen(false);
    setCloseError(null);
  }, []);

  const handleClose = async (unsungIds) => {
    setClosing(true);
    const { data, error } = await closeSetlist(setlist.id, unsungIds);
    setClosing(false);
    if (error) {
      console.error("Error closing setlist:", error.message);
      setCloseError("Sub-lista nu a putut fi încheiată. Încearcă din nou.");
      return;
    }
    navigate("/sub-liste", {
      state: { closed: setlist.date, moved: unsungIds.length, movedTo: data ?? null },
    });
  };

  const backLink = (
    <Link to="/sub-liste" className="back-link">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15.4 5.4 14 4l-8 8 8 8 1.4-1.4L8.8 12z" />
      </svg>
      Toate sub-listele
    </Link>
  );

  if (!validDate || (!loading && !setlist && !errorMessage)) {
    return (
      <section className="setlist-page">
        {backLink}
        <div className="setlist-missing">
          <p>Sub-lista nu există sau a fost deja încheiată.</p>
          <Link to="/sub-liste" className="btn btn-sun">
            Vezi sub-listele
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="setlist-page">
      {backLink}

      <header className="setlist-header">
        <h1 className="setlist-heading">
          <span className="setlist-weekday">{formatWeekday(date)}</span>{" "}
          <span className="setlist-daymonth">{formatDayMonth(date)}</span>
        </h1>
        <p className="setlist-summary">
          {isPast ? `A fost pe ${formatDayMonth(date)}` : capitalize(untilLabel(date))}
          {setlist && `, ${plural(songs.length, "o cântare", "cântări")}`}
        </p>
      </header>

      <div aria-live="polite">
        {errorMessage && <p className="error-message setlist-message">{errorMessage}</p>}
      </div>

      {loading && <p className="setlist-note">Se încarcă sub-lista…</p>}

      {setlist && songs.length === 0 && (
        <p className="setlist-note">
          {isPast
            ? "Sub-lista e goală."
            : "Sub-lista e goală. Adaugă cântări din lista principală."}
        </p>
      )}

      {setlist && isPast && (
        <p className="setlist-past-note">
          Ziua sub-listei a trecut. Încheie-o ca să marchezi cântările cântate și să le muți pe
          celelalte în sub-lista de luni.
        </p>
      )}

      {songs.length > 0 && (
        <ol className="setlist-songs">
          {songs.map((song, index) => (
            <li key={song.id} className="setlist-row">
              <span className="setlist-number" aria-hidden="true">
                {index + 1}
              </span>
              <span className="song-title setlist-song-title">{song.title}</span>
              <span className="song-key">
                <span className="visually-hidden">Gama </span>
                {song.music_scale}
              </span>
              {!isPast && (
                <div className="setlist-tools">
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Mută „${song.title}” mai sus`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 7.6 5.4 14.2 6.8 15.6 12 10.4l5.2 5.2 1.4-1.4z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Mută „${song.title}” mai jos`}
                    disabled={index === songs.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 16.4 5.4 9.8 6.8 8.4 12 13.6l5.2-5.2 1.4 1.4z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="btn btn-text-danger setlist-remove"
                    aria-label={`Scoate „${song.title}” din sub-listă`}
                    onClick={() => remove(song)}
                  >
                    Scoate
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {setlist && (
        <div className="setlist-actions">
          {isPast ? (
            <button type="button" className="btn btn-sun" onClick={() => setCloseOpen(true)}>
              Încheie sub-lista
            </button>
          ) : (
            <button type="button" className="btn btn-sun" onClick={openPicker}>
              Adaugă cântări
            </button>
          )}
          <button
            type="button"
            className="btn btn-text-danger"
            onClick={() => setConfirmDelete(true)}
          >
            Șterge sub-lista
          </button>
        </div>
      )}

      {pickerOpen && (
        <SongPickerSheet
          songs={allSongs ?? []}
          selectedIds={selectedIds}
          loading={allSongs === null}
          error={pickerError}
          busyId={busyId}
          onToggle={togglePicked}
          onClose={closePicker}
        />
      )}

      {closeOpen && (
        <CloseSetlistSheet
          date={date}
          songs={songs}
          busy={closing}
          error={closeError}
          onConfirm={handleClose}
          onCancel={cancelClose}
        />
      )}

      {confirmDelete && (
        <ConfirmSheet
          title={`Ștergi sub-lista din ${formatDayMonth(date)}?`}
          message={
            isPast
              ? "Cântările rămân în lista principală, dar nu vor fi marcate ca fiind cântate."
              : "Cântările rămân în lista principală."
          }
          confirmLabel="Șterge sub-lista"
          cancelLabel="Renunță"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={cancelDelete}
        />
      )}
    </section>
  );
}

export default Setlist;
