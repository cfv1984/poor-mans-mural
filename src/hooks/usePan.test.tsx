import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { moveTo, press, release } from "../test/utils";
import { usePan } from "./usePan";

function setup() {
  let dragged!: { readonly current: boolean };
  function Harness() {
    const ref = useRef<HTMLElement>(null);
    const pan = usePan(ref);
    dragged = pan.dragged;
    return (
      <main ref={ref} data-testid="viewport" data-cam={`${pan.cam.x},${pan.cam.y}`}>
        <div data-testid="child" />
        <textarea data-testid="textarea" />
      </main>
    );
  }
  const view = render(<Harness />);
  return {
    ...view,
    viewport: screen.getByTestId("viewport"),
    child: screen.getByTestId("child"),
    textarea: screen.getByTestId("textarea"),
    dragged: () => dragged.current,
  };
}

function setHeights(el: HTMLElement, scrollHeight: number, clientHeight: number) {
  Object.defineProperty(el, "scrollHeight", { value: scrollHeight });
  Object.defineProperty(el, "clientHeight", { value: clientHeight });
}

describe("usePan", () => {
  describe("wheel", () => {
    it("moves the camera against the wheel delta and accumulates", () => {
      const { viewport } = setup();

      fireEvent.wheel(viewport, { deltaX: 10, deltaY: 5 });
      fireEvent.wheel(viewport, { deltaX: 1, deltaY: -20 });

      expect(viewport.dataset.cam).toBe("-11,15");
    });

    it("stops the browser from scrolling the page", () => {
      const { viewport } = setup();

      const notPrevented = fireEvent.wheel(viewport, { deltaX: 10, deltaY: 5 });

      expect(notPrevented).toBe(false);
    });

    it("leaves a textarea with overflowing text to scroll itself", () => {
      const { viewport, textarea } = setup();
      setHeights(textarea, 500, 100);

      const notPrevented = fireEvent.wheel(textarea, { deltaX: 10, deltaY: 5 });

      expect(notPrevented).toBe(true);
      expect(viewport.dataset.cam).toBe("0,0");
    });

    it("pans when the wheel is over a textarea with nothing to scroll", () => {
      const { viewport, textarea } = setup();
      setHeights(textarea, 100, 100);

      fireEvent.wheel(textarea, { deltaX: 10, deltaY: 5 });

      expect(viewport.dataset.cam).toBe("-10,-5");
    });

    it("stops handling the wheel after unmounting", () => {
      const { viewport, unmount } = setup();

      unmount();

      expect(fireEvent.wheel(viewport, { deltaX: 10 })).toBe(true);
    });
  });

  describe("pointer drag", () => {
    it("moves the camera with the pointer when pressed on the viewport itself", () => {
      const { viewport } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 110, 120);
      moveTo(viewport, 105, 130);

      expect(viewport.dataset.cam).toBe("5,30");
    });

    it("captures the pointer on the viewport", () => {
      const capture = vi.spyOn(Element.prototype, "setPointerCapture");
      const { viewport } = setup();

      press(viewport, 0, 0, { pointerId: 7 });

      expect(capture).toHaveBeenCalledWith(7);
      expect(capture.mock.contexts[0]).toBe(viewport);
    });

    it("does not pan when the press starts on a child", () => {
      const capture = vi.spyOn(Element.prototype, "setPointerCapture");
      const { viewport, child } = setup();

      press(child, 100, 100);
      moveTo(viewport, 150, 150);

      expect(viewport.dataset.cam).toBe("0,0");
      expect(capture).not.toHaveBeenCalled();
    });

    it("stops panning on release", () => {
      const { viewport } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 110, 110);
      release(viewport, 110, 110);
      moveTo(viewport, 300, 300, { buttons: 0 });

      expect(viewport.dataset.cam).toBe("10,10");
    });

    it("stops panning when the pointer is cancelled", () => {
      const { viewport } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 110, 110);
      fireEvent.pointerCancel(viewport, { pointerId: 1 });
      moveTo(viewport, 300, 300);

      expect(viewport.dataset.cam).toBe("10,10");
    });
  });

  describe("dragged", () => {
    it("stays false while the pointer is within the drag threshold", () => {
      const { viewport, dragged } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 104, 100);

      expect(dragged()).toBe(false);
    });

    it("turns true past the threshold, even if the pointer comes back", () => {
      const { viewport, dragged } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 105, 100);
      moveTo(viewport, 100, 100);

      expect(dragged()).toBe(true);
    });

    it("resets on the next press of the viewport", () => {
      const { viewport, dragged } = setup();

      press(viewport, 100, 100);
      moveTo(viewport, 200, 200);
      release(viewport, 200, 200);
      press(viewport, 200, 200);

      expect(dragged()).toBe(false);
    });

    it("turns true when a press starts on a child, so its click is not a world click", () => {
      const { child, dragged } = setup();

      press(child, 100, 100);

      expect(dragged()).toBe(true);
    });
  });
});
