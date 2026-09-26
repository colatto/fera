import { readFileSync } from "node:fs"
import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// Versão exibida no rodapé institucional (spec interface-web): cada commit
// carrega a própria versão — o hook de pre-commit avança o contador no
// package.json; o build apenas lê o valor, sem tocar no git.
const { version: versaoApp } = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf8"),
) as { version: string }

export default defineConfig({
  define: {
    __VERSAO_APP__: JSON.stringify(versaoApp),
  },
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
        // regressão real). A primeira correspondência de `test` vence.
        // react + react-dom + scheduler juntos evitam ciclo de chunks na
        // inicialização do React.
        codeSplitting: {
          groups: [
            { name: "vendor-supabase", test: /[\\/]node_modules[\\/]@supabase[\\/]/ },
            { name: "vendor-react", test: /[\\/]node_modules[\\/](react-dom|scheduler|react)[\\/]/ },
            { name: "vendor-router", test: /[\\/]node_modules[\\/]react-router/ },
          ],
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
