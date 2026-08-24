import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../App";

test("renders the academic homepage shell", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /Qin Yizhen/ })).toBeInTheDocument();
});

test("shows contact channel icons and reveals details on click", () => {
  render(<App />);

  const eduMail = screen.getByRole("button", { name: "Academic Email" });
  fireEvent.click(eduMail);
  expect(screen.getByRole("link", { name: "qinyizhen@zju.edu.cn" })).toHaveAttribute(
    "href",
    "mailto:qinyizhen@zju.edu.cn"
  );

  const wechat = screen.getByRole("button", { name: "WeChat" });
  fireEvent.click(wechat);
  expect(screen.getByText("Jackyqqqqqq")).toBeVisible();
});
