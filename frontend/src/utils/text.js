// Romanian puts "de" between a number and its noun from 20 upwards
// ("20 de zile", "42 de cântări"), except when the last two digits are 1-19
// ("101 zile").
export function plural(n, one, many) {
  if (n === 1) return one;
  const rest = n % 100;
  const needsDe = n >= 20 && (rest === 0 || rest >= 20);
  return `${n} ${needsDe ? "de " : ""}${many}`;
}

// Lowercase and strip diacritics so "cantare" matches "Cântare".
export function normalize(text) {
  return (text ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function sortByTitle(songs) {
  return [...songs].sort((a, b) =>
    a.title.localeCompare(b.title, "ro", { sensitivity: "base" })
  );
}

// Groups songs (already sorted) by their first letter, keeping Romanian
// letters like Î or Ș as their own group. Returns [[letter, songs], ...].
export function groupByLetter(songs) {
  const groups = new Map();
  for (const song of songs) {
    const letter = song.title.trim().charAt(0).toLocaleUpperCase("ro") || "#";
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(song);
  }
  return [...groups.entries()];
}

export function filterSongs(songs, query) {
  const q = normalize(query);
  if (!q) return songs;
  return songs.filter(
    (song) =>
      normalize(song.title).includes(q) || normalize(song.music_scale) === q
  );
}
