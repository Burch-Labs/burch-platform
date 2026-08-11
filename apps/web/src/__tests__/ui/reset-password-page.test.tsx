/**
 * Component tests for the reset-password page
 *
 * Covers:
 *  - Shows "Link already used" card when API returns "already been used"
 *  - Shows "Link expired" card with forgot-password link when API returns "expired"
 *  - Shows password-updated success card on a valid reset
 *  - Shows generic inline error for other API failures
 *  - Shows "Invalid link" card when the token query param is missing
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

/** Configurable token value — override per-test via setMockToken(). */
let mockTokenValue: string | null = "test-token";

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === "token" ? mockTokenValue : null),
  }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react");
  function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return React.createElement("a", { href }, children);
  }
  MockLink.displayName = "MockLink";
  return MockLink;
});

jest.mock("@/components/auth/AuthCard", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const React = require("react");
  function MockAuthCard({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle?: string;
    children?: React.ReactNode;
  }) {
    return React.createElement(
      "div",
      null,
      React.createElement("h1", null, title),
      subtitle ? React.createElement("p", null, subtitle) : null,
      children
    );
  }
  MockAuthCard.displayName = "MockAuthCard";
  return { AuthCard: MockAuthCard };
});

// eslint-disable-next-line import/first
import ResetPasswordPage from "@/app/auth/reset-password/page";

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockFetchResponse(status: number, body: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) as jest.Mock;
}

async function fillAndSubmit() {
  fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
    target: { value: "newpassword1" },
  });
  fireEvent.change(screen.getByPlaceholderText("Re-enter password"), {
    target: { value: "newpassword1" },
  });
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /update password/i }));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenValue = "test-token";
  });

  it('shows "Link already used" card when API returns "already been used"', async () => {
    mockFetchResponse(400, {
      error: "Reset link is invalid or has already been used.",
    });

    render(React.createElement(ResetPasswordPage));
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /link already used/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/can only be used once/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new password reset/i })
    ).toHaveAttribute("href", "/auth/forgot-password");
  });

  it('shows "Link expired" card with forgot-password link when API returns "expired"', async () => {
    mockFetchResponse(400, {
      error: "Reset link has expired. Please request a new one.",
    });

    render(React.createElement(ResetPasswordPage));
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /link expired/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/expire after a short time/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new reset link/i })
    ).toHaveAttribute("href", "/auth/forgot-password");
  });

  it("shows password-updated success card on a valid reset", async () => {
    mockFetchResponse(200, { message: "Password updated successfully." });

    render(React.createElement(ResetPasswordPage));
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /password updated/i })
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/redirecting/i)).toBeInTheDocument();
  });

  it("shows inline error for other API failures (not used/expired)", async () => {
    mockFetchResponse(400, { error: "Password must be at least 8 characters" });

    render(React.createElement(ResetPasswordPage));
    await fillAndSubmit();

    await waitFor(() => {
      expect(
        screen.getByText(/password must be at least 8 characters/i)
      ).toBeInTheDocument();
    });

    // Should NOT have switched to a link-error card
    expect(
      screen.queryByRole("heading", { name: /link already used/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /link expired/i })
    ).not.toBeInTheDocument();
  });

  it('shows "Invalid link" card when the token query param is absent', () => {
    mockTokenValue = null;

    render(React.createElement(ResetPasswordPage));

    expect(
      screen.getByRole("heading", { name: /invalid link/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /request a new reset link/i })
    ).toHaveAttribute("href", "/auth/forgot-password");
  });
});

export {};
