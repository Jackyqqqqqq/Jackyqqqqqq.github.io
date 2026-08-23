import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
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
