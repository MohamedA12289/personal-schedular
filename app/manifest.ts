import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My Schedule",
    short_name: "Schedule",
    description: "PassivePilot-inspired personal scheduler",
    start_url: "/",
    display: "standalone",
    theme_color: "#ffffff",
    background_color: "#f3f4f6",
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
  };
}
