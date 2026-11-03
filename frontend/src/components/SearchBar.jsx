import "../css/SearchBar.css";

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search" role="search">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="search-icon">
        <path d="M21.53 20.47l-3.66-3.66A8.96 8.96 0 0 0 20 11a9 9 0 1 0-9 9c2.2 0 4.24-.8 5.8-2.13l3.67 3.66a.75.75 0 0 0 1.06-1.06zM3.5 11a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0z" />
      </svg>
      <label htmlFor="song-search" className="visually-hidden">
        Caută o cântare
      </label>
      <input
        id="song-search"
        className="search-input"
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-clear"
          aria-label="Golește căutarea"
          onClick={() => onChange("")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19l5.6-5.6 5.6 5.6 1.4-1.4-5.6-5.6L19 6.4 17.6 5 12 10.6z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default SearchBar;
