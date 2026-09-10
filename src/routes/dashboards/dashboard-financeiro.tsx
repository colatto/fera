import { useQuery } from "@tanstack/react-query"
import { Wallet } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Carregando, ErroDeConsulta } from "@/components/estados"
import { formatarMoeda } from "@/lib/formato"
import { chavesDashboards, obterDashboardFinanceiro } from "@/queries/dashboards"

// Dashboard financeiro (spec painel-dashboards): exclusivo de ADM — a rota vive
// sob a guarda de perfil e a leitura permanece bloqueada pelo banco para OPER.
export function DashboardFinanceiro() {
  const consulta = useQuery({
    queryKey: chavesDashboards.financeiro(),
    queryFn: obterDashboardFinanceiro,
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard financeiro</h1>
        <p className="text-sm text-muted-foreground">
          Faturado, recebido, saldo a receber e carteira de projetos.
        </p>
      </div>

      {consulta.isPending ? (
        <Carregando descricao="Consultando dashboard…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <Wallet className="size-4" aria-hidden />
                Faturado
              </CardDescription>
              <CardTitle className="text-3xl">{formatarMoeda(consulta.data?.faturado ?? 0)}</CardTitle>
              <CardContent className="px-0 pt-1 text-xs text-muted-foreground">
                Soma das notas fiscais emitidas.
              </CardContent>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Recebido</CardDescription>
              <CardTitle className="text-3xl">{formatarMoeda(consulta.data?.recebido ?? 0)}</CardTitle>
              <CardContent className="px-0 pt-1 text-xs text-muted-foreground">
                Recebimentos confirmados.
              </CardContent>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Saldo a receber</CardDescription>
              <CardTitle className="text-3xl">{formatarMoeda(consulta.data?.saldo ?? 0)}</CardTitle>
              <CardContent className="px-0 pt-1 text-xs text-muted-foreground">
                Notas menos recebimentos.
              </CardContent>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Projetos</CardDescription>
              <CardTitle className="text-3xl">{formatarMoeda(consulta.data?.projetos ?? 0)}</CardTitle>
              <CardContent className="px-0 pt-1 text-xs text-muted-foreground">
                Soma do valor dos projetos não cancelados.
              </CardContent>
            </CardHeader>
          </Card>
        </div>
      )}
    </div>
  )
}
