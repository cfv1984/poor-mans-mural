import { useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Point } from "./types";

export function useNoteDrag(
  origin: [number, number],
  onDrop: (value: [number, number], rect: DOMRect) => void,
  onDrag?: (rect: DOMRect | null) => void,
) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  function onPointerDown(e: ReactPointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    const el = e.currentTarget;
    const { pointerId } = e;
    el.setPointerCapture(pointerId);

    const start = { x: e.clientX, y: e.clientY };
    const startRect = el.getBoundingClientRect();
    let delta = { x: 0, y: 0 };
    const currentRect = () => new DOMRect(startRect.x + delta.x, startRect.y + delta.y, startRect.width, startRect.height);
    const onMove = (m: PointerEvent) => {
      if (m.pointerId !== pointerId) return;
      // Chrome can drop capture and send a buttonless move just before the real pointerup.
      if (!m.buttons) return finish();
      delta = { x: m.clientX - start.x, y: m.clientY - start.y };
      setOffset(delta);
      onDrag?.(currentRect());
    };
    const stop = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      setOffset({ x: 0, y: 0 });
      onDrag?.(null);
    };
    const finish = () => {
      stop();
      if (delta.x || delta.y) onDrop([origin[0] + delta.x, origin[1] + delta.y], currentRect());
    };
    const onUp = (u: PointerEvent) => {
      if (u.pointerId === pointerId) finish();
    };
    const onCancel = (c: PointerEvent) => {
      if (c.pointerId === pointerId) stop();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
  }

  return { offset, onPointerDown };
}
