import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  ok: "bg-[#e5f3ee] text-[#0e5c54]",
  wait: "bg-[#f8efd8] text-[#6d4b12]",
  miss: "bg-[#f6e8e2] text-[#8c4630]",
  info: "bg-[#ece7dc] text-[#24312d]",
};

export function Badge({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
