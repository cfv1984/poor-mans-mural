import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from ".";

const MESSAGE = "Minimum screen size is 1024x768";

function Throws(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  it("shows its children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <div>Child</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Child")).toBeTruthy();
    expect(screen.queryByText(MESSAGE)).toBeNull();
  });

  it("replaces its children with just the message when one throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { container } = render(
      <ErrorBoundary>
        <div>Sibling</div>
        <Throws />
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe(MESSAGE);
  });
});
