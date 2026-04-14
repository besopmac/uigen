"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

function extractFilename(path: unknown): string | null {
  if (typeof path !== "string" || path.trim() === "") return null;
  const segments = path.split("/").filter((s) => s.length > 0);
  return segments.length > 0 ? segments[segments.length - 1] : null;
}

export function getToolCallLabel(
  toolName: string,
  args: Record<string, unknown>
): string {
  const filename = extractFilename(args.path);

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":      return filename ? `Creating ${filename}`        : "Creating file";
      case "str_replace": return filename ? `Editing ${filename}`         : "Editing file";
      case "insert":      return filename ? `Editing ${filename}`         : "Editing file";
      case "view":        return filename ? `Viewing ${filename}`         : "Viewing file";
      case "undo_edit":   return filename ? `Undoing edit to ${filename}` : "Undoing edit";
      default:            return filename ? `Editing ${filename}`         : "Editing file";
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return filename ? `Moving ${filename}`   : "Moving file";
      case "delete": return filename ? `Deleting ${filename}` : "Deleting file";
      default:       return filename ? `Managing ${filename}` : "Managing file";
    }
  }

  return toolName;
}

interface ToolCallBadgeProps {
  tool: ToolInvocation;
}

export function ToolCallBadge({ tool }: ToolCallBadgeProps) {
  const label = getToolCallLabel(tool.toolName, tool.args as Record<string, unknown>);
  const isDone = tool.state === "result" && tool.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-neutral-700">{label}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
          <span className="text-neutral-700">{label}</span>
        </>
      )}
    </div>
  );
}
