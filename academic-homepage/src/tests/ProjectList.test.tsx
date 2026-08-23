import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import ProjectItem from "../components/ProjectItem";
import ProjectList from "../components/ProjectList";
import type { ProjectContent } from "../content.types";

test("keeps project summaries visible and details collapsed by default", () => {
  render(<ProjectList locale="zh" />);

  expect(screen.getByRole("heading", { name: "多维特征优化的新冠人数预测" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "基于半监督学习的花卉图像分类" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "HiNet 图像隐写研究" })).toBeVisible();
  expect(screen.getByText("使用两类特征降维方法构建感染人数回归预测流程。")).toBeVisible();
  expect(screen.getAllByRole("button", { name: "展开详情" })[0]).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(screen.queryByText("方法")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /仓库|repository/i })).not.toBeInTheDocument();
});

test("expands with a pointer and collapses with the keyboard", async () => {
  const user = userEvent.setup();
  render(<ProjectList locale="zh" />);
  const button = screen.getAllByRole("button", { name: "展开详情" })[0];

  await user.click(button);

  expect(button).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByText("方法")).toBeVisible();
  expect(screen.getByText("结果")).toBeVisible();

  button.focus();
  await user.keyboard("{Enter}");

  expect(button).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByText("方法")).not.toBeInTheDocument();
});

test("renders a repository link only when a real URL is provided", () => {
  const linkedProject: ProjectContent = {
    id: "linked-project",
    title: { zh: "公开项目", en: "Public Project" },
    period: "2026",
    tags: ["React"],
    summary: { zh: "公开摘要", en: "Public summary" },
    method: { zh: "公开方法", en: "Public method" },
    result: { zh: "公开结果", en: "Public result" },
    href: "https://github.com/example/public-project"
  };

  render(<ProjectItem project={linkedProject} locale="en" />);

  expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute(
    "href",
    "https://github.com/example/public-project"
  );
  expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute("target", "_blank");
  expect(screen.getByRole("link", { name: "Repository" })).toHaveAttribute("rel", "noreferrer");
});
