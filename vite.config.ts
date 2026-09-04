import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // O CSP do index.html é pensado para produção; em dev, o preamble do
      // HMR do React é inline e precisaria de 'unsafe-inline'.
      name: "csp-apenas-producao",
      apply: "serve",
      transformIndexHtml(html) {
        return html.replace(
          'content="default-src \'self\'',
          'content="script-src \'self\' \'unsafe-inline\'; default-src \'self\'',
        )
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
