import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSupabaseMock } from "../test/supabaseMock";

const mock = vi.hoisted(() => ({ current: null }));
vi.mock("../api/songsApi", () => ({
  default: { from: (...args) => mock.current.client.from(...args) },
}));

import SongCard from "./SongCard";

const today = () => new Date().toISOString().split("T")[0];

describe("SongCard", () => {
  beforeEach(() => {
    mock.current = createSupabaseMock({ data: null, error: null });
  });

  it("shows the title and music scale", () => {
    const { container } = render(
      <SongCard song={{ id: 1, title: "Ce bine e", music_scale: "Re" }} onDelete={vi.fn()} />
    );
    expect(screen.getByText("Ce bine e")).toBeInTheDocument();
    expect(container.querySelector(".music-scale")).toHaveTextContent("Gama: Re");
  });

  it("calls onDelete with the song id", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<SongCard song={{ id: 7, title: "A", music_scale: "Do" }} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Șterge" }));

    expect(onDelete).toHaveBeenCalledWith(7);
  });

  it("marks a song as sung today and highlights it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SongCard song={{ id: 3, title: "A", music_scale: "Do", last_sung: null }} onDelete={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Cântat" }));

    expect(mock.current.client.from).toHaveBeenCalledWith("songs");
    expect(mock.current.query.update).toHaveBeenCalledWith({ last_sung: today() });
    expect(mock.current.query.eq).toHaveBeenCalledWith("id", 3);
    expect(container.querySelector(".song-card")).toHaveClass("recently-sung");
  });

  it("clears last_sung when clicked on a recently sung song", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <SongCard song={{ id: 3, title: "A", music_scale: "Do", last_sung: today() }} onDelete={vi.fn()} />
    );
    expect(container.querySelector(".song-card")).toHaveClass("recently-sung");

    await user.click(screen.getByRole("button", { name: "Cântat" }));

    expect(mock.current.query.update).toHaveBeenCalledWith({ last_sung: null });
    expect(container.querySelector(".song-card")).not.toHaveClass("recently-sung");
  });

  it("shows a Romanian error message when the update fails", async () => {
    const user = userEvent.setup();
    mock.current = createSupabaseMock({ data: null, error: { message: "boom" } });
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SongCard song={{ id: 3, title: "A", music_scale: "Do" }} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cântat" }));

    expect(
      screen.getByText("Nu s-a putut actualiza cântarea. Încearcă din nou.")
    ).toBeInTheDocument();
  });
});
