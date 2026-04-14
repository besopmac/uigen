import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge, getToolCallLabel } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

// ─── getToolCallLabel: str_replace_editor with path ──────────────────────────

test("getToolCallLabel: str_replace_editor create with path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/src/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace with path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Card.jsx" })).toBe("Editing Card.jsx");
});

test("getToolCallLabel: str_replace_editor insert with path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolCallLabel: str_replace_editor view with path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/src/index.ts" })).toBe("Viewing index.ts");
});

test("getToolCallLabel: str_replace_editor undo_edit with path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/src/lib/utils.ts" })).toBe("Undoing edit to utils.ts");
});

// ─── getToolCallLabel: str_replace_editor fallbacks (no path) ────────────────

test("getToolCallLabel: str_replace_editor create with missing path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolCallLabel: str_replace_editor str_replace with missing path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace" })).toBe("Editing file");
});

test("getToolCallLabel: str_replace_editor view with empty string path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "" })).toBe("Viewing file");
});

test("getToolCallLabel: str_replace_editor undo_edit with slash-only path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/" })).toBe("Undoing edit");
});

test("getToolCallLabel: str_replace_editor missing command (partial-call) with path", () => {
  expect(getToolCallLabel("str_replace_editor", { path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("getToolCallLabel: str_replace_editor missing command (partial-call) without path", () => {
  expect(getToolCallLabel("str_replace_editor", {})).toBe("Editing file");
});

test("getToolCallLabel: str_replace_editor unknown command falls back to Editing", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "unknown_cmd", path: "/App.jsx" })).toBe("Editing App.jsx");
});

// ─── getToolCallLabel: file_manager with path ────────────────────────────────

test("getToolCallLabel: file_manager rename with path", () => {
  expect(getToolCallLabel("file_manager", { command: "rename", path: "/src/old-name.ts" })).toBe("Moving old-name.ts");
});

test("getToolCallLabel: file_manager delete with path", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/src/utils.ts" })).toBe("Deleting utils.ts");
});

// ─── getToolCallLabel: file_manager fallbacks ────────────────────────────────

test("getToolCallLabel: file_manager rename with missing path", () => {
  expect(getToolCallLabel("file_manager", { command: "rename" })).toBe("Moving file");
});

test("getToolCallLabel: file_manager delete with missing path", () => {
  expect(getToolCallLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getToolCallLabel: file_manager unknown command with path falls back to Managing", () => {
  expect(getToolCallLabel("file_manager", { command: "unknown_cmd", path: "/App.tsx" })).toBe("Managing App.tsx");
});

test("getToolCallLabel: file_manager missing command (partial-call) with path", () => {
  expect(getToolCallLabel("file_manager", { path: "/App.tsx" })).toBe("Managing App.tsx");
});

test("getToolCallLabel: file_manager missing command (partial-call) without path", () => {
  expect(getToolCallLabel("file_manager", {})).toBe("Managing file");
});

// ─── getToolCallLabel: filename extraction edge cases ────────────────────────

test("getToolCallLabel: extracts last segment from nested path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/components/ui/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolCallLabel: handles root-level filename without slash", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "App.jsx" })).toBe("Creating App.jsx");
});

// ─── getToolCallLabel: unknown tool ──────────────────────────────────────────

test("getToolCallLabel: unknown tool returns raw tool name", () => {
  expect(getToolCallLabel("some_other_tool", { command: "do_thing", path: "/foo.ts" })).toBe("some_other_tool");
});

test("getToolCallLabel: unknown tool with empty args returns raw tool name", () => {
  expect(getToolCallLabel("bash", {})).toBe("bash");
});

// ─── ToolCallBadge rendering ─────────────────────────────────────────────────

test("ToolCallBadge shows green dot and label for completed result", () => {
  const tool: ToolInvocation = {
    state: "result",
    toolCallId: "tc-1",
    toolName: "str_replace_editor",
    args: { command: "create", path: "/src/App.jsx" },
    result: "Success",
  };

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge shows spinner for call state", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "tc-2",
    toolName: "str_replace_editor",
    args: { command: "str_replace", path: "/src/components/Card.jsx" },
  };

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Editing Card.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner for partial-call state with empty args", () => {
  const tool: ToolInvocation = {
    state: "partial-call",
    toolCallId: "tc-3",
    toolName: "str_replace_editor",
    args: {},
  };

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Editing file")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge shows spinner when result is null (falsy)", () => {
  const tool: ToolInvocation = {
    state: "result",
    toolCallId: "tc-4",
    toolName: "str_replace_editor",
    args: { command: "view", path: "/src/App.jsx" },
    result: null,
  };

  const { container } = render(<ToolCallBadge tool={tool} />);

  expect(screen.getByText("Viewing App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
});

test("ToolCallBadge renders file_manager delete label", () => {
  const tool: ToolInvocation = {
    state: "result",
    toolCallId: "tc-5",
    toolName: "file_manager",
    args: { command: "delete", path: "/src/utils.ts" },
    result: { success: true },
  };

  render(<ToolCallBadge tool={tool} />);
  expect(screen.getByText("Deleting utils.ts")).toBeDefined();
});

test("ToolCallBadge renders unknown tool name as-is", () => {
  const tool: ToolInvocation = {
    state: "call",
    toolCallId: "tc-6",
    toolName: "bash",
    args: { cmd: "ls" },
  };

  render(<ToolCallBadge tool={tool} />);
  expect(screen.getByText("bash")).toBeDefined();
});
