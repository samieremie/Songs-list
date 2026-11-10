import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSupabaseMock } from "../test/supabaseMock";
import { todayISO } from "../utils/dates";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { from: (...args) => mock.current.client.from(...args) },
}));

import SongCard from "./SongCard";

// SongCard is controlled by its parent; this harness plays the parent's role.
function Harness(props) {
  const [expanded, setExpanded] = useState(false);
  return (
    <ul>
      <SongCard {...props} expanded={expanded} onToggle={() => setExpanded((o) => !o)} />
    </ul>
  );
}

function renderCard(song, onDelete = vi.fn()) {
  const utils = render(<Harness song={song} onDelete={onDelete} />);
  return { ...utils, row: utils.container.querySelector(".song-row"), onDelete };
}

const openRow = (user, title) =>
  user.click(screen.getByRole("button", { name: new RegExp(title) }));

describe("SongCard", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: null, error: null });
  });

  it("shows the title and the key without opening the row", () => {
    renderCard({ id: 1, title: "Ce bine e", music_scale: "Re" });

    expect(screen.getByText("Ce bine e")).toBeInTheDocument();
    expect(screen.getByText("Re")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Șterge" })).not.toBeInTheDocument();
  });

  it("lets the parent decide whether the row is open", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const song = { id: 1, title: "Ce bine e", music_scale: "Re" };
    const { rerender } = render(
      <ul>
        <SongCard song={song} expanded={false} onToggle={onToggle} />
      </ul>
    );
    const summary = screen.getByRole("button", { name: /Ce bine e/ });

    await user.click(summary);
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(summary).toHaveAttribute("aria-expanded", "false");

    rerender(
      <ul>
        <SongCard song={song} expanded onToggle={onToggle} />
      </ul>
    );
    expect(summary).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Șterge" })).toBeInTheDocument();
  });

  it("shows when the song was last sung", () => {
    renderCard({ id: 1, title: "A", music_scale: "Do", last_sung: todayISO() });
    expect(screen.getByText("Cântată azi")).toBeInTheDocument();
  });

  it("asks the parent to delete the song", async () => {
    const user = userEvent.setup();
    const song = { id: 7, title: "Aleluia", music_scale: "Do" };
    const { onDelete } = renderCard(song);

    await openRow(user, "Aleluia");
    await user.click(screen.getByRole("button", { name: "Șterge" }));

    expect(onDelete).toHaveBeenCalledWith(song);
  });

  it("marks a song as sung today and highlights it", async () => {
    const user = userEvent.setup();
    const { row } = renderCard({ id: 3, title: "Aleluia", music_scale: "Do", last_sung: null });

    await openRow(user, "Aleluia");
    await user.click(screen.getByRole("button", { name: "Marchează cântată azi" }));

    expect(mock.current.client.from).toHaveBeenCalledWith("songs");
    expect(mock.current.query.update).toHaveBeenCalledWith({ last_sung: todayISO() });
    expect(mock.current.query.eq).toHaveBeenCalledWith("id", 3);
    expect(row).toHaveClass("is-recent");
    expect(screen.getByText("Cântată azi")).toBeInTheDocument();
  });

  it("undo restores the previous date", async () => {
    const user = userEvent.setup();
    renderCard({ id: 3, title: "Aleluia", music_scale: "Do", last_sung: "2020-01-05" });

    await openRow(user, "Aleluia");
    await user.click(screen.getByRole("button", { name: "Marchează cântată azi" }));
    await user.click(screen.getByRole("button", { name: "Anulează „cântată azi”" }));

    expect(mock.current.query.update).toHaveBeenLastCalledWith({ last_sung: "2020-01-05" });
    expect(screen.queryByText("Cântată azi")).not.toBeInTheDocument();
  });

  it("shows a Romanian error message when the update fails", async () => {
    const user = userEvent.setup();
    mock.current = createSupabaseMock({ data: null, error: { message: "boom" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderCard({ id: 3, title: "Aleluia", music_scale: "Do" });

    await openRow(user, "Aleluia");
    await user.click(screen.getByRole("button", { name: "Marchează cântată azi" }));

    expect(
      screen.getByText("Nu s-a putut actualiza cântarea. Încearcă din nou.")
    ).toBeInTheDocument();
  });
});
