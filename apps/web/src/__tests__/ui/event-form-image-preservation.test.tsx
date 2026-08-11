/**
 * UI tests — EventForm image URL preservation during edit
 *
 * Confirms that:
 *  - Opening an existing event with a photo pre-populates the preview
 *  - Saving without touching the photo keeps the existing imageUrl in the hidden field
 *  - A failed upload restores the original URL in the hidden field
 *  - Removing the photo clears the hidden field
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useActionState: (action: unknown, init: unknown) => [init, action, false],
  };
});

// ── Helpers ───────────────────────────────────────────────────────────────────

// Must import AFTER jest.mock calls
// eslint-disable-next-line import/first
import { EventForm } from "@/app/partner/events/EventForm";

const EXISTING_URL = "https://example.com/photo.jpg";

function getHiddenImageUrl(): string {
  const el = document.querySelector<HTMLInputElement>('input[name="imageUrl"]');
  return el?.value ?? "";
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("EventForm — image URL preservation on edit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset URL.createObjectURL stub
    global.URL.createObjectURL = jest.fn(() => "blob:preview-url");
    global.URL.revokeObjectURL = jest.fn();
  });

  it("pre-populates the image preview when defaults.imageUrl is set", () => {
    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    const preview = screen.getByAltText("Event photo preview") as HTMLImageElement;
    expect(preview).toBeInTheDocument();
    expect(preview.src).toBe(EXISTING_URL);
  });

  it("hidden imageUrl field carries the existing URL before any interaction", () => {
    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    expect(getHiddenImageUrl()).toBe(EXISTING_URL);
  });

  it("FormData submitted to the action contains the existing imageUrl when the photo is not changed", async () => {
    const action = jest.fn().mockResolvedValue({});
    render(
      React.createElement(EventForm, {
        action,
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    // Capture FormData at submit time by reading directly from the form element,
    // which is exactly what the browser sends to the server action.
    const form = document.querySelector("form")!;
    const formData = new FormData(form);

    expect(formData.get("imageUrl")).toBe(EXISTING_URL);
  });

  it("hidden imageUrl field updates to the new URL after a successful upload", async () => {
    const NEW_URL = "https://cdn.example.com/new-photo.jpg";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: NEW_URL }),
    }) as jest.Mock;

    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["img"], "photo.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(getHiddenImageUrl()).toBe(NEW_URL);
    });
  });

  it("restores the original URL in the hidden field when an upload fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Upload failed" }),
    }) as jest.Mock;

    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]')!;
    const file = new File(["img"], "bad.jpg", { type: "image/jpeg" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    // Hidden field must fall back to the original URL
    expect(getHiddenImageUrl()).toBe(EXISTING_URL);
  });

  it("clears the hidden imageUrl field when the partner removes the photo", () => {
    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: { imageUrl: EXISTING_URL },
      })
    );

    fireEvent.click(screen.getByTitle("Remove photo"));

    expect(getHiddenImageUrl()).toBe("");
    expect(screen.queryByAltText("Event photo preview")).not.toBeInTheDocument();
  });

  it("hidden field is empty when no defaults.imageUrl is provided", () => {
    render(
      React.createElement(EventForm, {
        action: jest.fn(),
        defaults: {},
      })
    );

    expect(getHiddenImageUrl()).toBe("");
    expect(screen.queryByAltText("Event photo preview")).not.toBeInTheDocument();
  });
});
