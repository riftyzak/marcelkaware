"use client";

import { cn } from "@/lib/utils/cn";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2 } from "lucide-react";
import { useEffect, useRef } from "react";

const fontSizeMap = {
  sm: "2",
  base: "3",
  lg: "4",
  xl: "5",
} as const;

function runCommand(command: string, value?: string) {
  if (typeof document === "undefined") {
    return;
  }
  document.execCommand(command, false, value);
}

export function TicketRichTextEditor({
  value,
  onChange,
  placeholder = "Write your message.",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  function syncValue() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function focusEditor() {
    editorRef.current?.focus();
  }

  function applyLink() {
    focusEditor();
    const href = window.prompt("Enter link URL");
    if (!href) {
      return;
    }
    runCommand("createLink", href.trim());
    syncValue();
  }

  return (
    <div className={cn("overflow-hidden rounded-[12px] border border-[color:var(--border)] bg-[color:var(--panel)]", className)}>
      <div className="flex flex-wrap items-center gap-1 border-b border-[color:var(--border)] bg-[color:var(--panel-muted)] p-2">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            focusEditor();
            runCommand("bold");
            syncValue();
          }}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            focusEditor();
            runCommand("italic");
            syncValue();
          }}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={applyLink}
          type="button"
        >
          <Link2 className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/8" />
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            focusEditor();
            runCommand("justifyLeft");
            syncValue();
          }}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            focusEditor();
            runCommand("justifyCenter");
            syncValue();
          }}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white"
          onClick={() => {
            focusEditor();
            runCommand("justifyRight");
            syncValue();
          }}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/8" />
        <label className="inline-flex h-9 items-center gap-2 rounded-[10px] px-2 text-xs text-[color:var(--text-muted)] transition hover:bg-white/5 hover:text-white">
          <span>Color</span>
          <input
            className="h-5 w-5 cursor-pointer rounded border border-white/10 bg-transparent p-0"
            defaultValue="#e7edf6"
            onChange={(event) => {
              focusEditor();
              runCommand("foreColor", event.target.value);
              syncValue();
            }}
            type="color"
          />
        </label>
        <select
          className="ml-auto h-9 rounded-[10px] border border-white/10 bg-[#11161d] px-3 text-sm text-[color:var(--text)] outline-none"
          defaultValue="base"
          onChange={(event) => {
            focusEditor();
            runCommand("fontSize", fontSizeMap[event.target.value as keyof typeof fontSizeMap] ?? "3");
            syncValue();
          }}
        >
          <option value="sm">Small</option>
          <option value="base">Base</option>
          <option value="lg">Large</option>
          <option value="xl">XL</option>
        </select>
      </div>

      <div
        className={cn(
          "min-h-[220px] w-full px-4 py-3 text-sm leading-7 text-[color:var(--text)] outline-none",
          "empty:before:pointer-events-none empty:before:text-[color:var(--text-dim)] empty:before:content-[attr(data-placeholder)]",
        )}
        contentEditable
        data-placeholder={placeholder}
        onBlur={syncValue}
        onInput={syncValue}
        ref={editorRef}
        suppressContentEditableWarning
      />
    </div>
  );
}
