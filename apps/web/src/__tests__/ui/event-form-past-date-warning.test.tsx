/**
 * UI tests — EventForm past-date warning
 *
 * Confirms that:
 *  - Picking a past start date shows the amber warning
 *  - Picking a future start date shows no warning / hides it again
 *  - Clearing the start date hides the warning
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: (action: unknown, init: unknown) => [init, action, false],
  };
});

// Must import AFTER jest.mock calls
// eslint-disable-next-line import/first
import { EventForm } from "@/app/partner/events/EventForm";

const WARNING_TEXT =
  /this date is in the past\. you can save as a draft, but publishing will be blocked\./i;

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function renderForm() {
  render(React.createElement(EventForm, { action: jest.fn(), defaults: {} }));
  // Labels are not associated via htmlFor, so query by name attribute instead.
  return document.querySelector<HTMLInputElement>('input[name="startDate"]')!;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EventForm — past-date warning", () => {
  const PAST = toDatetimeLocalValue(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const FUTURE = toDatetimeLocalValue(new Date(Date.now() + 24 * 60 * 60 * 1000));

  it("shows no warning initially", () => {
    renderForm();
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument();
  });

  it("shows the amber warning when a past start date is picked", () => {
    const input = renderForm();
    fireEvent.change(input, { target: { value: PAST } });

    const warning = screen.getByText(WARNING_TEXT);
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveClass("text-amber-600");
  });

  it("does not show the warning when a future start date is picked", () => {
    const input = renderForm();
    fireEvent.change(input, { target: { value: FUTURE } });
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument();
  });

  it("hides the warning when the past date is changed to a future date", () => {
    const input = renderForm();
    fireEvent.change(input, { target: { value: PAST } });
    expect(screen.getByText(WARNING_TEXT)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: FUTURE } });
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument();
  });

  it("hides the warning when the start date is cleared", () => {
    const input = renderForm();
    fireEvent.change(input, { target: { value: PAST } });
    expect(screen.getByText(WARNING_TEXT)).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByText(WARNING_TEXT)).not.toBeInTheDocument();
  });
});
