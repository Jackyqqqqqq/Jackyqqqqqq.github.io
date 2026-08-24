import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../App";

test("renders the formal portrait and public contact details", () => {
  render(<App />);

  const portrait = screen.getByRole("img", { name: /Qin Yizhen/ });
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

  fireEvent.error(screen.getByRole("img", { name: /Qin Yizhen/ }));

  expect(screen.getByRole("img", { name: /Qin Yizhen/ })).toHaveTextContent("QY");
});

test("renders the public academic record without private resume fields", () => {
  const { container } = render(<App />);

  expect(screen.getByRole("heading", { name: "About" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Research Preference" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Education" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Skills" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Contact" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Zhejiang University emblem" })).toHaveAttribute(
    "src",
    "/university-logos/zhejiang-university.svg"
  );
  expect(screen.getByRole("img", { name: "Wuhan University emblem" })).toHaveAttribute(
    "src",
    "/university-logos/wuhan-university.svg"
  );
  expect(screen.getByText(/Verification and Testing of Encryption for In-Vehicle Networks/)).toBeVisible();
  expect(container.textContent).not.toMatch(/\b1[3-9]\d{9}\b/);
  expect(container.textContent).not.toMatch(
    /\b(?:19|20)\d{2}[./-](?:0[1-9]|1[0-2])[./-](?:0[1-9]|[12]\d|3[01])\b/
  );
});
