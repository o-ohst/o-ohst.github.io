import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "portfolio-revision",
      transformIndexHtml: {
        order: "post",
        handler(_html, context) {
          const fonts = Object.keys(context.bundle || {}).filter(
            (name) =>
              name.endsWith(".woff2") &&
              (name.includes("latin-400-normal") ||
                name.includes("latin-400-italic") ||
                name.includes("manrope-latin")),
          );
          return fonts.map((name) => ({
            tag: "link",
            attrs: {
              rel: "preload",
              as: "font",
              type: "font/woff2",
              crossorigin: "",
              href: `/${name}`,
            },
            injectTo: "head" as const,
          }));
        },
      },
      generateBundle() {
        const revision =
          process.env.GITHUB_SHA ||
          execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim();
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ revision }),
        });
      },
    },
  ],
  server: {
    port: 5176,
  },
});
