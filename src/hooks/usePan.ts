import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import type { Point } from "./types";

const DRAG_THRESHOLD = 4;

export function usePan(viewportRef: RefObject<HTMLElement | null>) {
  const [cam, setCam] = useState<Point>({ x: 0, y: 0 });
  const dragged = useRef(false);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const { target } = e;
      if (target instanceof HTMLTextAreaElement && target.scrollHeight > target.clientHeight)
        return;
      e.preventDefault();
      setCam((c) => ({ x: c.x - e.deltaX, y: c.y - e.deltaY }));
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.target !== el) {
        // A press that starts on a note or control must not count as a click on the world.
        dragged.current = true;
        return;
      }
      dragged.current = false;
      el.setPointerCapture(e.pointerId);

      const start = { x: e.clientX, y: e.clientY };
      let last = start;
      const onMove = (m: PointerEvent) => {
        const dx = m.clientX - last.x;
        const dy = m.clientY - last.y;
        last = { x: m.clientX, y: m.clientY };
        if (Math.hypot(m.clientX - start.x, m.clientY - start.y) > DRAG_THRESHOLD)
          dragged.current = true;
        setCam((c) => ({ x: c.x + dx, y: c.y + dy }));
      };
      const onUp = () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerup", onUp);
        el.removeEventListener("pointercancel", onUp);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerup", onUp);
      el.addEventListener("pointercancel", onUp);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
    };
  }, [viewportRef]);

  return { cam, dragged };
}
