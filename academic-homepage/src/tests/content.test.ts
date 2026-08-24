import { expect, test } from "vitest";
import { siteContent } from "../content";
import { validateContent } from "../content.validation";
import type { SiteContent } from "../content.types";

type InvalidContentCase = {
  name: string;
  mutate: (content: SiteContent) => void;
  expectedError: string;
};

const invalidContentCases: InvalidContentCase[] = [
  {
    name: "blank localized copy",
    mutate: (content) => {
      content.identity.name.en = " ";
    },
    expectedError: "content.identity.name.en is blank"
  },
  {
    name: "duplicate navigation IDs",
    mutate: (content) => {
      content.navigation[1].id = content.navigation[0].id;
    },
    expectedError: "navigation IDs must be unique"
  },
  {
    name: "duplicate project IDs",
    mutate: (content) => {
      content.projects[1].id = content.projects[0].id;
    },
    expectedError: "projects IDs must be unique"
  },
  {
    name: "malformed email",
    mutate: (content) => {
      content.contact.email = "not-an-email";
    },
    expectedError: "contact.email is invalid"
  },
  {
    name: "non-HTTPS project URL",
    mutate: (content) => {
      content.projects[0].href = "http://example.test/project";
    },
    expectedError: "projects.covid-forecasting.href must use https"
  },
  {
    name: "non-HTTPS GitHub URL",
    mutate: (content) => {
      content.contact.github = "http://github.com/example";
    },
    expectedError: "contact.github must use https"
  },
  {
    name: "missing UI copy",
    mutate: (content) => {
      delete (content.ui as Partial<SiteContent["ui"]>).menu;
    },
    expectedError: "content.ui.menu is missing"
  }
];

test("contains complete bilingual public content", () => {
  expect(validateContent(siteContent)).toEqual([]);
});

test.each(invalidContentCases)("rejects $name", ({ mutate, expectedError }) => {
  const content = structuredClone(siteContent);
  mutate(content);

  expect(validateContent(content)).toContain(expectedError);
});

test("rejects non-HTTPS project links", () => {
  const content = structuredClone(siteContent);
  content.projects[0].href = "http://example.test/project";
  expect(validateContent(content)).toContain("projects.covid-forecasting.href must use https");
});

test("does not expose resume-only private data", () => {
  const serialized = JSON.stringify(siteContent);
  const keys: string[] = [];
  const collectKeys = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      keys.push(key);
      collectKeys(child);
    }
  };
  collectKeys(siteContent);

  expect(keys.join(" ")).not.toMatch(/\b(?:birth(?:day|date)?|phone|mobile|gpa|cet6?|score|grade)\b/i);
  expect(serialized).not.toMatch(/\b1[3-9]\d{9}\b/);
  expect(serialized).not.toMatch(/\b(?:19|20)\d{2}[./-](?:0[1-9]|1[0-2])[./-](?:0[1-9]|[12]\d|3[01])\b/);
});
