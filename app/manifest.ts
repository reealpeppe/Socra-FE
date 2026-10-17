import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Socra",
    short_name: "Socra",
    description: "La community peer-to-peer per imparare e condividere esperienze sugli investimenti.",
    lang: "it",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#20272e",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
}
