import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { stubRect } from "../test/utils";
import type { Point } from "./types";
import { useWorldClick } from "./useWorldClick";

type HarnessProps = { cam: Point; dragged: boolean; onWorldClick: (p: Point) => void };

function Harness({ cam, dragged, onWorldClick }: HarnessProps) {
  const ref = useRef<HTMLElement>(null);
  const onClick = useWorldClick(ref, cam, { current: dragged }, onWorldClick);
  return (
    <main ref={ref} data-testid="viewport" onClick={onClick}>
      <div data-testid="child" />
    </main>
  );
}

function setup({ cam = { x: 5, y: 7 }, dragged = false } = {}) {
  const onWorldClick = vi.fn<(p: Point) => void>();
  const view = render(<Harness cam={cam} dragged={dragged} onWorldClick={onWorldClick} />);
  const viewport = screen.getByTestId("viewport");
  stubRect(viewport, 30, 40, 800, 600);
  return { ...view, onWorldClick, viewport, child: screen.getByTestId("child") };
}

describe("useWorldClick", () => {
  it("converts the click to world coordinates, allowing for viewport and camera", () => {
    const { viewport, onWorldClick } = setup();

    fireEvent.click(viewport, { clientX: 100, clientY: 200 });

    expect(onWorldClick).toHaveBeenCalledExactlyOnceWith({ x: 65, y: 153 });
  });

  it("uses the latest camera position", () => {
    const { viewport, onWorldClick, rerender } = setup();

    rerender(<Harness cam={{ x: -50, y: 0 }} dragged={false} onWorldClick={onWorldClick} />);
    fireEvent.click(viewport, { clientX: 100, clientY: 200 });

    expect(onWorldClick).toHaveBeenCalledExactlyOnceWith({ x: 120, y: 160 });
  });

  it("ignores the click that ends a drag", () => {
    const { viewport, onWorldClick } = setup({ dragged: true });

    fireEvent.click(viewport, { clientX: 100, clientY: 200 });

    expect(onWorldClick).not.toHaveBeenCalled();
  });

  it("ignores clicks on anything inside the viewport", () => {
    const { child, onWorldClick } = setup();

    fireEvent.click(child, { clientX: 100, clientY: 200 });

    expect(onWorldClick).not.toHaveBeenCalled();
  });
});
