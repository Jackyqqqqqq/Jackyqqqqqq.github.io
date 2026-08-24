import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import SiteHeader from "../components/SiteHeader";
import type { Locale } from "../content.types";

function HeaderHarness() {
  const [locale, setLocale] = useState<Locale>("zh");

  return (
    <SiteHeader
      locale={locale}
      onLocaleChange={setLocale}
      activeSection="about"
    />
  );
}

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.appearance;
  delete document.documentElement.dataset.accent;
  document.documentElement.style.removeProperty("--font-scale");
  vi.restoreAllMocks();
});

test("renders semantic links for every homepage section", () => {
  render(<HeaderHarness />);

  expect(screen.getByRole("navigation", { name: "Primary" })).toBeVisible();
  expect(screen.getByRole("link", { name: "关于我" })).toHaveAttribute("href", "#about");
  expect(screen.getByRole("link", { name: "研究兴趣" })).toHaveAttribute("href", "#research");
  expect(screen.getByRole("link", { name: "项目经历" })).toHaveAttribute("href", "#projects");
  expect(screen.getByRole("link", { name: "教育经历" })).toHaveAttribute("href", "#education");
  expect(screen.getByRole("link", { name: "技能" })).toHaveAttribute("href", "#skills");
  expect(screen.getByRole("link", { name: "联系方式" })).toHaveAttribute("href", "#contact");
  expect(screen.getByRole("link", { name: "关于我" })).toHaveAttribute("aria-current", "location");
  expect(screen.getByRole("link", { name: "秦翊祯" })).toHaveTextContent("QYZ");
});

test("exposes language choice and mobile navigation state", async () => {
  const user = userEvent.setup();
  render(<HeaderHarness />);

  const chinese = screen.getByRole("button", { name: "中文" });
  const english = screen.getByRole("button", { name: "English" });
  const menu = screen.getByRole("button", { name: "菜单" });

  expect(chinese).toHaveAttribute("aria-pressed", "true");
  expect(english).toHaveAttribute("aria-pressed", "false");
  expect(menu).toHaveAttribute("aria-controls", "primary-navigation");
  expect(menu).toHaveAttribute("aria-expanded", "false");

  await user.click(english);
  expect(english).toHaveAttribute("aria-pressed", "true");

  await user.click(screen.getByRole("button", { name: "Menu" }));
  expect(screen.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "true");
});

test("opens display settings and persists appearance choices", async () => {
  const user = userEvent.setup();
  render(<HeaderHarness />);

  const trigger = screen.getByRole("button", { name: "显示设置" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");

  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("dialog", { name: "显示设置" })).toBeVisible();

  await user.click(screen.getByRole("button", { name: "羊皮纸" }));
  expect(document.documentElement).toHaveAttribute("data-appearance", "soft");

  await user.click(screen.getByRole("button", { name: "墨绿" }));
  expect(document.documentElement).toHaveAttribute("data-accent", "forest");

  const fontSize = screen.getByRole("slider", { name: "字体大小" });
  fontSize.focus();
  await user.keyboard("{ArrowRight}{ArrowRight}");
  expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.1");

  expect(JSON.parse(localStorage.getItem("academic-homepage-display") ?? "null")).toEqual({
    appearance: "soft",
    accent: "forest",
    fontScale: 110
  });

  await user.keyboard("{Escape}");
  expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("restores display preferences and resets them to the academic defaults", async () => {
  localStorage.setItem(
    "academic-homepage-display",
    JSON.stringify({ appearance: "dark", accent: "burgundy", fontScale: 115 })
  );
  const user = userEvent.setup();

  render(<HeaderHarness />);

  expect(document.documentElement).toHaveAttribute("data-appearance", "dark");
  expect(document.documentElement).toHaveAttribute("data-accent", "burgundy");
  expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1.15");

  await user.click(screen.getByRole("button", { name: "显示设置" }));
  await user.click(screen.getByRole("button", { name: "恢复默认" }));

  expect(document.documentElement).toHaveAttribute("data-appearance", "bright");
  expect(document.documentElement).toHaveAttribute("data-accent", "navy");
  expect(document.documentElement.style.getPropertyValue("--font-scale")).toBe("1");
});

test("keeps display controls usable when browser storage is denied", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Access denied", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Access denied", "SecurityError");
  });

  expect(() => render(<HeaderHarness />)).not.toThrow();
  expect(screen.getByRole("button", { name: "显示设置" })).toBeVisible();
  expect(document.documentElement).toHaveAttribute("data-appearance", "bright");
});
