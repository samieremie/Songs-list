import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: {
    from: (...args) => mock.current.client.from(...args),
    rpc: (...args) => mock.current.client.rpc(...args),
  },
}));

import Home from "./Home";

const songs = [
  { id: 1, title: "Doamne, Tu ești", music_scale: "Re" },
  { id: 2, title: "Aleluia", music_scale: "Sol" },
  { id: 3, title: "Cântă inima", music_scale: "Do" },
  { id: 4, title: "Al Tău sunt", music_scale: "La" },
];

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

const titlesIn = (group) =>
  [...group.querySelectorAll(".song-title")].map((el) => el.textContent);

describe("Home", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: songs, error: null });
  });

  it("lists songs grouped by first letter, sorted alphabetically", async () => {
    renderHome();

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["A", "C", "D"]);
    expect(titlesIn(headings[0].closest("section"))).toEqual(["Al Tău sunt", "Aleluia"]);
  });

  it("filters songs as you type, ignoring diacritics", async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText("Aleluia");

    await user.type(screen.getByRole("searchbox"), "canta");

    expect(screen.getByText("Cântă inima")).toBeInTheDocument();
    expect(screen.queryByText("Aleluia")).not.toBeInTheDocument();
  });

  it("offers to add a song when the search finds nothing", async () => {
    const user = userEvent.setup();
    renderHome();
    await screen.findByText("Aleluia");

    await user.type(screen.getByRole("searchbox"), "Osana");

    expect(screen.getByText("Nicio cântare pentru „Osana”.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Adaug-o în listă" })).toBeInTheDocument();
  });

  it("keeps only one song open: opening another closes the previous one", async () => {
    const user = userEvent.setup();
    renderHome();
    const aleluia = await screen.findByRole("button", { name: /Aleluia/ });
    const canta = screen.getByRole("button", { name: /Cântă inima/ });

    await user.click(aleluia);
    expect(aleluia).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "Șterge" })).toHaveLength(1);

    await user.click(canta);
    expect(aleluia).toHaveAttribute("aria-expanded", "false");
    expect(canta).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button", { name: "Șterge" })).toHaveLength(1);

    await user.click(canta);
    expect(canta).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Șterge" })).not.toBeInTheDocument();
  });

  it("asks for confirmation before deleting a song", async () => {
    window.localStorage.setItem("editorCode", "secret");
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("button", { name: /Aleluia/ }));
    await user.click(screen.getByRole("button", { name: "Șterge" }));

    const sheet = screen.getByRole("alertdialog", { name: "Ștergi „Aleluia”?" });
    await user.click(within(sheet).getByRole("button", { name: "Renunță" }));

    expect(mock.current.client.rpc).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("Aleluia")).toBeInTheDocument();
  });

  it("removes a song after the deletion is confirmed, sending the stored code", async () => {
    window.localStorage.setItem("editorCode", "secret");
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("button", { name: /Aleluia/ }));
    await user.click(screen.getByRole("button", { name: "Șterge" }));

    mock.current.query.result = { data: null, error: null };
    await user.click(screen.getByRole("button", { name: "Șterge cântarea" }));

    expect(mock.current.client.rpc).toHaveBeenCalledWith("delete_song", {
      p_id: 2,
      p_code: "secret",
    });
    expect(screen.queryByText("Aleluia")).not.toBeInTheDocument();
    expect(screen.getByText("„Aleluia” a fost ștearsă.")).toBeInTheDocument();
  });

  it("asks for the editor code before the first deletion", async () => {
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("button", { name: /Aleluia/ }));
    await user.click(screen.getByRole("button", { name: "Șterge" }));

    const codeSheet = screen.getByRole("dialog", { name: "Introdu codul de editor" });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();

    mock.current.query.result = { data: true, error: null };
    await user.type(within(codeSheet).getByLabelText("Cod de editor"), "secret");
    await user.click(within(codeSheet).getByRole("button", { name: "Continuă" }));

    expect(mock.current.client.rpc).toHaveBeenCalledWith("check_editor_code", {
      p_code: "secret",
    });
    expect(window.localStorage.getItem("editorCode")).toBe("secret");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("alertdialog", { name: "Ștergi „Aleluia”?" })).toBeInTheDocument();
  });

  it("forgets the code and explains when it has changed", async () => {
    window.localStorage.setItem("editorCode", "old");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    renderHome();
    await user.click(await screen.findByRole("button", { name: /Aleluia/ }));
    await user.click(screen.getByRole("button", { name: "Șterge" }));

    mock.current.query.result = {
      data: null,
      error: { code: "28000", message: "invalid_editor_code" },
    };
    await user.click(screen.getByRole("button", { name: "Șterge cântarea" }));

    expect(
      screen.getByText("Codul de editor s-a schimbat. Introdu-l din nou.")
    ).toBeInTheDocument();
    expect(screen.getByText("Aleluia")).toBeInTheDocument();
    expect(window.localStorage.getItem("editorCode")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Șterge" }));
    expect(screen.getByRole("dialog", { name: "Introdu codul de editor" })).toBeInTheDocument();
  });

  it("shows a Romanian error message when songs cannot be loaded", async () => {
    mock.current = createSupabaseMock({ data: null, error: { message: "boom" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderHome();

    expect(
      await screen.findByText("Nu s-au putut încărca cântările. Încearcă din nou.")
    ).toBeInTheDocument();
  });

  it("adds a song to an upcoming sub-list and shows it on the row", async () => {
    const user = userEvent.setup();
    const results = {
      songs: { data: songs, error: null },
      setlists: {
        data: [{ id: 7, date: "2099-01-05", setlist_songs: [{ song_id: 1, position: 0 }] }],
        error: null,
      },
      setlist_songs: { data: null, error: null },
    };
    mock.current = createSupabaseMock(undefined, (table) => results[table]);
    renderHome();

    expect(await screen.findByText("În sub-lista din 5 ianuarie")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Aleluia/ }));
    await user.click(screen.getByRole("button", { name: "Adaugă în sub-listă" }));
    const sheet = screen.getByRole("dialog", { name: "Adaugă „Aleluia” în sub-listă" });
    await user.click(within(sheet).getByRole("checkbox", { name: /5 ianuarie/ }));

    expect(mock.current.queries.setlist_songs.insert).toHaveBeenCalledWith([
      { setlist_id: 7, song_id: 2, position: 1 },
    ]);
    await user.click(within(sheet).getByRole("button", { name: "Gata" }));
    expect(screen.getAllByText("În sub-lista din 5 ianuarie")).toHaveLength(2);
  });
});
