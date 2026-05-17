"use client";

import { Copy, FileDown } from "lucide-react";
import { useState } from "react";

export function ShareActions({ url, exportText }: { url: string; exportText: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function exportCsv() {
    const blob = new Blob([exportText], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = "questlab-export.csv";
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={copyLink} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
        <Copy className="size-4" />
        {copied ? "Copied" : "Copy link"}
      </button>
      <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold">
        <FileDown className="size-4" />
        Export CSV
      </button>
    </div>
  );
}
