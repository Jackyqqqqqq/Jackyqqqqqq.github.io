import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { pick, readStoredLocale, useLocale } from "../i18n";

const STORAGE_KEY = "academic-homepage-locale";

function LocaleHarness() {
  const { locale, setLocale } = useLocale();

  return (
    <div>
      <p>{pick({ zh: "中文内容", en: "English content" }, locale)}</p>
      <button type="button" onClick={() => setLocale("en")}>
        English
      </button>
    </div>
  );
}

describe("locale preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("lang");
    document.title = "";
    document.head.querySelector('meta[name="description"]')?.remove();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("uses English when no valid preference has been saved", () => {
    expect(readStoredLocale()).toBe("en");

    render(<LocaleHarness />);

    expect(screen.getByText("English content")).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
  });

  test("restores a saved English preference and updates page metadata", () => {
    localStorage.setItem(STORAGE_KEY, "en");

    render(<LocaleHarness />);

    expect(screen.getByText("English content")).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
    expect(document.title).toContain("Qin Yizhen");
    expect(document.head.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      expect.stringContaining("MSc")
    );
  });

  test("persists an explicit language change", async () => {
    const user = userEvent.setup();
    render(<LocaleHarness />);

    await user.click(screen.getByRole("button", { name: "English" }));

    expect(screen.getByText("English content")).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("en");
  });

  test("falls back to English when browser storage access is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });

    expect(() => render(<LocaleHarness />)).not.toThrow();
    expect(screen.getByText("English content")).toBeVisible();
    expect(document.documentElement.lang).toBe("en");
  });
});
