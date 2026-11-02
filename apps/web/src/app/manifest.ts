import type { MetadataRoute } from "next";

/** The web app manifest: name and icons for install and home-screen shortcuts. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bibi",
    short_name: "Bibi",
    start_url: "/",
    display: "standalone",
    background_color: "#FDFCFA",
    theme_color: "#FDFCFA",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
