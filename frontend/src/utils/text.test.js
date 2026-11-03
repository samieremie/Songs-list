import { describe, it, expect } from "vitest";
import { filterSongs, groupByLetter, sortByTitle } from "./text";

const songs = [
  { id: 1, title: "Îndură-Te", music_scale: "Mi" },
  { id: 2, title: "Cântă inima", music_scale: "Re" },
  { id: 3, title: "Aleluia", music_scale: "Sol" },
];

describe("filterSongs", () => {
  it("ignores diacritics and case", () => {
    expect(filterSongs(songs, "canta").map((s) => s.id)).toEqual([2]);
    expect(filterSongs(songs, "INDURA").map((s) => s.id)).toEqual([1]);
  });

  it("matches an exact key", () => {
    expect(filterSongs(songs, "sol").map((s) => s.id)).toEqual([3]);
  });

  it("returns everything for an empty query", () => {
    expect(filterSongs(songs, "  ")).toHaveLength(3);
  });
});

describe("groupByLetter", () => {
  it("keeps Romanian letters as their own groups", () => {
    const letters = groupByLetter(sortByTitle(songs)).map(([l]) => l);
    expect(letters).toEqual(["A", "C", "Î"]);
  });
});
