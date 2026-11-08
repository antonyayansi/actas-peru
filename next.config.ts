import type { NextConfig } from "next";

const estatico = process.env.DIST_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(estatico ? { output: "export" as const } : {}),
  serverExternalPackages: ["unpdf", "exceljs"],
};

export default nextConfig;
