/**
 * The passwordless join form.
 *
 * Replaces the old register + verify-email + resend screens, which are gone
 * along with the password. What matters here is that the two steps hand off
 * correctly and that a failure never strands someone on a dead screen.
 */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockPush = jest.fn();
const mockRefresh = jest.fn();
const mockSignIn = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => new URLSearchParams(""),
}));

jest.mock("next-auth/react", () => ({
  signIn: (...a: unknown[]) => mockSignIn(...a),
}));

import { JoinForm } from "@/app/auth/join/JoinForm";

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ sent: true, expiresInMinutes: 10 }),
  }) as unknown as typeof fetch;
});

afterAll(() => {
  global.fetch = originalFetch;
});

function fillEmail(value = "ada@example.com") {
  fireEvent.change(screen.getByLabelText(/Email/i), { target: { value } });
}

describe("JoinForm", () => {
  it("asks for details first, and only email is required to proceed", () => {
    render(<JoinForm />);
    expect(screen.getByLabelText(/Your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();

    const submit = screen.getByRole("button", { name: /Send me a code/i });
    expect(submit).toBeDisabled();
    fillEmail();
    expect(submit).toBeEnabled();
  });

  it("moves to the code step once a code has been sent", async () => {
    render(<JoinForm />);
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));

    await waitFor(() => expect(screen.getByLabelText(/Your code/i)).toBeInTheDocument());
    expect(screen.getByText(/ada@example.com/)).toBeInTheDocument();
  });

  it("surfaces a rate-limit message rather than silently failing", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Too many codes requested. Try again in 60 minutes." }),
    }) as unknown as typeof fetch;

    render(<JoinForm />);
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Too many codes requested/i);
    // Still on step one, so the user can act on the message.
    expect(screen.queryByLabelText(/Your code/i)).not.toBeInTheDocument();
  });

  it("strips non-digits from the code field", async () => {
    render(<JoinForm />);
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));
    const codeInput = await screen.findByLabelText(/Your code/i);

    fireEvent.change(codeInput, { target: { value: "12ab34" } });
    expect(codeInput).toHaveValue("1234");
  });

  it("passes the typed details through to the sign-in call", async () => {
    mockSignIn.mockResolvedValue({ error: undefined });
    render(<JoinForm />);

    fireEvent.change(screen.getByLabelText(/Your name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/Phone/i), { target: { value: "0712345678" } });
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));

    const codeInput = await screen.findByLabelText(/Your code/i);
    fireEvent.change(codeInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    await waitFor(() =>
      expect(mockSignIn).toHaveBeenCalledWith(
        "signin-code",
        expect.objectContaining({
          email: "ada@example.com",
          code: "123456",
          name: "Ada",
          phone: "0712345678",
        })
      )
    );
  });

  it("explains a rejected code instead of leaving the form silent", async () => {
    mockSignIn.mockResolvedValue({ error: "CredentialsSignin" });
    render(<JoinForm />);
    fillEmail();
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));

    const codeInput = await screen.findByLabelText(/Your code/i);
    fireEvent.change(codeInput, { target: { value: "000000" } });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/not right, or it has expired/i);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("lets the user go back and correct a mistyped email", async () => {
    render(<JoinForm />);
    fillEmail("typo@example.com");
    fireEvent.click(screen.getByRole("button", { name: /Send me a code/i }));

    await screen.findByLabelText(/Your code/i);
    fireEvent.click(screen.getByRole("button", { name: /Use a different email/i }));

    expect(screen.getByLabelText(/Email/i)).toHaveValue("typo@example.com");
    expect(screen.queryByLabelText(/Your code/i)).not.toBeInTheDocument();
  });
});
