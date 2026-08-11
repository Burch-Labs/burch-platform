/**
 * Component tests for ShareLinkButton on the events page
 *
 * Covers:
 *  - Button is hidden when no filters are active
 *  - Button appears when any single filter is active (q, category, city, dateFrom, dateTo)
 *  - Button is hidden again when all filters are cleared
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

let mockParams: Record<string, string | null> = {};

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockParams[key] ?? null,
  }),
}));

// Static import must come after jest.mock() calls.
// eslint-disable-next-line import/first
import { ShareLinkButton } from "@/components/events/ShareLinkButton";

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderButton() {
  return render(React.createElement(ShareLinkButton));
}

function setParams(params: Record<string, string | null>) {
  mockParams = params;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ShareLinkButton — filter visibility", () => {
  beforeEach(() => {
    mockParams = {};
  });

  it("does NOT render the button when no filters are active", () => {
    setParams({});
    renderButton();
    expect(screen.queryByRole("button", { name: /copy link/i })).not.toBeInTheDocument();
  });

  it("renders the button when the 'q' (search) filter is active", () => {
    setParams({ q: "jazz festival" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("renders the button when the 'category' filter is active", () => {
    setParams({ category: "MUSIC" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("renders the button when the 'city' filter is active", () => {
    setParams({ city: "Lagos" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("renders the button when the 'dateFrom' filter is active", () => {
    setParams({ dateFrom: "2026-09-01" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("renders the button when the 'dateTo' filter is active", () => {
    setParams({ dateTo: "2026-09-30" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });

  it("hides the button again when all filters are cleared (params reset to empty)", () => {
    // First render with a filter active
    setParams({ q: "jazz festival" });
    const { unmount } = renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    unmount();

    // Re-render with no filters
    setParams({});
    renderButton();
    expect(screen.queryByRole("button", { name: /copy link/i })).not.toBeInTheDocument();
  });

  it("renders the button when multiple filters are active simultaneously", () => {
    setParams({ q: "festival", city: "Accra", category: "ARTS" });
    renderButton();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
  });
});
