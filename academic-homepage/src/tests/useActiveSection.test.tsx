import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { useActiveSection } from "../hooks/useActiveSection";

const originalIntersectionObserver = window.IntersectionObserver;

function ActiveSectionHarness() {
  const sectionIds = ["about", "research"];
  const activeSection = useActiveSection(sectionIds);

  return (
    <div>
      <output aria-label="Active section">{activeSection}</output>
      {sectionIds.map((id) => (
        <section id={id} key={id} />
      ))}
    </div>
  );
}

function makeEntry(id: string, intersectionRatio: number, isIntersecting = true) {
  const target = document.getElementById(id)!;
  const targetRect = target.getBoundingClientRect();
  return {
    boundingClientRect: targetRect,
    intersectionRatio,
    intersectionRect: targetRect,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0
  } satisfies IntersectionObserverEntry;
}

afterEach(() => {
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: originalIntersectionObserver
  });
  vi.restoreAllMocks();
});

test("tracks the intersecting section and disconnects on unmount", () => {
  let callback: IntersectionObserverCallback | undefined;
  const observe = vi.fn();
  const disconnect = vi.fn();

  class MockIntersectionObserver {
    constructor(nextCallback: IntersectionObserverCallback) {
      callback = nextCallback;
    }

    observe = observe;
    unobserve = vi.fn();
    disconnect = disconnect;
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = "";
    thresholds = [];
  }

  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver
  });

  const { unmount } = render(<ActiveSectionHarness />);
  expect(screen.getByRole("status", { name: "Active section" })).toHaveTextContent("about");
  expect(observe).toHaveBeenCalledTimes(2);

  act(() => {
    callback?.([makeEntry("research", 1)], {} as IntersectionObserver);
  });

  expect(screen.getByRole("status", { name: "Active section" })).toHaveTextContent("research");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

test("keeps the more visible section active when observer updates arrive separately", () => {
  let callback: IntersectionObserverCallback | undefined;

  class MockIntersectionObserver {
    constructor(nextCallback: IntersectionObserverCallback) {
      callback = nextCallback;
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
    root = null;
    rootMargin = "";
    thresholds = [];
  }

  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: MockIntersectionObserver
  });

  render(<ActiveSectionHarness />);

  act(() => callback?.([makeEntry("about", 0.36)], {} as IntersectionObserver));
  act(() => callback?.([makeEntry("research", 0.15)], {} as IntersectionObserver));
  expect(screen.getByRole("status", { name: "Active section" })).toHaveTextContent("about");

  act(() => callback?.([makeEntry("about", 0, false)], {} as IntersectionObserver));
  expect(screen.getByRole("status", { name: "Active section" })).toHaveTextContent("research");
});

test("keeps the first section active when observers are unavailable", () => {
  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: undefined
  });

  render(<ActiveSectionHarness />);

  expect(screen.getByRole("status", { name: "Active section" })).toHaveTextContent("about");
});
