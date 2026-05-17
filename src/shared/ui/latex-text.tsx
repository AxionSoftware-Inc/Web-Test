"use client";

import { InlineMath } from "react-katex";

export function LatexText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\\\(.+?\\\)|\$.+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isLatex = (part.startsWith("\\(") && part.endsWith("\\)")) || (part.startsWith("$") && part.endsWith("$"));
        if (!isLatex) return <span key={index}>{part}</span>;
        const clean = part.replace(/^\\\(|\\\)$/g, "").replace(/^\$|\$$/g, "");
        return <InlineMath key={index} math={clean} />;
      })}
    </span>
  );
}
