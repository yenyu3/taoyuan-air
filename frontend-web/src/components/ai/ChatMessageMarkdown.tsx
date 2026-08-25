'use client';

import type { ReactNode } from 'react';

function renderInline(text: string): ReactNode {
  const pieces = text.split(/(\*\*.+?\*\*)/g);
  return pieces.map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**')) {
      return <strong key={index}>{piece.slice(2, -2)}</strong>;
    }
    return piece;
  });
}

export function ChatMessageMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  if (lines.length === 0) return null;

  return (
    <div>
      {lines.map((line, index) => {
        const listMatch = line.match(/^[-*]\s+(.+)$/);
        if (listMatch) {
          return <p key={index}>• {renderInline(listMatch[1])}</p>;
        }
        return <p key={index}>{renderInline(line)}</p>;
      })}
    </div>
  );
}
