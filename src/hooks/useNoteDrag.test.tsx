import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { hover, moveTo, press, release, stubRect } from "../test/utils";
import { useNoteDrag } from "./useNoteDrag";

type OnDrop = (value: [number, number], rect: DOMRect) => void;
type OnDrag = (rect: DOMRect | null) => void;

function Harness({ onDrop, onDrag }: { onDrop: OnDrop; onDrag: OnDrag }) {
  const { offset, onPointerDown } = useNoteDrag([10, 20], onDrop, onDrag);
  return (
    <>
      <div
        data-testid="target"
        data-offset={`${offset.x},${offset.y}`}
        onPointerDown={onPointerDown}
      />
      <div data-testid="elsewhere" />
    </>
  );
}

function setup() {
  const onDrop = vi.fn<OnDrop>();
  const onDrag = vi.fn<OnDrag>();
  render(<Harness onDrop={onDrop} onDrag={onDrag} />);
  const target = screen.getByTestId("target");
  stubRect(target, 100, 200, 50, 60);
  return { onDrop, onDrag, target, elsewhere: screen.getByTestId("elsewhere") };
}

describe("useNoteDrag", () => {
  it("captures the pointer on press", () => {
    const capture = vi.spyOn(Element.prototype, "setPointerCapture");
    const { target } = setup();

    press(target, 0, 0, { pointerId: 7 });

    expect(capture).toHaveBeenCalledWith(7);
    expect(capture.mock.contexts[0]).toBe(target);
  });

  it("ignores presses from anything but the primary button", () => {
    const capture = vi.spyOn(Element.prototype, "setPointerCapture");
    const { target, onDrop } = setup();

    press(target, 0, 0, { button: 2, buttons: 2 });
    moveTo(target, 30, 40, { buttons: 2 });
    release(target, 30, 40, { button: 2 });

    expect(capture).not.toHaveBeenCalled();
    expect(target.dataset.offset).toBe("0,0");
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("exposes how far the pointer has travelled as an offset", () => {
    const { target } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);

    expect(target.dataset.offset).toBe("30,40");
  });

  it("drops at the origin plus the pointer's travel", () => {
    const { target, onDrop } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);
    release(target, 35, 45);

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop.mock.calls[0]?.[0]).toEqual([40, 60]);
  });

  it("reports where the element ended up on screen with the drop", () => {
    const { target, onDrop } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);
    release(target, 35, 45);

    const rect = onDrop.mock.calls[0]?.[1];
    expect([rect?.x, rect?.y, rect?.width, rect?.height]).toEqual([130, 240, 50, 60]);
  });

  it("clears the offset once dropped", () => {
    const { target } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);
    release(target, 35, 45);

    expect(target.dataset.offset).toBe("0,0");
  });

  it("does not drop when released without moving", () => {
    const { target, onDrop } = setup();

    press(target, 5, 5);
    release(target, 5, 5);

    expect(onDrop).not.toHaveBeenCalled();
  });

  it("reports the moving rect during the drag, then null when it ends", () => {
    const { target, onDrag } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);

    const rect = onDrag.mock.lastCall?.[0];
    expect([rect?.x, rect?.y]).toEqual([130, 240]);

    release(target, 35, 45);

    expect(onDrag.mock.lastCall?.[0]).toBeNull();
  });

  it("still drops when the release lands on another element", () => {
    const { target, elsewhere, onDrop } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);
    release(elsewhere, 35, 45);

    expect(onDrop.mock.calls[0]?.[0]).toEqual([40, 60]);
    expect(target.dataset.offset).toBe("0,0");
  });

  describe("when the browser sends a buttonless move before the release", () => {
    it("treats it as the drop, at the last position with the button held", () => {
      const { target, onDrop } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      hover(target, 500, 500);

      expect(onDrop).toHaveBeenCalledTimes(1);
      expect(onDrop.mock.calls[0]?.[0]).toEqual([40, 60]);
    });

    it("does not drop a second time on the real release", () => {
      const { target, elsewhere, onDrop } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      hover(target, 35, 45);
      release(elsewhere, 35, 45);

      expect(onDrop).toHaveBeenCalledTimes(1);
    });

    it("stops following the pointer afterwards", () => {
      const { target, onDrag } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      hover(target, 35, 45);
      onDrag.mockClear();
      hover(target, 300, 300);
      moveTo(target, 400, 400);

      expect(target.dataset.offset).toBe("0,0");
      expect(onDrag).not.toHaveBeenCalled();
    });
  });

  it("abandons the drag without dropping when the pointer is cancelled", () => {
    const { target, onDrop, onDrag } = setup();

    press(target, 5, 5);
    moveTo(target, 35, 45);
    fireEvent.pointerCancel(target, { pointerId: 1 });

    expect(onDrop).not.toHaveBeenCalled();
    expect(target.dataset.offset).toBe("0,0");
    expect(onDrag.mock.lastCall?.[0]).toBeNull();
  });

  describe("with another pointer active during the drag", () => {
    it("does not follow its moves", () => {
      const { target, onDrop } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      moveTo(target, 900, 900, { pointerId: 2 });
      expect(target.dataset.offset).toBe("30,40");

      release(target, 35, 45);
      expect(onDrop.mock.calls[0]?.[0]).toEqual([40, 60]);
    });

    it("does not treat its buttonless move as the drop", () => {
      const { target, onDrop } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      moveTo(target, 900, 900, { pointerId: 2, buttons: 0 });

      expect(onDrop).not.toHaveBeenCalled();
      expect(target.dataset.offset).toBe("30,40");
    });

    it("does not end the drag on its release or cancel", () => {
      const { target, onDrop } = setup();

      press(target, 5, 5);
      moveTo(target, 35, 45);
      fireEvent.pointerCancel(target, { pointerId: 2 });
      release(target, 900, 900, { pointerId: 2 });

      expect(target.dataset.offset).toBe("30,40");
      expect(onDrop).not.toHaveBeenCalled();
    });
  });
});
