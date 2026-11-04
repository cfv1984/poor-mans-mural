import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import World from ".";
import { load } from "../../api";
import { hover, makeNote, moveTo, press, release, renderWithStore, stubRect } from "../../test/utils";
import { Colors } from "../Note/types";

async function setup(notes = [makeNote()]) {
  const view = await renderWithStore(<World />, notes);
  const viewport = view.container.querySelector("main")!;
  const trash = document.getElementById("trash")!;
  stubRect(viewport, 0, 0, 1000, 760);
  stubRect(trash, 0, 600, 160, 160);
  const note = document.getElementById("note-1");
  if (note) stubRect(note, 100, 100, 200, 150);
  return {
    ...view,
    viewport,
    trash,
    note: note!,
    world: viewport.querySelector("section")!,
    saveButton: screen.getByRole("button", { name: "Save" }),
  };
}

function clickAt(el: Element, x: number, y: number) {
  press(el, x, y);
  release(el, x, y);
  fireEvent.click(el, { clientX: x, clientY: y });
}

describe("World", () => {
  describe("clicking empty space", () => {
    it("adds a note at the click", async () => {
      const { viewport, store } = await setup([]);

      clickAt(viewport, 300, 400);

      expect(store().notes).toHaveLength(1);
      expect(store().notes[0]?.position).toEqual([300, 400]);
      expect(document.getElementById(store().notes[0]!.id)).not.toBeNull();
    });

    it("places the note in world coordinates after the camera has moved", async () => {
      const { viewport, store } = await setup([]);

      fireEvent.wheel(viewport, { deltaX: 50, deltaY: 20 });
      clickAt(viewport, 300, 400);

      expect(store().notes[0]?.position).toEqual([350, 420]);
    });

    it.each([
      { random: 0, size: [100, 100], color: Colors.RED },
      { random: 0.999, size: [300, 300], color: Colors.YELLOW },
    ])("sizes and colours new notes randomly: $random", async ({ random, size, color }) => {
      const { viewport, store } = await setup([]);
      vi.spyOn(Math, "random").mockReturnValue(random);

      clickAt(viewport, 300, 400);

      expect(store().notes[0]).toMatchObject({ dimensions: size, color });
    });

    it("still adds a note when the pointer jitters within the drag threshold", async () => {
      const { viewport, store } = await setup([]);

      press(viewport, 300, 400);
      moveTo(viewport, 302, 401);
      release(viewport, 302, 401);
      fireEvent.click(viewport, { clientX: 302, clientY: 401 });

      expect(store().notes).toHaveLength(1);
    });

    it("does not add a note at the end of a pan", async () => {
      const { viewport, store } = await setup([]);

      press(viewport, 300, 400);
      moveTo(viewport, 350, 450);
      release(viewport, 350, 450);
      fireEvent.click(viewport, { clientX: 350, clientY: 450 });

      expect(store().notes).toHaveLength(0);
    });

    it("only closes an open edit on the first click, without adding a note", async () => {
      const { viewport, note, store } = await setup();
      const title = screen.getByPlaceholderText<HTMLInputElement>("Title");

      fireEvent.doubleClick(note);
      press(viewport, 600, 400);
      act(() => title.blur());
      release(viewport, 600, 400);
      fireEvent.click(viewport, { clientX: 600, clientY: 400 });

      expect(store().notes).toHaveLength(1);
      expect(title.readOnly).toBe(true);

      clickAt(viewport, 600, 400);

      expect(store().notes).toHaveLength(2);
    });

    it("still adds a note when the focused field is read-only", async () => {
      const { viewport, store } = await setup();
      const title = screen.getByPlaceholderText<HTMLInputElement>("Title");

      act(() => title.focus());
      clickAt(viewport, 600, 400);

      expect(store().notes).toHaveLength(2);
    });
  });

  it.each(["trash", "save button", "note"])(
    "does not add a note when clicking the %s",
    async (name) => {
      const { trash, saveButton, note, store } = await setup();
      const target = { trash, "save button": saveButton, note }[name]!;

      clickAt(target, 50, 650);

      expect(store().notes).toHaveLength(1);
    },
  );

  describe("panning", () => {
    it("moves the world, carrying its notes along", async () => {
      const { viewport, world, note } = await setup();

      press(viewport, 300, 400);
      moveTo(viewport, 350, 380);

      expect(world.style.transform).toBe("translate(50px, -20px)");
      expect(world.contains(note)).toBe(true);
    });

    it("cannot move the trash or the save button, which sit outside the world", async () => {
      const { viewport, world, trash, saveButton } = await setup();

      expect(world.contains(trash)).toBe(false);
      expect(world.contains(saveButton)).toBe(false);
      expect(trash.parentElement).toBe(viewport);
      expect(saveButton.parentElement).toBe(viewport);
    });
  });

  describe("dropping a note in the trash", () => {
    it("removes it without adding a note, when the note gets the release", async () => {
      const { viewport, note, store } = await setup();

      press(note, 150, 150);
      moveTo(note, 150, 650);
      release(note, 150, 650);
      fireEvent.click(viewport, { clientX: 150, clientY: 650 });

      expect(store().notes).toHaveLength(0);
    });

    it("removes it without adding a note, when capture is lost before the release", async () => {
      const { viewport, trash, note, store } = await setup();
      const trashIcon = trash.querySelector("svg")!;

      press(note, 150, 150);
      moveTo(note, 150, 650);
      hover(note, 150, 650);
      release(trashIcon, 150, 650);
      fireEvent.click(viewport, { clientX: 150, clientY: 650 });

      expect(store().notes).toHaveLength(0);
      expect(store().trashHighlighted).toBe(false);
    });

    it("removes it without adding a note, when only the release misses the note", async () => {
      const { viewport, trash, note, store } = await setup();

      press(note, 150, 150);
      moveTo(note, 150, 650);
      release(trash, 150, 650);
      fireEvent.click(viewport, { clientX: 150, clientY: 650 });

      expect(store().notes).toHaveLength(0);
    });

    it("leaves it out of what Save writes", async () => {
      const other = makeNote({ id: "other" });
      const { note, saveButton } = await setup([makeNote(), other]);

      press(note, 150, 150);
      moveTo(note, 150, 650);
      release(note, 150, 650);

      vi.useFakeTimers({ toFake: ["setTimeout"] });
      fireEvent.click(saveButton);
      await act(() => vi.advanceTimersByTimeAsync(300));

      expect(await load()).toEqual([other]);
    });
  });

  it("does not add a note when a dragged note is released over the viewport", async () => {
    const { viewport, note, store } = await setup();

    press(note, 150, 150);
    moveTo(note, 600, 300);
    release(viewport, 600, 300);
    fireEvent.click(viewport, { clientX: 600, clientY: 300 });

    expect(store().notes).toHaveLength(1);
    expect(store().notes[0]?.position).toEqual([550, 250]);
  });
});
