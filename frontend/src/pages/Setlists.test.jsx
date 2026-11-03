import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/sub-liste"]}>
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
    expect(mock.current.query.gte).toHaveBeenCalledWith("date", expect.any(String));
    expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "/sub-liste/2099-01-05");
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
