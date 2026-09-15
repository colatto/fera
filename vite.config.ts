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
  build: {
    rolldownOptions: {
      output: {
        // Vendor inicial em grupos estáveis entre deploys (spec
        // carregamento-progressivo: aviso de chunk volta a sinalizar
        // regressão real). Forma de função: a forma de objeto não é
        // aceita pelo Rolldown. react + react-dom juntos evitam ciclo de
        // chunks na inicialização do React.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined
          if (/[\\/]node_modules[\\/]@supabase[\\/]/.test(id)) return "vendor-supabase"
          if (/[\\/]node_modules[\\/](react-dom|scheduler)[\\/]/.test(id)) return "vendor-react"
          if (/[\\/]node_modules[\\/]react[\\/]/.test(id)) return "vendor-react"
          if (/[\\/]node_modules[\\/]react-router/.test(id)) return "vendor-router"
          return undefined
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
