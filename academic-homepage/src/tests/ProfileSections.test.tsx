import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../App";

test("renders the formal portrait and public contact details", () => {
  render(<App />);

  const portrait = screen.getByRole("img", { name: /秦翊祯/ });
  expect(portrait).toHaveAttribute("src", "/profile.jpg");
  expect(screen.getAllByRole("link", { name: "qinyizhen8@gmail.com" })[0]).toHaveAttribute(
    "href",
    "mailto:qinyizhen8@gmail.com"
  );
  expect(screen.getAllByRole("link", { name: "GitHub" })[0]).toHaveAttribute(
    "href",
    "https://github.com/Jackyqqqqqq"
  );
});

test("shows a readable identity fallback if the portrait cannot load", () => {
  render(<App />);

  fireEvent.error(screen.getByRole("img", { name: /秦翊祯/ }));

  expect(screen.getByRole("img", { name: /秦翊祯/ })).toHaveTextContent("QY");
});

test("renders the public academic record without private resume fields", () => {
  const { container } = render(<App />);

  expect(screen.getByRole("heading", { name: "关于我" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "研究兴趣" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "教育经历" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "技能" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "联系方式" })).toBeVisible();
  expect(screen.getByText("武汉大学")).toBeVisible();
  expect(screen.getByText(/车载网络安全加密技术验证与测试/)).toBeVisible();
  expect(container.textContent).not.toMatch(/\b1[3-9]\d{9}\b/);
  expect(container.textContent).not.toMatch(
    /\b(?:19|20)\d{2}[./-](?:0[1-9]|1[0-2])[./-](?:0[1-9]|[12]\d|3[01])\b/
  );
});
