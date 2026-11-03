import "../css/LetterIndex.css";

function LetterIndex({ letters, onJump }) {
  return (
    <nav className="letter-index" aria-label="Sari la literă">
      <ul>
        {letters.map((letter) => (
          <li key={letter}>
            <button type="button" onClick={() => onJump(letter)}>
              {letter}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default LetterIndex;
