import { act, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Note from ".";
import { useStore } from "../../store";
import { hover, makeNote, moveTo, press, release, renderWithStore, stubRect } from "../../test/utils";
import Trash from "../Trash";

function Board() {
  const [store] = useStore();
  return (
    <>
      {store.notes.map((n) => (
        <Note key={n.id} {...n} />
      ))}
      <Trash />
    </>
  );
}

async function setup(notes = [makeNote()]) {
  const view = await renderWithStore(<Board />, notes);
  const section = document.getElementById("note-1")!;
  stubRect(section, 100, 100, 200, 150);
  stubRect(document.getElementById("trash")!, 0, 600, 160, 160);
  return {
    ...view,
    section,
    note: () => view.store().notes.find((n) => n.id === "note-1"),
    title: within(section).getByPlaceholderText<HTMLInputElement>("Title"),
    contents: within(section).getByPlaceholderText<HTMLTextAreaElement>("Write something..."),
    handle: section.querySelector("svg")!,
  };
}

describe("Note", () => {
  it("places and colours itself from its props", async () => {
    const { section, title, contents } = await setup([
      makeNote({ position: [11, 22], dimensions: [333, 444], color: "aqua", zIndex: 5 }),
    ]);

    expect(section.style).toMatchObject({
      left: "11px",
      top: "22px",
      width: "333px",
      height: "444px",
      background: "aqua",
      zIndex: "5",
    });
    expect(title.value).toBe("Title");
    expect(contents.value).toBe("Contents");
  });

  it("shows empty fields for a note with no title or contents", async () => {
    const { id, position, dimensions, color } = makeNote();
    const { title, contents } = await setup([{ id, position, dimensions, color }]);

    expect(title.value).toBe("");
    expect(contents.value).toBe("");
  });

  it("comes to the front when pressed", async () => {
    const other = makeNote({ id: "other", zIndex: 5 });
    const { section, note, store } = await setup([makeNote({ zIndex: 1 }), other]);

    press(section, 150, 150);

    expect(note()?.zIndex).toBe(6);
    expect(store().notes[1]).toEqual(other);
  });

  describe("editing", () => {
    it("is read-only and out of the tab order until double-clicked", async () => {
      const { title, contents } = await setup();

      expect(title.readOnly).toBe(true);
      expect(contents.readOnly).toBe(true);
      expect(title.tabIndex).toBe(-1);
      expect(contents.tabIndex).toBe(-1);
    });

    it("becomes editable on double-click, with the title focused", async () => {
      const { section, title, contents } = await setup();

      fireEvent.doubleClick(section);

      expect(title.readOnly).toBe(false);
      expect(contents.readOnly).toBe(false);
      expect(title.tabIndex).toBe(0);
      expect(contents.tabIndex).toBe(0);
      expect(document.activeElement).toBe(title);
    });

    it("keeps typing out of the store until editing ends", async () => {
      const { section, title, contents, note } = await setup();

      fireEvent.doubleClick(section);
      fireEvent.change(title, { target: { value: "New title" } });
      fireEvent.change(contents, { target: { value: "New contents" } });

      expect(title.value).toBe("New title");
      expect(contents.value).toBe("New contents");
      expect(note()).toMatchObject({ title: "Title", contents: "Contents" });

      act(() => contents.focus());
      act(() => contents.blur());

      expect(note()).toMatchObject({ title: "New title", contents: "New contents" });
      expect(title.readOnly).toBe(true);
    });

    it("keeps editing when focus moves between its own fields", async () => {
      const { section, title, contents, note } = await setup();

      fireEvent.doubleClick(section);
      fireEvent.change(title, { target: { value: "New title" } });
      act(() => contents.focus());

      expect(title.readOnly).toBe(false);
      expect(note()?.title).toBe("Title");
    });

    it("keeps editing when the whole window loses focus", async () => {
      const { section, title } = await setup();
      vi.spyOn(document, "hasFocus").mockReturnValue(false);

      fireEvent.doubleClick(section);
      act(() => title.blur());

      expect(title.readOnly).toBe(false);
    });

    it("does not touch the store when nothing changed", async () => {
      const { section, title, store } = await setup();
      const before = store().notes;

      fireEvent.doubleClick(section);
      act(() => title.blur());

      expect(title.readOnly).toBe(true);
      expect(store().notes).toBe(before);
    });

    it("commits on Enter in the title", async () => {
      const { section, title, note } = await setup();

      fireEvent.doubleClick(section);
      fireEvent.change(title, { target: { value: "New title" } });
      fireEvent.keyDown(title, { key: "Enter" });

      expect(note()?.title).toBe("New title");
      expect(title.readOnly).toBe(true);
    });

    it("keeps editing on Enter in the contents, for new lines", async () => {
      const { section, contents } = await setup();

      fireEvent.doubleClick(section);
      act(() => contents.focus());
      fireEvent.keyDown(contents, { key: "Enter" });

      expect(contents.readOnly).toBe(false);
    });

    it.each(["Title", "Write something..."])(
      "commits rather than discards on Escape in %s",
      async (placeholder) => {
        const { section, note } = await setup();
        const field = screen.getByPlaceholderText<HTMLInputElement>(placeholder);

        fireEvent.doubleClick(section);
        act(() => field.focus());
        fireEvent.change(field, { target: { value: "Kept" } });
        fireEvent.keyDown(field, { key: "Escape" });

        expect(field.readOnly).toBe(true);
        expect([note()?.title, note()?.contents]).toContain("Kept");
      },
    );

    it("does not start a drag from inside a field being edited", async () => {
      const { section, title, note } = await setup();

      fireEvent.doubleClick(section);
      press(title, 150, 150);
      moveTo(title, 400, 400);
      release(title, 400, 400);

      expect(section.style.left).toBe("100px");
      expect(note()?.position).toEqual([100, 100]);
    });
  });

  describe("dragging", () => {
    it("follows the pointer but leaves the store alone until dropped", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 180, 170);

      expect(section.style.left).toBe("130px");
      expect(section.style.top).toBe("120px");
      expect(note()?.position).toEqual([100, 100]);
    });

    it("saves the new position to the store on drop", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 180, 170);
      release(section, 180, 170);

      expect(note()?.position).toEqual([130, 120]);
      expect(section.style.left).toBe("130px");
    });

    it("can be dragged from a field that is not being edited", async () => {
      const { title, note } = await setup();

      press(title, 150, 150);
      moveTo(title, 180, 170);
      release(title, 180, 170);

      expect(note()?.position).toEqual([130, 120]);
    });

    it("does not follow the pointer after a drag ended on a buttonless move", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 180, 170);
      hover(section, 180, 170);
      hover(section, 500, 500);

      expect(note()?.position).toEqual([130, 120]);
      expect(section.style.left).toBe("130px");
    });
  });

  describe("dragging onto the trash", () => {
    it("removes the note when it is dropped overlapping the trash", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 150, 600);
      release(section, 150, 600);

      expect(note()).toBeUndefined();
      expect(document.getElementById("note-1")).toBeNull();
    });

    it("removes only that note", async () => {
      const other = makeNote({ id: "other" });
      const { section, store } = await setup([makeNote(), other]);

      press(section, 150, 150);
      moveTo(section, 150, 600);
      release(section, 150, 600);

      expect(store().notes).toEqual([other]);
    });

    it("goes by the note overlapping the trash, not by where the pointer is", async () => {
      const { section, note } = await setup();

      press(section, 290, 240);
      moveTo(section, 290, 600);
      release(section, 290, 600);

      expect(note()).toBeUndefined();
    });

    it("keeps a note that only touches the edge of the trash", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 150, 500);
      release(section, 150, 500);

      expect(note()?.position).toEqual([100, 450]);
    });

    it("moves rather than removes a note dropped clear of the trash", async () => {
      const { section, note } = await setup();

      press(section, 150, 150);
      moveTo(section, 600, 150);
      release(section, 600, 150);

      expect(note()?.position).toEqual([550, 100]);
    });

    it("removes the note when the release lands on the trash, not on the note", async () => {
      const { section, note } = await setup();
      const trash = document.getElementById("trash")!;

      press(section, 150, 150);
      moveTo(section, 150, 600);
      release(trash, 150, 600);

      expect(note()).toBeUndefined();
    });

    it("removes the note when a buttonless move precedes the release", async () => {
      const { section, note } = await setup();
      const trash = document.getElementById("trash")!;

      press(section, 150, 150);
      moveTo(section, 150, 600);
      hover(section, 150, 600);
      release(trash, 150, 600);

      expect(note()).toBeUndefined();
    });

    it("keeps the note where it was if the drag is cancelled over the trash", async () => {
      const { section, note, store } = await setup();

      press(section, 150, 150);
      moveTo(section, 150, 600);
      fireEvent.pointerCancel(section, { pointerId: 1 });

      expect(note()?.position).toEqual([100, 100]);
      expect(store().trashHighlighted).toBe(false);
    });
  });

  describe("highlighting the trash", () => {
    it("turns on while the dragged note overlaps the trash", async () => {
      const { section, store } = await setup();

      press(section, 150, 150);
      expect(store().trashHighlighted).toBe(false);

      moveTo(section, 150, 600);
      expect(store().trashHighlighted).toBe(true);
    });

    it("turns off when the note is dragged back off the trash", async () => {
      const { section, store } = await setup();

      press(section, 150, 150);
      moveTo(section, 150, 600);
      moveTo(section, 150, 200);

      expect(store().trashHighlighted).toBe(false);
    });

    it("turns off once the note has been dropped in the trash", async () => {
      const { section, store } = await setup();

      press(section, 150, 150);
      moveTo(section, 150, 600);
      release(section, 150, 600);

      expect(store().trashHighlighted).toBe(false);
    });
  });

  describe("resizing", () => {
    it("previews the new size but leaves the store alone until released", async () => {
      const { section, handle, note } = await setup();

      press(handle, 300, 250);
      moveTo(handle, 350, 290);

      expect(section.style.width).toBe("250px");
      expect(section.style.height).toBe("190px");
      expect(note()?.dimensions).toEqual([200, 150]);
    });

    it("saves the new size without moving the note", async () => {
      const { section, handle, note } = await setup();

      press(handle, 300, 250);
      moveTo(handle, 350, 290);
      release(handle, 350, 290);

      expect(note()?.dimensions).toEqual([250, 190]);
      expect(note()?.position).toEqual([100, 100]);
      expect(section.style.left).toBe("100px");
    });

    it("never goes below the minimum size, in the preview or in the store", async () => {
      const { section, handle, note } = await setup();

      press(handle, 300, 250);
      moveTo(handle, 0, 0);

      expect(section.style.width).toBe("50px");
      expect(section.style.height).toBe("50px");

      release(handle, 0, 0);

      expect(note()?.dimensions).toEqual([50, 50]);
    });

    it("neither highlights the trash nor deletes the note when over the trash", async () => {
      const { handle, note, store } = await setup();
      stubRect(handle.parentElement!, 276, 226, 24, 24);

      press(handle, 300, 250);
      moveTo(handle, 50, 700);
      expect(store().trashHighlighted).toBe(false);

      release(handle, 50, 700);
      expect(note()).toBeDefined();
    });

    it("does not start editing when the handle is double-clicked", async () => {
      const { handle, title } = await setup();

      fireEvent.doubleClick(handle);

      expect(title.readOnly).toBe(true);
    });
  });
});
