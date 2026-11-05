import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  ok: "bg-petrol text-white",
  wait: "bg-[#fff4cc] text-[#4a3900]",
  miss: "bg-[#fde8e4] text-[#7a2e22]",
  info: "bg-ice text-petrol",
};

export function Badge({ tone = "info", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-sm px-2.5 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
