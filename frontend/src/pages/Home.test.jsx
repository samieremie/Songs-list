import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { from: (...args) => mock.current.client.from(...args) },
}));

import Home from "./Home";

const songs = [
  { id: 1, title: "Doamne, Tu esti", music_scale: "Re" },
  { id: 2, title: "Aleluia", music_scale: "Sol" },
  { id: 3, title: "Ce bine e", music_scale: "Do" },
  { id: 4, title: "Al Tau sunt", music_scale: "La" },
];

describe("Home", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: songs, error: null });
  });

  it("lists songs grouped by first letter, sorted alphabetically", async () => {
    render(<Home />);

    const headings = await screen.findAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["- A -", "- C -", "- D -"]);

    const groupA = headings[0].closest(".song-group");
    const titlesA = within(groupA)
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent);
    expect(titlesA).toEqual(["Al Tau sunt", "Aleluia"]);
  });

  it("removes a song from the list after deleting it", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await screen.findByText("Aleluia");

    mock.current.query.result = { data: null, error: null };
    const card = screen.getByText("Aleluia").closest(".song-card");
    await user.click(within(card).getByRole("button", { name: "Șterge" }));

    expect(mock.current.query.delete).toHaveBeenCalled();
    expect(mock.current.query.eq).toHaveBeenCalledWith("id", 2);
    expect(screen.queryByText("Aleluia")).not.toBeInTheDocument();
  });

  it("shows a Romanian error message when songs cannot be loaded", async () => {
    mock.current = createSupabaseMock({ data: null, error: { message: "boom" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<Home />);

    expect(
      await screen.findByText("Nu s-au putut încărca cântările. Încearcă din nou.")
    ).toBeInTheDocument();
  });
});
