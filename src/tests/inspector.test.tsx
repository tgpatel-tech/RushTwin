import { it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Inspector } from "../features/Inspector";
import { createProject } from "../persistence/templates";
import { useEditor } from "../stores/editor";
beforeEach(() => {
  cleanup();
  useEditor.getState().load(createProject("UI test"));
});
it("worker control updates editor and keeps scenario isolation", () => {
  const p = useEditor.getState().project!;
  render(
    <Inspector
      scenario={p.scenarios[0]}
      selected="drinks"
      customer={undefined}
      run={null}
      onClose={() => {}}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Add worker" }));
  expect(
    useEditor
      .getState()
      .project!.scenarios[0].stations.find((n) => n.id === "drinks")?.workers,
  ).toBe(2);
  expect(p.scenarios[0].stations.find((n) => n.id === "drinks")?.workers).toBe(
    1,
  );
  useEditor.getState().undo();
  expect(
    useEditor
      .getState()
      .project!.scenarios[0].stations.find((n) => n.id === "drinks")?.workers,
  ).toBe(1);
});
