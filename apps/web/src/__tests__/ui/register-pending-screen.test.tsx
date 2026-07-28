/**
 * Component tests for the pending-verification screen in RegisterPage
 *
 * Covers:
 *  - Shows error banner when register responds with emailFailed: true
 *  - Shows normal inbox screen when email sent successfully
 *  - Shows countdown on the resend button when resend-verification returns 429
 *  - Shows success message after a successful resend
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Factories are hoisted before imports, so use require() inside them.

jest.mock("next/navigation", () => ({
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

jest.mock("@/components/auth/GoogleButton", () => ({
  GoogleButton: () => null,
}));

// Static import — must come AFTER jest.mock() calls but before tests.
// eslint-disable-next-line import/first
import RegisterPage from "@/app/auth/register/page";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Render the page, fill the form, and submit with the currently-set fetch mock. */
async function renderAndSubmit() {
  render(React.createElement(RegisterPage));

  fireEvent.change(screen.getByPlaceholderText("Your name"), {
    target: { value: "Test User" },
  });
  fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
    target: { value: "test@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Min. 8 characters"), {
    target: { value: "password123" },
  });

  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /create account/i }));
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RegisterPage — pending-verification screen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the error banner when register returns emailFailed: true", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ autoVerified: false, emailFailed: true }),
    }) as jest.Mock;

    await renderAndSubmit();

    expect(screen.getByRole("heading", { name: /delivery issue/i })).toBeInTheDocument();
    expect(screen.getByText(/verification email failed to send/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeEnabled();
  });

  it("shows the normal inbox screen when email was sent successfully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ autoVerified: false }),
    }) as jest.Mock;

    await renderAndSubmit();

    expect(screen.getByRole("heading", { name: /check your inbox/i })).toBeInTheDocument();
    expect(screen.queryByText(/verification email failed/i)).not.toBeInTheDocument();
  });

  it("shows countdown on resend button when resend-verification returns 429", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ autoVerified: false, emailFailed: true }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({
          error: "Please wait 45 seconds before requesting another email.",
          retryAfter: 45,
        }),
      }) as jest.Mock;

    await renderAndSubmit();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));
    });

    // Button should display the countdown and be disabled
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /resend in \d+s/i })).toBeDisabled();
    });

    // After 10 seconds the counter decreases
    act(() => {
      jest.advanceTimersByTime(10_000);
    });

    const btn = screen.getByRole("button", { name: /resend in \d+s/i });
    const match = btn.textContent?.match(/(\d+)s/);
    const remaining = match ? parseInt(match[1], 10) : null;
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeLessThanOrEqual(36);

    // After the full cooldown the button re-enables
    act(() => {
      jest.advanceTimersByTime(50_000);
    });
    expect(screen.getByRole("button", { name: /resend verification email/i })).toBeEnabled();
  });

  it("shows success message and clears error banner after a successful resend", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ autoVerified: false, emailFailed: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: "Verification email sent." }),
      }) as jest.Mock;

    await renderAndSubmit();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /resend verification email/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });

    // Error banner is cleared after a successful resend
    expect(screen.queryByText(/verification email failed to send/i)).not.toBeInTheDocument();
  });
});
