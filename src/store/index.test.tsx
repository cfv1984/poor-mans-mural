import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { flushLoad, makeNote } from "../test/utils";
import Reducer, { StoreProvider, useStore } from ".";

const NOTES_KEY = "poor-mans-mural:notes";

const stateWith = (...notes: ReturnType<typeof makeNote>[]) => ({
  notes,
  loading: false,
  trashHighlighted: false,
});

describe("Reducer", () => {
  describe("add", () => {
    it("appends the note with a fresh id, above every other note", () => {
      const existing = makeNote({ id: "a", zIndex: 4 });
      const { id, ...payload } = makeNote({ title: "New" });

      const { notes } = Reducer(stateWith(existing), { type: "add", payload });

      expect(notes).toHaveLength(2);
      expect(notes[0]).toBe(existing);
      expect(notes[1]).toMatchObject({ title: "New", zIndex: 5 });
      expect(notes[1]?.id).toEqual(expect.any(String));
      expect(notes[1]?.id).not.toBe(id);
    });

    it("gives every added note its own id", () => {
      const { id: _, ...payload } = makeNote();

      const once = Reducer(stateWith(), { type: "add", payload });
      const twice = Reducer(once, { type: "add", payload });

      expect(twice.notes[0]?.id).not.toBe(twice.notes[1]?.id);
    });
  });

  describe("remove", () => {
    it("removes only the named note", () => {
      const a = makeNote({ id: "a" });
      const b = makeNote({ id: "b" });

      const { notes } = Reducer(stateWith(a, b), { type: "remove", payload: "a" });

      expect(notes).toEqual([b]);
    });

    it("throws when the note does not exist", () => {
      expect(() => Reducer(stateWith(), { type: "remove", payload: "missing" })).toThrow(
        "Unknown action",
      );
    });
  });

  it("edit replaces the matching note and leaves the others alone", () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });
    const edited = makeNote({ id: "a", title: "Edited" });

    const { notes } = Reducer(stateWith(a, b), { type: "edit", payload: edited });

    expect(notes).toEqual([edited, b]);
    expect(notes[1]).toBe(b);
  });

  it("move changes only the position of the matching note", () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });

    const { notes } = Reducer(stateWith(a, b), {
      type: "move",
      payload: { id: "a", pos: [7, 8] },
    });

    expect(notes[0]).toEqual({ ...a, position: [7, 8] });
    expect(notes[1]).toBe(b);
  });

  it("resize changes only the dimensions of the matching note", () => {
    const a = makeNote({ id: "a" });
    const b = makeNote({ id: "b" });

    const { notes } = Reducer(stateWith(a, b), {
      type: "resize",
      payload: { id: "a", size: [70, 80] },
    });

    expect(notes[0]).toEqual({ ...a, dimensions: [70, 80] });
    expect(notes[1]).toBe(b);
  });

  describe("front", () => {
    it("lifts the note above all others without touching them", () => {
      const a = makeNote({ id: "a", zIndex: 1 });
      const b = makeNote({ id: "b", zIndex: 9 });

      const { notes } = Reducer(stateWith(a, b), { type: "front", payload: "a" });

      expect(notes[0]?.zIndex).toBe(10);
      expect(notes[1]).toBe(b);
    });

    it("treats notes without a zIndex as being at the bottom", () => {
      const { zIndex: _, ...a } = makeNote({ id: "a" });

      const { notes } = Reducer(stateWith(a), { type: "front", payload: "a" });

      expect(notes[0]?.zIndex).toBe(1);
    });
  });

  it("showLoading and hideLoading toggle the loading flag", () => {
    const shown = Reducer(stateWith(), { type: "showLoading" });
    expect(shown.loading).toBe(true);

    expect(Reducer(shown, { type: "hideLoading" }).loading).toBe(false);
  });

  it("load replaces every note", () => {
    const loaded = [makeNote({ id: "loaded" })];

    const { notes } = Reducer(stateWith(makeNote({ id: "old" })), {
      type: "load",
      payload: loaded,
    });

    expect(notes).toEqual(loaded);
  });

  describe("highlightTrash", () => {
    it("sets the highlight flag", () => {
      const on = Reducer(stateWith(), { type: "highlightTrash", payload: true });
      expect(on.trashHighlighted).toBe(true);

      expect(Reducer(on, { type: "highlightTrash", payload: false }).trashHighlighted).toBe(false);
    });

    it("keeps the same state when nothing changes, so drag moves do not re-render", () => {
      const state = stateWith();

      expect(Reducer(state, { type: "highlightTrash", payload: false })).toBe(state);
    });
  });

  it("throws on an unknown action", () => {
    const action = { type: "nope" } as unknown as Parameters<typeof Reducer>[1];

    expect(() => Reducer(stateWith(), action)).toThrow("Unknown action");
  });
});

describe("useStore", () => {
  it("throws when used outside a StoreProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useStore())).toThrow(
      "useStore must be used within a StoreProvider",
    );
  });
});

describe("StoreProvider", () => {
  const renderStore = () => renderHook(() => useStore(), { wrapper: StoreProvider });

  it("starts empty, not loading and not highlighted when nothing was saved", async () => {
    const { result } = renderStore();
    await flushLoad();

    expect(result.current[0]).toEqual({ notes: [], loading: false, trashHighlighted: false });
  });

  it("loads the saved notes on mount", async () => {
    const saved = [makeNote({ id: "saved" })];
    localStorage.setItem(NOTES_KEY, JSON.stringify(saved));

    const { result } = renderStore();
    await flushLoad();

    expect(result.current[0].notes).toEqual(saved);
  });

  it("starts empty when the saved data is corrupt", async () => {
    localStorage.setItem(NOTES_KEY, "{not json");

    const { result } = renderStore();
    await flushLoad();

    expect(result.current[0].notes).toEqual([]);
  });

  it("starts empty when the saved data is not a list", async () => {
    localStorage.setItem(NOTES_KEY, JSON.stringify({ id: "not-a-list" }));

    const { result } = renderStore();
    await flushLoad();

    expect(result.current[0].notes).toEqual([]);
  });
});
