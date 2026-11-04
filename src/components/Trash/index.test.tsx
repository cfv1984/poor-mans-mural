import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Trash from ".";
import { renderWithStore } from "../../test/utils";
import { highlighted } from "./index.module.css";

describe("Trash", () => {
  it("is only highlighted while the store says so", async () => {
    const { dispatch } = await renderWithStore(<Trash />);
    const trash = screen.getByLabelText("Trash");

    expect(trash.classList.contains(highlighted)).toBe(false);

    dispatch({ type: "highlightTrash", payload: true });
    expect(trash.classList.contains(highlighted)).toBe(true);

    dispatch({ type: "highlightTrash", payload: false });
    expect(trash.classList.contains(highlighted)).toBe(false);
  });
});
