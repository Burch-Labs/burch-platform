/**
 * Component tests for SaveSearchButton — saved-search cap error
 *
 * Covers:
 *  - The 422 cap error message from the API is rendered inside the dialog
 *  - A successful save does not show an error
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockParams: Record<string, string | null> = {};

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockParams[key] ?? null,
  }),
}));

// Static import must come after jest.mock() calls.
// eslint-disable-next-line import/first
import { SaveSearchButton } from "@/components/events/SaveSearchButton";

const CAP_MESSAGE =
  "You have reached the maximum of 20 saved searches. Delete one to save a new search.";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SaveSearchButton — cap error rendering", () => {
  beforeEach(() => {
    mockParams = { q: "jazz" }; // a filter must be active for the button to render
    jest.restoreAllMocks();
  });

  async function openDialogAndSave() {
    render(React.createElement(SaveSearchButton, { isLoggedIn: true }));
    fireEvent.click(screen.getByRole("button", { name: /save this search/i }));
    // Dialog is open; click the Save button inside it
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
  }

  it("renders the cap error message in the dialog when the API returns 422", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ error: CAP_MESSAGE }),
    }) as unknown as typeof fetch;

    await openDialogAndSave();

    expect(await screen.findByText(CAP_MESSAGE)).toBeInTheDocument();
    // Dialog stays open (no success state)
    expect(screen.queryByText(/search saved!/i)).not.toBeInTheDocument();
  });

  it("shows the success state (no error) when the API succeeds", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ search: { id: "s-1" } }),
    }) as unknown as typeof fetch;

    await openDialogAndSave();

    expect(await screen.findByText(/search saved!/i)).toBeInTheDocument();
    expect(screen.queryByText(CAP_MESSAGE)).not.toBeInTheDocument();
  });
});
