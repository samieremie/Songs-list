import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { from: (...args) => mock.current.client.from(...args) },
}));

import Setlists from "./Setlists";

const upcoming = [
  { id: 1, date: "2099-01-05", setlist_songs: [{ song_id: 1 }, { song_id: 2 }] },
  { id: 2, date: "2099-01-12", setlist_songs: [] },
];

const renderPage = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/sub-liste", state }]}>
      <Routes>
        <Route path="/sub-liste" element={<Setlists />} />
        <Route path="/sub-liste/:date" element={<p>Pagina sub-listei</p>} />
      </Routes>
    </MemoryRouter>
  );

describe("Setlists", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: upcoming, error: null });
  });

  it("lists upcoming sub-lists with their song count", async () => {
    renderPage();

    expect(await screen.findByText("2 cântări")).toBeInTheDocument();
    expect(screen.getByText("goală")).toBeInTheDocument();
    expect(mock.current.query.gte).not.toHaveBeenCalled();
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/sub-liste/2099-01-05");
  });

  it("puts past sub-lists first, to be closed", async () => {
    mock.current = createSupabaseMock({
      data: [{ id: 3, date: "2020-01-06", setlist_songs: [{ song_id: 1 }] }, ...upcoming],
      error: null,
    });
    renderPage();

    const past = await screen.findByRole("list", { name: "Sub-liste de încheiat" });
    expect(screen.getByRole("heading", { name: "De încheiat" })).toBeInTheDocument();
    expect(within(past).getByRole("link")).toHaveAttribute("href", "/sub-liste/2020-01-06");
    expect(within(past).getByText("o cântare")).toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Sub-liste pregătite" })).getAllByRole("link")
    ).toHaveLength(2);
  });

  it("says where the unsung songs went after closing a list", async () => {
    renderPage({ closed: "2026-11-09", moved: 2, movedTo: "2026-11-16" });

    expect(
      await screen.findByText(
        "Sub-lista din 9 noiembrie a fost încheiată. 2 cântări au fost mutate în sub-lista din 16 noiembrie."
      )
    ).toBeInTheDocument();
  });

  it("shows an empty state when there are no sub-lists", async () => {
    mock.current = createSupabaseMock({ data: [], error: null });
    renderPage();

    expect(
      await screen.findByText("Nicio sub-listă încă. Creează una pentru luni.")
    ).toBeInTheDocument();
  });

  it("creates a sub-list and opens it", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("2 cântări");

    const input = screen.getByLabelText("Ziua");
    await user.clear(input);
    await user.type(input, "2099-02-02");
    mock.current.query.result = { data: { id: 9, date: "2099-02-02" }, error: null };
    await user.click(screen.getByRole("button", { name: "Creează sub-lista" }));

    expect(mock.current.query.insert).toHaveBeenCalledWith([{ date: "2099-02-02" }]);
    expect(await screen.findByText("Pagina sub-listei")).toBeInTheDocument();
  });

  it("explains when a sub-list already exists for that day", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("2 cântări");

    mock.current.query.result = { data: null, error: { code: "23505", message: "dup" } };
    await user.click(screen.getByRole("button", { name: "Creează sub-lista" }));

    expect(
      await screen.findByText("Există deja o sub-listă pentru această zi.")
    ).toBeInTheDocument();
  });
});
