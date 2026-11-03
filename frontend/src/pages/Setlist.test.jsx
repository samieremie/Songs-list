import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { from: (...args) => mock.current.client.from(...args) },
}));

import Setlist from "./Setlist";

const DATE = "2099-01-05";
const songs = {
  aleluia: { id: 2, title: "Aleluia", music_scale: "Sol" },
  osana: { id: 5, title: "Osana", music_scale: "Re" },
  canta: { id: 3, title: "Cântă inima", music_scale: "Do" },
};

const setlistRow = {
  id: 7,
  date: DATE,
  // Deliberately out of order: the page sorts by position.
  setlist_songs: [
    { position: 1, songs: songs.osana },
    { position: 0, songs: songs.aleluia },
  ],
};

function mockTables(overrides = {}) {
  const results = {
    setlists: { data: setlistRow, error: null },
    setlist_songs: { data: null, error: null },
    songs: { data: Object.values(songs), error: null },
    ...overrides,
  };
  mock.current = createSupabaseMock(undefined, (table) => results[table]);
  return results;
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={[`/sub-liste/${DATE}`]}>
      <Routes>
        <Route path="/sub-liste" element={<p>Pagina sub-listelor</p>} />
        <Route path="/sub-liste/:date" element={<Setlist />} />
      </Routes>
    </MemoryRouter>
  );

const titles = () =>
  [...document.querySelectorAll(".setlist-song-title")].map((el) => el.textContent);

describe("Setlist", () => {
  beforeEach(() => {
    mockTables();
  });

  it("shows the songs in singing order, numbered", async () => {
    renderPage();

    expect(await screen.findByText("Osana")).toBeInTheDocument();
    expect(titles()).toEqual(["Aleluia", "Osana"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("ianuarie");
  });

  it("moves a song down and saves the new order", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Osana");

    await user.click(screen.getByRole("button", { name: "Mută „Aleluia” mai jos" }));

    expect(titles()).toEqual(["Osana", "Aleluia"]);
    expect(mock.current.queries.setlist_songs.upsert).toHaveBeenCalledWith(
      [
        { setlist_id: 7, song_id: 5, position: 0 },
        { setlist_id: 7, song_id: 2, position: 1 },
      ],
      { onConflict: "setlist_id,song_id" }
    );
  });

  it("puts the order back when saving fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockTables({ setlist_songs: { data: null, error: { message: "boom" } } });
    renderPage();
    await screen.findByText("Osana");

    await user.click(screen.getByRole("button", { name: "Mută „Aleluia” mai jos" }));

    expect(titles()).toEqual(["Aleluia", "Osana"]);
    expect(
      screen.getByText("Ordinea nu a putut fi salvată. Încearcă din nou.")
    ).toBeInTheDocument();
  });

  it("removes a song from the sub-list only", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Osana");

    await user.click(screen.getByRole("button", { name: "Scoate „Osana” din sub-listă" }));

    expect(titles()).toEqual(["Aleluia"]);
    expect(mock.current.queries.setlist_songs.delete).toHaveBeenCalled();
    expect(mock.current.queries.setlist_songs.eq).toHaveBeenCalledWith("song_id", 5);
  });

  it("adds songs from the main list with the picker", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Osana");

    await user.click(screen.getByRole("button", { name: "Adaugă cântări" }));
    const sheet = screen.getByRole("dialog", { name: "Adaugă cântări" });
    await user.click(await within(sheet).findByRole("checkbox", { name: /Cântă inima/ }));

    expect(mock.current.queries.setlist_songs.insert).toHaveBeenCalledWith([
      { setlist_id: 7, song_id: 3, position: 2 },
    ]);
    expect(within(sheet).getByRole("checkbox", { name: /Cântă inima/ })).toBeChecked();

    await user.click(within(sheet).getByRole("button", { name: "Gata" }));
    expect(titles()).toEqual(["Aleluia", "Osana", "Cântă inima"]);
  });

  it("deletes the whole sub-list after confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Osana");

    await user.click(screen.getByRole("button", { name: "Șterge sub-lista" }));
    const sheet = screen.getByRole("alertdialog");
    expect(sheet).toHaveTextContent("Cântările rămân în lista principală.");
    await user.click(within(sheet).getByRole("button", { name: "Șterge sub-lista" }));

    expect(mock.current.queries.setlists.delete).toHaveBeenCalled();
    expect(await screen.findByText("Pagina sub-listelor")).toBeInTheDocument();
  });

  it("says when the sub-list no longer exists", async () => {
    mockTables({ setlists: { data: null, error: null } });
    renderPage();

    expect(
      await screen.findByText("Sub-lista nu mai există. Poate ziua ei a trecut deja.")
    ).toBeInTheDocument();
  });
});
