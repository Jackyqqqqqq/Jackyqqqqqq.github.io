import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import ProjectItem from "../components/ProjectItem";
import ProjectList from "../components/ProjectList";
import type { ProjectContent } from "../content.types";

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

test("shows fanned project covers and keeps details closed by default", () => {
  render(<ProjectList locale="zh" />);

  expect(screen.getByRole("heading", { name: /多维特征优化的新冠人数预测/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /基于半监督学习的花卉图像分类/ })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: /HiNet 图像隐写研究/ })).toBeInTheDocument();
  expect(screen.queryByText("方法")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /仓库|repository/i })).not.toBeInTheDocument();
});

test("opens a card with a pointer and closes it with the keyboard", async () => {
  const user = userEvent.setup();
  render(<ProjectList locale="zh" />);
  const cover = screen.getByRole("button", { name: /多维特征优化的新冠人数预测/ });

  await user.click(cover);

  expect(screen.getByText("方法")).toBeVisible();
  expect(screen.getByText("结果")).toBeVisible();

  await user.click(screen.getByRole("button", { name: "收起详情" }));

  expect(screen.queryByText("方法")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: /多维特征优化的新冠人数预测/ })).toBeInTheDocument();
});

test("closes an open card with the Escape key", async () => {
  const user = userEvent.setup();
  render(<ProjectList locale="zh" />);

  await user.click(screen.getByRole("button", { name: /HiNet 图像隐写研究/ }));
  expect(screen.getByText("方法")).toBeVisible();

  await user.keyboard("{Escape}");

  expect(screen.queryByText("方法")).not.toBeInTheDocument();
});

test("renders a repository link inside an opened card when a URL is provided", () => {
  render(
    <ProjectItem
      project={linkedProject}
      locale="en"
      pose={{ rot: "0deg", x: "0px" }}
      isActive
      isDimmed={false}
      onOpen={() => {}}
      onClose={() => {}}
      closeRef={() => {}}
      coverRef={() => {}}
    />
  );

  const link = screen.getByRole("link", { name: /Repository/ });
  expect(link).toHaveAttribute("href", "https://github.com/example/public-project");
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAttribute("rel", "noreferrer");
});
