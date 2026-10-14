"use client";

import React from "react";

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  // Split into lines for basic block parsing
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc pl-4 space-y-1 my-1.5 text-xs">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  }

  function renderInline(text: string): React.ReactNode {
    // Basic inline formatting: **bold**, *italic*, `code`
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
    const tokens = text.split(regex);

    tokens.forEach((token, idx) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push(
          <strong key={idx} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith("*") && token.endsWith("*") && token.length > 2) {
        parts.push(
          <em key={idx} className="italic text-muted-foreground">
            {token.slice(1, -1)}
          </em>
        );
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push(
          <code key={idx} className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] text-primary">
            {token.slice(1, -1)}
          </code>
        );
      } else if (token) {
        parts.push(token);
      }
    });

    return parts;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={index} className="font-semibold text-foreground text-xs mt-2 mb-1">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={index} className="font-semibold text-foreground text-sm mt-2.5 mb-1">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      return;
    }

    // List items
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
      inList = true;
      listItems.push(
        <li key={`li-${index}`} className="text-xs leading-relaxed">
          {renderInline(trimmed.slice(2))}
        </li>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={index} className="text-xs leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
  });

  flushList();

  return <div className="space-y-1">{elements}</div>;
}
