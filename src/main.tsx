import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { Toaster } from "@/components/ui/sonner"
import { iniciarEscutaSessao } from "@/lib/auth"
import { criarRouter } from "@/router"
import "./index.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = criarRouter()

// Sessão inválida durante o uso (task 2.6): limpa o cache e vai ao login sem
// loop — se já estamos na tela de login, nada a fazer.
iniciarEscutaSessao(queryClient, () => {
  if (!router.state.location.pathname.startsWith("/login")) {
    router.navigate("/login?motivo=sessao", { replace: true })
  }
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster theme="dark" richColors position="top-center" />
    </QueryClientProvider>
  </StrictMode>,
)
