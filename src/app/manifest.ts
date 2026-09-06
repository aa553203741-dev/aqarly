import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "عقارلي — الوسيط العقاري الذكي",
    short_name: "عقارلي",
    description: "منصة إدارة المخزون العقاري والوساطة الذكية",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f8f7",
    theme_color: "#0d7a6e",
    lang: "ar",
    dir: "rtl",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
