import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Carregando, ErroDeConsulta } from "@/components/estados"
import { ROTULOS_STATUS, type StatusProjeto } from "@/lib/constantes"
import { formatarNumero } from "@/lib/formato"
import {
  chavesDashboards,
  obterDashboardOperacional,
} from "@/queries/dashboards"

const hoje = () => new Date().toISOString().slice(0, 10)
const mesesAtras = (meses: number) => {
  const data = new Date()
  data.setMonth(data.getMonth() - meses)
  return data.toISOString().slice(0, 10)
}

const CORES_GRAFICO: Record<string, string> = {
  CADASTRADO: "#5A6B94",
  ENVIADO: "#4C8DFF",
  OC_REGISTRADA: "#38BDF8",
  AUTORIZADO_FATURAMENTO: "#FBBF24",
  NOTA_EMITIDA: "#A78BFA",
  PAGO: "#34D399",
}

// Distribuição completa: status sem ocorrência aparecem zerados (spec painel-dashboards).
function montarDistribuicao(porStatus: { status: string; quantidade: number }[]) {
  const contagem = new Map(porStatus.map((item) => [item.status, item.quantidade]))
  return (Object.keys(ROTULOS_STATUS) as StatusProjeto[])
    .filter((status) => status !== "CANCELADO")
    .map((status) => ({
      status,
      rotulo: ROTULOS_STATUS[status],
      quantidade: contagem.get(status) ?? 0,
    }))
}

export function DashboardOperacional() {
  const [dataInicial, setDataInicial] = useState(mesesAtras(3))
  const [dataFinal, setDataFinal] = useState(hoje())

  const consulta = useQuery({
    queryKey: chavesDashboards.operacional(dataInicial, dataFinal),
    queryFn: () => obterDashboardOperacional(dataInicial, dataFinal),
  })

  const periodoValido = dataInicial !== "" && dataFinal !== "" && dataInicial <= dataFinal
  const distribucao = consulta.data ? montarDistribuicao(consulta.data.porStatus) : []
  const totalStatus = distribucao.reduce((soma, item) => soma + item.quantidade, 0)

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard operacional</h1>
        <p className="text-sm text-muted-foreground">
          Distribuição por status e envios no período selecionado.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dash-inicial" className="text-xs">Data inicial</Label>
            <Input
              id="dash-inicial"
              type="date"
              className="h-9 w-44"
              value={dataInicial}
              max={dataFinal}
              onChange={(e) => setDataInicial(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dash-final" className="text-xs">Data final</Label>
            <Input
              id="dash-final"
              type="date"
              className="h-9 w-44"
              value={dataFinal}
              min={dataInicial}
              onChange={(e) => setDataFinal(e.target.value)}
            />
          </div>
          {!periodoValido ? (
            <p className="text-sm text-destructive">A data inicial deve ser anterior à final.</p>
          ) : null}
        </CardContent>
      </Card>

      {!periodoValido ? null : consulta.isPending ? (
        <Carregando descricao="Consultando dashboard…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Projetos ativos por status</CardDescription>
                <CardTitle className="text-3xl">{formatarNumero(totalStatus)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Enviados no período</CardDescription>
                <CardTitle className="text-3xl">
                  {formatarNumero(consulta.data?.enviadosNoPeriodo ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Enviados sem OC</CardDescription>
                <CardTitle className="text-3xl">
                  {formatarNumero(consulta.data?.enviadosSemOc ?? 0)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição por status</CardTitle>
                <CardDescription>Projetos ativos, excluindo cancelados.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distribucao} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(157,169,198,0.15)" />
                    <XAxis
                      dataKey="rotulo"
                      tick={{ fill: "#9DA9C6", fontSize: 11 }}
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={52}
                    />
                    <YAxis allowDecimals={false} tick={{ fill: "#9DA9C6", fontSize: 11 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(76,141,255,0.08)" }}
                      contentStyle={{
                        background: "#232C47",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        color: "#E8ECF5",
                      }}
                    />
                    <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                      {distribucao.map((entrada) => (
                        <Cell key={entrada.status} fill={CORES_GRAFICO[entrada.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proporção por status</CardTitle>
                <CardDescription>
                  {totalStatus === 0
                    ? "Nenhum projeto ativo no momento — valores zerados."
                    : "Participação de cada status no total ativo."}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucao}
                      dataKey="quantidade"
                      nameKey="rotulo"
                      innerRadius="52%"
                      outerRadius="80%"
                      paddingAngle={2}
                      stroke="#232C47"
                    >
                      {distribucao.map((entrada) => (
                        <Cell key={entrada.status} fill={CORES_GRAFICO[entrada.status]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#232C47",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 8,
                        color: "#E8ECF5",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
