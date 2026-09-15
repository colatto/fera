import { Component, Suspense, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Carregando } from "@/components/estados"

// Carregamento sob demanda das rotas (spec carregamento-progressivo):
// Suspense com o estado padrão de carregamento e boundary mínimo para
// falha de download de chunk (ex.: aba aberta atravessando um deploy) —
// oferece recarregar a aplicação em vez de tela quebrada.
class BoundaryDeRota extends Component<{ children: ReactNode }, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  render() {
    if (this.state.erro) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        >
          <p className="label-caixa">Não foi possível carregar esta tela</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Ocorreu uma falha ao baixar o código desta página. Recarregue a aplicação para
            tentar novamente.
          </p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}

export function RotaLazy({
  children,
  centralizado = false,
}: {
  children: ReactNode
  // Rota fora do shell (login): fallback ocupa a tela inteira, como a própria página.
  centralizado?: boolean
}) {
  return (
    <BoundaryDeRota>
      <Suspense
        fallback={
          centralizado ? (
            <div className="flex min-h-svh items-center justify-center">
              <Carregando />
            </div>
          ) : (
            <Carregando />
          )
        }
      >
        {children}
      </Suspense>
    </BoundaryDeRota>
  )
}
