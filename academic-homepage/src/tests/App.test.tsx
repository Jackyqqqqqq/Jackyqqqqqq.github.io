import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "../App";

test("renders the academic homepage shell", () => {
  render(<App />);
  expect(screen.getByRole("heading", { name: /秦翊祯/ })).toBeInTheDocument();
});
