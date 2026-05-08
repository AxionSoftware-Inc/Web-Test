export function LatexText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\\\(.+?\\\)|\$.+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isLatex = (part.startsWith("\\(") && part.endsWith("\\)")) || (part.startsWith("$") && part.endsWith("$"));
        if (!isLatex) return <span key={index}>{part}</span>;
        const clean = part.replace(/^\\\(|\\\)$/g, "").replace(/^\$|\$$/g, "");
        return (
          <span key={index} className="rounded bg-black/[0.04] px-1.5 py-0.5 font-mono text-[0.95em]">
            {clean}
          </span>
        );
      })}
    </span>
  );
}
