import type { NextConfig } from "next";
import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
  PHASE_PRODUCTION_SERVER,
} from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const isDevelopment = phase === PHASE_DEVELOPMENT_SERVER;
  const isProduction =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;

  return {
    typedRoutes: true,
    distDir: isDevelopment ? ".next-dev" : isProduction ? ".next" : ".next",
    allowedDevOrigins: [
      "192.168.0.101",
      "localhost:3000",
      "127.0.0.1:3000",
    ],
    experimental: {
      devtoolSegmentExplorer: false,
    },
  };
}
