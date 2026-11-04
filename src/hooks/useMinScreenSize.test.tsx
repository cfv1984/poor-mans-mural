import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "../components/ErrorBoundary";
import { stubRect } from "../test/utils";
import { useMinScreenSize } from "./useMinScreenSize";

const MESSAGE = "Minimum screen size is 1024x768";

function Harness() {
  useMinScreenSize();
  return <div>Big enough</div>;
}

const renderHarness = () =>
  render(
    <ErrorBoundary>
      <Harness />
    </ErrorBoundary>,
  );

const resizeTo = (width: number, height: number) => {
  stubRect(document.body, 0, 0, width, height);
  fireEvent(window, new Event("resize"));
};

describe("useMinScreenSize", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("allows a body of exactly the minimum size", () => {
    stubRect(document.body, 0, 0, 1024, 768);

    renderHarness();

    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it.each([
    { size: "too narrow", width: 1023, height: 768 },
    { size: "too short", width: 1024, height: 767 },
    { size: "too narrow and too short", width: 800, height: 600 },
  ])("throws on load when the body is $size", ({ width, height }) => {
    stubRect(document.body, 0, 0, width, height);

    renderHarness();

    expect(screen.getByText(MESSAGE)).toBeTruthy();
  });

  it.each([
    { size: "too narrow", width: 1023, height: 768 },
    { size: "too short", width: 1024, height: 767 },
  ])("throws when a resize makes the body $size", ({ width, height }) => {
    renderHarness();
    expect(screen.queryByText(MESSAGE)).toBeNull();

    resizeTo(width, height);

    expect(screen.getByText(MESSAGE)).toBeTruthy();
  });

  it("keeps rendering through a resize that stays above the minimum", () => {
    renderHarness();

    resizeTo(1500, 900);

    expect(screen.getByText("Big enough")).toBeTruthy();
  });

  it("stops measuring on resize after unmounting", () => {
    const { unmount } = renderHarness();
    unmount();
    const measure = vi.mocked(document.body.getBoundingClientRect);
    measure.mockClear();

    fireEvent(window, new Event("resize"));

    expect(measure).not.toHaveBeenCalled();
  });
});
