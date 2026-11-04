import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Application from ".";
import { persist } from "../../api";
import { flushLoad, makeNote, moveTo, press, release, stubRect } from "../../test/utils";

async function renderApp() {
  const view = render(<Application />);
  await flushLoad();
  return { ...view, viewport: view.container.querySelector("main")! };
}

describe("Application", () => {
  describe("below the minimum screen size", () => {
    it("shows only the message when loaded too small", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      stubRect(document.body, 0, 0, 800, 600);
      await persist([makeNote()]);

      const { container } = await renderApp();

      expect(container.textContent).toBe("Minimum screen size is 1024x768");
    });

    it("replaces the board with the message when resized too small", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      await persist([makeNote()]);
      const { container } = await renderApp();
      expect(document.getElementById("note-1")).not.toBeNull();

      stubRect(document.body, 0, 0, 800, 600);
      fireEvent(window, new Event("resize"));

      expect(container.textContent).toBe("Minimum screen size is 1024x768");
      expect(document.getElementById("note-1")).toBeNull();
    });
  });

  it("shows the saved board on startup", async () => {
    await persist([makeNote()]);

    await renderApp();

    expect(document.getElementById("note-1")).not.toBeNull();
  });

  it("shows the saving overlay from the World's Save button until the save is done", async () => {
    await renderApp();
    vi.useFakeTimers({ toFake: ["setTimeout"] });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status", { name: "Saving" })).toBeTruthy();

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.queryByRole("status", { name: "Saving" })).toBeNull();
  });

  it("brings back added notes and not trashed ones after saving and reloading", async () => {
    await persist([makeNote()]);
    const { viewport, unmount } = await renderApp();
    const note = document.getElementById("note-1")!;
    stubRect(note, 100, 100, 200, 150);
    stubRect(document.getElementById("trash")!, 0, 600, 160, 160);

    press(note, 150, 150);
    moveTo(note, 150, 650);
    release(note, 150, 650);

    press(viewport, 700, 300);
    release(viewport, 700, 300);
    fireEvent.click(viewport, { clientX: 700, clientY: 300 });

    vi.useFakeTimers({ toFake: ["setTimeout"] });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await act(() => vi.advanceTimersByTimeAsync(300));
    unmount();

    await renderApp();

    expect(document.getElementById("note-1")).toBeNull();
    const notes = document.querySelectorAll<HTMLElement>("section.notes");
    expect(notes).toHaveLength(1);
    expect(notes[0]?.style.left).toBe("700px");
  });

  it("does not bring back unsaved changes after reloading", async () => {
    await persist([makeNote()]);
    const { viewport, unmount } = await renderApp();

    press(viewport, 700, 300);
    release(viewport, 700, 300);
    fireEvent.click(viewport, { clientX: 700, clientY: 300 });
    expect(document.querySelectorAll("section.notes")).toHaveLength(2);
    unmount();

    await renderApp();

    expect(document.querySelectorAll("section.notes")).toHaveLength(1);
  });
});
