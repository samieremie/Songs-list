import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createSetlist, DUPLICATE_DATE, listUpcomingSetlists } from "../api/setlists";
import { formatDayMonth, formatServiceDate, nextWeekday, todayISO, untilLabel } from "../utils/dates";
import { plural } from "../utils/text";
import "../css/Setlists.css";

const MONDAY = 1;

function Setlists() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = todayISO();

  const [setlists, setSetlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusMessage] = useState(() =>
    location.state?.deleted
      ? `Sub-lista din ${formatDayMonth(location.state.deleted)} a fost ștearsă.`
      : null
  );

  const [date, setDate] = useState(() => nextWeekday(MONDAY));
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSetlists = async () => {
      const { data, error } = await listUpcomingSetlists(today);
      if (cancelled) return;

      if (error) {
        console.error("Error fetching setlists:", error.message);
        setLoadError("Nu s-au putut încărca sub-listele. Încearcă din nou.");
      } else {
        setSetlists(data ?? []);
      }
      setLoading(false);
    };

    fetchSetlists();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!date || date < today) {
      setCreateError("Alege ziua de azi sau o zi care urmează.");
      return;
    }

    setCreating(true);
    const { data, error } = await createSetlist(date);
    setCreating(false);

    if (error) {
      if (error.code === DUPLICATE_DATE) {
        setCreateError("Există deja o sub-listă pentru această zi.");
      } else {
        console.error("Error creating setlist:", error.message);
        setCreateError("Sub-lista nu a putut fi creată. Încearcă din nou.");
      }
      return;
    }
    navigate(`/sub-liste/${data.date}`);
  };

  return (
    <section className="setlists-page">
      <h1 className="page-title">Sub-liste</h1>
      <p className="page-lede">
        Cântările pregătite pentru o zi anume. O sub-listă dispare singură după ziua ei.
      </p>

      <form className="setlist-create" onSubmit={handleCreate} noValidate>
        <label htmlFor="setlist-date">Ziua</label>
        <div className="setlist-create-row">
          <input
            id="setlist-date"
            type="date"
            min={today}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setCreateError(null);
            }}
            aria-invalid={Boolean(createError)}
            aria-describedby={createError ? "setlist-date-error" : undefined}
          />
          <button type="submit" className="btn btn-sun" disabled={creating}>
            {creating ? "Se creează…" : "Creează sub-lista"}
          </button>
        </div>
        {createError && (
          <p id="setlist-date-error" className="field-error" role="alert">
            {createError}
          </p>
        )}
      </form>

      <div aria-live="polite">
        {statusMessage && <p className="status-message setlists-message">{statusMessage}</p>}
        {loadError && <p className="error-message setlists-message">{loadError}</p>}
      </div>

      {loading && <p className="setlists-note">Se încarcă sub-listele…</p>}

      {!loading && !loadError && setlists.length === 0 && (
        <p className="setlists-note">Nicio sub-listă încă. Creează una pentru luni.</p>
      )}

      {setlists.length > 0 && (
        <ul className="setlist-cards" aria-label="Sub-liste pregătite">
          {setlists.map((setlist) => {
            const count = setlist.setlist_songs?.length ?? 0;
            return (
              <li key={setlist.id}>
                <Link to={`/sub-liste/${setlist.date}`} className="setlist-card">
                  <span className="setlist-card-text">
                    <span className="setlist-card-date">{formatServiceDate(setlist.date)}</span>
                    <span className="setlist-card-until">{untilLabel(setlist.date)}</span>
                  </span>
                  <span className="setlist-card-count">
                    {count === 0 ? "goală" : plural(count, "o cântare", "cântări")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default Setlists;
