import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingIcon from ".";
import { renderWithStore } from "../../test/utils";

describe("LoadingIcon", () => {
  it("only announces saving while the store is loading", async () => {
    const { dispatch } = await renderWithStore(<LoadingIcon />);

    expect(screen.queryByRole("status", { name: "Saving" })).toBeNull();

    dispatch({ type: "showLoading" });
    expect(screen.getByRole("status", { name: "Saving" })).toBeTruthy();

    dispatch({ type: "hideLoading" });
    expect(screen.queryByRole("status", { name: "Saving" })).toBeNull();
  });
});
