import type { ReactNode } from "react"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mensagemDeErro } from "@/lib/formato"

// Estados padronizados de consulta (spec interface-web):
// carregando, vazio explícito (não é erro) e erro com mensagem.

export function Carregando({ descricao = "Carregando…" }: { descricao?: string }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground"
    >
      <LoaderCircle className="size-6 animate-spin" aria-hidden />
      <p className="text-sm">{descricao}</p>
    </div>
  )
}

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="label-caixa">{titulo}</p>
      {descricao ? <p className="text-sm text-muted-foreground">{descricao}</p> : null}
      {acao}
    </div>
  )
}

export function ErroDeConsulta({
  erro,
  tentarNovamente,
}: {
  erro: unknown
  tentarNovamente?: () => void
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 py-16 text-center"
    >
      <p className="label-caixa">Não foi possível carregar</p>
      <p className="max-w-md text-sm text-muted-foreground">{mensagemDeErro(erro)}</p>
      {tentarNovamente ? (
        <Button variant="outline" size="sm" onClick={tentarNovamente}>
          Tentar novamente
        </Button>
      ) : null}
    </div>
  )
}

// Degradação para conteúdo administrativo que o perfil não alcança
// (spec interface-web: OPER força URL administrativa → estado sem dados).
export function SemDados({
  titulo = "Dados indisponíveis",
  descricao = "Seu perfil não tem acesso a este conteúdo.",
}: {
  titulo?: string
  descricao?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="label-caixa">{titulo}</p>
      <p className="text-sm text-muted-foreground">{descricao}</p>
    </div>
  )
}
