import { useMemo, useRef, useState } from "react"
import { Link, useParams, useRouteLoaderData } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Carregando, ErroDeConsulta, SemDados } from "@/components/estados"
import { LinhaTempo, type ItemLinhaTempo } from "@/components/linha-tempo"
import type { SessaoAtual } from "@/lib/auth"
import {
  CORES_STATUS,
  ROTULOS_EVENTO,
  ROTULOS_STATUS,
  type StatusProjeto,
} from "@/lib/constantes"
import { formatarData, formatarDataHora, formatarMoeda, mensagemDeErro } from "@/lib/formato"
import {
  autorizarFaturamento,
  cancelarProjeto,
  confirmarRecebimentosLote,
  definirCompatibilizacaoFundacao,
  enviarProjeto,
  registrarNotaFiscal,
  registrarOrdemCompra,
  registrarRecebimento,
  vincularOrdemCompra,
  useAcaoFluxo,
  type ItemRecebimentoLote,
} from "@/queries/fluxo"
import {
  chavesProjetos,
  filtrosVazios,
  listarEventos,
  listarOrdensCompra,
  listarProjetos,
  obterDocumentosAdm,
  obterProjeto,
  type DocumentosAdm,
  type EventoProjeto,
  type ProjetoAdministrativo,
} from "@/queries/projetos"
import { chavesUsuarios, listarNomesUsuarios } from "@/queries/usuarios"

const HOJE = () => new Date().toISOString().slice(0, 10)

// Datas puras (date) ganham meio-dia para ordenar estável na linha do tempo.
const aoMeioDia = (data: string) => `${data}T12:00:00`

// Humaniza `detalhes` por tipo de evento; o default é omitir, nunca serializar JSON.
function descricaoDetalhesEvento(evento: EventoProjeto): string | undefined {
  if (evento.tipo === "COMPATIBILIZACAO_FUNDACAO") {
    const detalhes = evento.detalhes as { marcada?: unknown } | null
    if (detalhes && typeof detalhes.marcada === "boolean") {
      return detalhes.marcada
        ? "Fundação marcada como compatibilizada"
        : "Compatibilização desmarcada"
    }
  }
  return undefined
}

function montarItensAdm(
  projeto: ProjetoAdministrativo,
  eventos: EventoProjeto[],
  documentos: DocumentosAdm,
  nomes: Record<string, string>,
): ItemLinhaTempo[] {
  const itens: ItemLinhaTempo[] = eventos.map((evento) => ({
    id: `e${evento.id}`,
    quando: evento.realizado_em ?? "",
    tipo: "evento",
    titulo:
      ROTULOS_EVENTO[evento.tipo ?? "CRIACAO"] +
      (evento.status_anterior && evento.status_novo
        ? `: ${ROTULOS_STATUS[evento.status_anterior]} → ${ROTULOS_STATUS[evento.status_novo]}`
        : ""),
    descricao:
      evento.motivo_cancelamento ?? descricaoDetalhesEvento(evento),
    detentor: nomes[evento.realizado_por ?? ""],
  }))

  if (projeto.numero_oc) {
    itens.push({
      id: "doc-oc",
      quando: aoMeioDia(projeto.data_oc ?? ""),
      tipo: "documento",
      titulo: "Ordem de compra",
      descricao: `OC ${projeto.numero_oc}${projeto.centro_custo ? ` — centro de custo ${projeto.centro_custo}` : ""}`,
    })
  }
  if (documentos.autorizadoEm) {
    itens.push({
      id: "doc-autorizacao",
      quando: documentos.autorizadoEm,
      tipo: "documento",
      titulo: "Autorização de faturamento",
    })
  }
  if (documentos.nota) {
    itens.push({
      id: "doc-nota",
      quando: aoMeioDia(documentos.nota.dataEmissao),
      tipo: "documento",
      titulo: `Nota fiscal ${documentos.nota.numero}`,
      descricao: `Valor ${formatarMoeda(documentos.nota.valor)}`,
    })
    if (projeto.previsao_recebimento) {
      itens.push({
        id: "previsao",
        quando: aoMeioDia(projeto.previsao_recebimento),
        tipo: "previsao",
        titulo: "Previsão de recebimento",
        descricao: "Emissão da nota + 30 dias",
      })
    }
  }
  for (const recebimento of documentos.recebimentos) {
    itens.push({
      id: `doc-r${recebimento.id}`,
      quando: aoMeioDia(recebimento.dataRecebimento),
      tipo: "documento",
      titulo: "Recebimento",
      descricao: `Valor ${formatarMoeda(recebimento.valorRecebido)}`,
    })
  }
  return itens
}

function montarItensOperacional(
  eventos: EventoProjeto[],
): ItemLinhaTempo[] {
  return eventos.map((evento) => ({
    id: `e${evento.id}`,
    quando: evento.realizado_em ?? "",
    tipo: "evento",
    titulo:
      ROTULOS_EVENTO[evento.tipo ?? "CRIACAO"] +
      (evento.status_anterior && evento.status_novo
        ? `: ${ROTULOS_STATUS[evento.status_anterior]} → ${ROTULOS_STATUS[evento.status_novo]}`
        : ""),
    descricao: evento.motivo_cancelamento ?? undefined,
  }))
}

function DialogCancelar({
  aberto,
  aoFechar,
  projetoId,
}: {
  aberto: boolean
  aoFechar: () => void
  projetoId: number
}) {
  const [motivo, setMotivo] = useState("")
  const mutacao = useAcaoFluxo(({ motivo }: { motivo: string }) =>
    cancelarProjeto(projetoId, motivo),
  )

  async function submeter() {
    try {
      await mutacao.mutateAsync({ motivo: motivo.trim() })
      toast.success("Projeto cancelado.")
      aoFechar()
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  // Motivo obrigatório validado localmente antes da RPC (spec fluxo-projetos).
  const motivoValido = motivo.trim().length > 0

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar projeto</DialogTitle>
          <DialogDescription>
            O cancelamento é final: o projeto não retorna ao fluxo e não recebe novos documentos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="motivo-cancelamento">Motivo (obrigatório)</Label>
          <Textarea
            id="motivo-cancelamento"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            disabled={!motivoValido || mutacao.isPending}
            onClick={() => void submeter()}
          >
            Cancelar projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogOrdemCompra({
  aberto,
  aoFechar,
  projetoId,
}: {
  aberto: boolean
  aoFechar: () => void
  projetoId: number
}) {
  const [modo, setModo] = useState<"vincular" | "nova">("vincular")
  const [ocId, setOcId] = useState<string>("")
  const [numero, setNumero] = useState("")
  const [data, setData] = useState(HOJE())
  const [centro, setCentro] = useState("")
  const queryClient = useQueryClient()
  // Marcado dentro do mutationFn quando registrar_ordem_compra já sucedeu:
  // se a vinculação falhar depois, a OC precisa aparecer na listagem (design D3).
  const registroFeito = useRef(false)

  const ordens = useQuery({
    queryKey: chavesProjetos.ordensCompra(),
    queryFn: listarOrdensCompra,
    enabled: aberto,
  })

  const mutacao = useAcaoFluxo(
    async (vars: {
      modo: "vincular" | "nova"
      ocId: number
      numero: string
      data: string
      centro: string | null
    }) => {
      let idOc = vars.ocId
      if (vars.modo === "nova") {
        idOc = await registrarOrdemCompra(vars.numero, vars.data, vars.centro)
        registroFeito.current = true
      }
      await vincularOrdemCompra(projetoId, idOc)
    },
  )

  async function submeter() {
    registroFeito.current = false
    try {
      await mutacao.mutateAsync({
        modo,
        ocId: Number(ocId),
        numero: numero.trim(),
        data,
        centro: centro.trim() || null,
      })
      toast.success("Ordem de compra vinculada ao projeto.")
      aoFechar()
    } catch (erro) {
      if (registroFeito.current) {
        void queryClient.invalidateQueries({ queryKey: ["ordens-compra"] })
      }
      toast.error(mensagemDeErro(erro))
    }
  }

  const valido =
    modo === "vincular" ? ocId !== "" : numero.trim() !== "" && data !== ""

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ordem de compra</DialogTitle>
          <DialogDescription>
            Vincule uma OC existente ou registre uma nova e vincule em seguida.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button
            variant={modo === "vincular" ? "default" : "outline"}
            size="sm"
            onClick={() => setModo("vincular")}
          >
            Vincular existente
          </Button>
          <Button
            variant={modo === "nova" ? "default" : "outline"}
            size="sm"
            onClick={() => setModo("nova")}
          >
            Registrar nova
          </Button>
        </div>
        {modo === "vincular" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Ordem de compra</Label>
            <Select value={ocId} onValueChange={setOcId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a OC" />
              </SelectTrigger>
              <SelectContent>
                {(ordens.data ?? []).map((oc) => (
                  <SelectItem key={oc.id ?? ""} value={String(oc.id)}>
                    {oc.numero} — {formatarData(oc.data_oc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="oc-numero">Código</Label>
              <Input id="oc-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="oc-data">Data</Label>
              <Input
                id="oc-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="oc-centro">Centro de custo (opcional)</Label>
              <Input id="oc-centro" value={centro} onChange={(e) => setCentro(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!valido || mutacao.isPending} onClick={() => void submeter()}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogNotaFiscal({
  aberto,
  aoFechar,
  projetoId,
}: {
  aberto: boolean
  aoFechar: () => void
  projetoId: number
}) {
  const [numero, setNumero] = useState("")
  const [data, setData] = useState(HOJE())
  const [valor, setValor] = useState("")
  const mutacao = useAcaoFluxo((vars: { numero: string; data: string; valor: number }) =>
    registrarNotaFiscal(projetoId, vars.numero, vars.data, vars.valor),
  )

  const valorNumerico = Number(valor.replace(",", "."))
  const valido = numero.trim() !== "" && data !== "" && valorNumerico > 0

  async function submeter() {
    try {
      await mutacao.mutateAsync({ numero: numero.trim(), data, valor: valorNumerico })
      toast.success("Nota fiscal registrada.")
      aoFechar()
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar nota fiscal</DialogTitle>
          <DialogDescription>
            Uma nota por projeto. A previsão de recebimento será emissão + 30 dias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nf-numero">Número</Label>
            <Input id="nf-numero" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nf-data">Data de emissão</Label>
            <Input id="nf-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="nf-valor">Valor (R$)</Label>
            <Input
              id="nf-valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!valido || mutacao.isPending} onClick={() => void submeter()}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogRecebimento({
  aberto,
  aoFechar,
  notaId,
  saldo,
}: {
  aberto: boolean
  aoFechar: () => void
  notaId: number
  saldo: number
}) {
  const [data, setData] = useState(HOJE())
  const [valor, setValor] = useState("")
  const mutacao = useAcaoFluxo(
    (vars: { data: string; valor: number }) => registrarRecebimento(notaId, vars.data, vars.valor),
  )

  const valorNumerico = Number(valor.replace(",", "."))
  const valido = data !== "" && valorNumerico > 0

  async function submeter() {
    try {
      await mutacao.mutateAsync({ data, valor: valorNumerico })
      toast.success("Recebimento registrado.")
      aoFechar()
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar recebimento</DialogTitle>
          <DialogDescription>
            Saldo a receber da nota: {formatarMoeda(saldo)}. Recebimentos parciais são permitidos
            até o limite de parcelas do tipo de projeto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-data">Data do recebimento</Label>
            <Input id="rec-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rec-valor">Valor (R$)</Label>
            <Input
              id="rec-valor"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!valido || mutacao.isPending} onClick={() => void submeter()}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface LinhaLote {
  notaFiscalId: string
  data: string
  valor: string
}

function DialogLote({
  aberto,
  aoFechar,
}: {
  aberto: boolean
  aoFechar: () => void
}) {
  const [linhas, setLinhas] = useState<LinhaLote[]>([])

  const mutacao = useAcaoFluxo((itens: ItemRecebimentoLote[]) =>
    confirmarRecebimentosLote(itens),
  )

  // Projetos com nota emitida e saldo em aberto (projeção ADM) alimentam o lote.
  const projetos = useQuery({
    queryKey: chavesProjetos.lista("ADM", filtrosVazios),
    queryFn: () => listarProjetos("ADM", filtrosVazios),
    enabled: aberto,
  })

  const notasDisponiveis = useMemo(
    () =>
      ((projetos.data ?? []) as ProjetoAdministrativo[]).filter(
        (p) => p.nota_fiscal_id !== null && (p.saldo_receber ?? 0) > 0,
      ),
    [projetos.data],
  )

  function adicionarLinha() {
    setLinhas((atual) => [...atual, { notaFiscalId: "", data: HOJE(), valor: "" }])
  }

  function mudarLinha(indice: number, campos: Partial<LinhaLote>) {
    setLinhas((atual) =>
      atual.map((linha, i) => (i === indice ? { ...linha, ...campos } : linha)),
    )
  }

  async function submeter() {
    const itens: ItemRecebimentoLote[] = linhas.map((linha) => ({
      nota_fiscal_id: Number(linha.notaFiscalId),
      data_recebimento: linha.data,
      valor_recebido: Number(linha.valor.replace(",", ".")),
    }))
    try {
      await mutacao.mutateAsync(itens)
      toast.success("Recebimentos do lote confirmados.")
      aoFechar()
    } catch (erro) {
      // Falha integral (spec fluxo-projetos): nada é aplicado.
      toast.error(`Lote não aplicado: ${mensagemDeErro(erro)}`)
    }
  }

  const valido = linhas.every(
    (linha) =>
      linha.notaFiscalId !== "" &&
      linha.data !== "" &&
      Number(linha.valor.replace(",", ".")) > 0,
  )

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar recebimentos em lote</DialogTitle>
          <DialogDescription>
            Operação transacional: se qualquer item falhar, nenhum recebimento é aplicado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {linhas.map((linha, indice) => (
            <div key={indice} className="grid grid-cols-[1fr_auto_auto_auto] items-end gap-2">
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Nota (projeto)</Label>
                <Select
                  value={linha.notaFiscalId}
                  onValueChange={(v) => mudarLinha(indice, { notaFiscalId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {notasDisponiveis.map((p) => (
                      <SelectItem key={p.nota_fiscal_id} value={String(p.nota_fiscal_id)}>
                        {p.codigo_pasta} — nota {p.numero_nota_fiscal} — saldo{" "}
                        {formatarMoeda(p.saldo_receber)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={linha.data}
                  onChange={(e) => mudarLinha(indice, { data: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Valor</Label>
                <Input
                  inputMode="decimal"
                  value={linha.valor}
                  onChange={(e) => mudarLinha(indice, { valor: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remover item"
                onClick={() => setLinhas((atual) => atual.filter((_, i) => i !== indice))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="self-start" onClick={adicionarLinha}>
            Adicionar item
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button
            disabled={linhas.length === 0 || !valido || mutacao.isPending}
            onClick={() => void submeter()}
          >
            Confirmar lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProjetoDetalhe() {
  const parametros = useParams()
  const id = Number(parametros.id)
  const { usuario } = useRouteLoaderData("shell") as SessaoAtual
  const ehAdm = usuario.perfil === "ADM"

  const [cancelando, setCancelando] = useState(false)
  const [ocAberta, setOcAberta] = useState(false)
  const [notaAberta, setNotaAberta] = useState(false)
  const [recebimentoAberto, setRecebimentoAberto] = useState(false)
  const [loteAberto, setLoteAberto] = useState(false)

  const projeto = useQuery({
    queryKey: chavesProjetos.detalhe(usuario.perfil, id),
    queryFn: () => obterProjeto(usuario.perfil, id),
  })
  const eventos = useQuery({
    queryKey: chavesProjetos.eventos(id),
    queryFn: () => listarEventos(id),
  })
  const documentos = useQuery({
    queryKey: chavesProjetos.documentos(id),
    queryFn: () => obterDocumentosAdm(id),
    enabled: ehAdm,
  })
  const nomes = useQuery({
    queryKey: chavesUsuarios.nomes(),
    queryFn: listarNomesUsuarios,
    enabled: ehAdm,
  })

  const mutacaoEnviar = useAcaoFluxo(() => enviarProjeto(id), id)
  const mutacaoFundacao = useAcaoFluxo(
    ({ marcada }: { marcada: boolean }) => definirCompatibilizacaoFundacao(id, marcada),
    id,
  )
  const mutacaoAutorizar = useAcaoFluxo(() => autorizarFaturamento(id), id)

  if (projeto.isPending || eventos.isPending) {
    return <Carregando descricao="Carregando projeto…" />
  }
  if (projeto.isError) {
    return <ErroDeConsulta erro={projeto.error} tentarNovamente={() => void projeto.refetch()} />
  }
  if (!projeto.data) {
    return <SemDados descricao="Projeto não encontrado ou sem acesso para o seu perfil." />
  }

  const p = projeto.data
  const status = (p.status ?? "CADASTRADO") as StatusProjeto
  const cancelado = status === "CANCELADO"
  const adm = p as ProjetoAdministrativo

  async function enviar() {
    try {
      await mutacaoEnviar.mutateAsync(undefined)
      toast.success("Projeto enviado.")
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  async function autorizar() {
    try {
      await mutacaoAutorizar.mutateAsync(undefined)
      toast.success("Faturamento autorizado.")
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  async function alternarFundacao(marcada: boolean) {
    try {
      await mutacaoFundacao.mutateAsync({ marcada })
      toast.success("Compatibilização de fundação atualizada.")
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/projetos">
              <ArrowLeft className="size-4" aria-hidden />
              Projetos
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{p.codigo_pasta}</h1>
            <Badge variant="outline" className={CORES_STATUS[status]}>
              {ROTULOS_STATUS[status]}
            </Badge>
          </div>
        </div>
        {!cancelado ? (
          <div className="flex flex-wrap gap-2">
            {status === "CADASTRADO" ? (
              <>
                <Button size="sm" disabled={mutacaoEnviar.isPending} onClick={() => void enviar()}>
                  Enviar projeto
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setCancelando(true)}>
                  Cancelar projeto
                </Button>
              </>
            ) : null}
            {ehAdm && status === "ENVIADO" ? (
              <Button size="sm" variant="secondary" onClick={() => setOcAberta(true)}>
                Ordem de compra
              </Button>
            ) : null}
            {ehAdm && status === "OC_REGISTRADA" ? (
              <Button
                size="sm"
                variant="secondary"
                disabled={mutacaoAutorizar.isPending}
                onClick={() => void autorizar()}
              >
                Autorizar faturamento
              </Button>
            ) : null}
            {ehAdm && status === "AUTORIZADO_FATURAMENTO" ? (
              <Button size="sm" variant="secondary" onClick={() => setNotaAberta(true)}>
                Registrar nota fiscal
              </Button>
            ) : null}
            {ehAdm && status === "NOTA_EMITIDA" ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => setRecebimentoAberto(true)}>
                  Registrar recebimento
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setLoteAberto(true)}>
                  Lote de recebimentos
                </Button>
              </>
            ) : null}
          </div>
        ) : (
          <Badge variant="outline" className={CORES_STATUS.CANCELADO}>
            Projeto cancelado — sem ações de fluxo
          </Badge>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Dados do projeto</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm md:grid-cols-3">
            <Campo rotulo="Cliente" valor={p.cliente ?? "—"} />
            <Campo rotulo="Identificador do cliente" valor={p.identificador_cliente ?? "—"} />
            <Campo rotulo="Operadora" valor={p.operadora ?? "—"} />
            <Campo rotulo="Identificador da operadora" valor={p.identificador_operadora ?? "—"} />
            <Campo rotulo="Tipo de projeto" valor={p.tipo_projeto ?? "—"} />
            <Campo rotulo="Cidade / UF" valor={`${p.cidade ?? "—"} / ${p.uf ?? "—"}`} />
            <Campo rotulo="Data de envio" valor={formatarData(p.data_envio)} />
            <Campo rotulo="Criado em" valor={formatarDataHora(p.criado_em)} />
            <Campo
              rotulo="Fundação compatibilizada"
              valor={p.fundacao_compatibilizada ? "Sim" : "Não"}
            />
            {ehAdm ? (
              <div className="col-span-2 flex items-center gap-3 md:col-span-3">
                <Switch
                  id="fundacao"
                  checked={adm.fundacao_compatibilizada ?? false}
                  disabled={cancelado}
                  onCheckedChange={(marcado) => void alternarFundacao(marcado)}
                />
                <Label htmlFor="fundacao" className="text-muted-foreground">
                  Compatibilização de fundação (alteração auditada)
                </Label>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {ehAdm ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financeiro</CardTitle>
              <CardDescription>Nota, recebimentos e previsão.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              {adm.numero_nota_fiscal ? (
                <LinhaFinanceira
                  rotulo="Número da nota"
                  valor={`${adm.numero_nota_fiscal} (${formatarData(adm.data_emissao)})`}
                />
              ) : null}
              <LinhaFinanceira rotulo="Valor da nota" valor={formatarMoeda(adm.valor_nota)} />
              <LinhaFinanceira rotulo="Recebido" valor={formatarMoeda(adm.valor_recebido)} />
              <LinhaFinanceira rotulo="Saldo a receber" valor={formatarMoeda(adm.saldo_receber)} />
              <LinhaFinanceira
                rotulo="Previsão de recebimento"
                valor={formatarData(adm.previsao_recebimento)}
              />
              {adm.numero_oc ? (
                <LinhaFinanceira
                  rotulo="Ordem de compra"
                  valor={`${adm.numero_oc} (${formatarData(adm.data_oc)})`}
                />
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo</CardTitle>
          <CardDescription>
            {ehAdm
              ? "Eventos e documentos em ordem cronológica."
              : "Eventos operacionais em ordem cronológica."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventos.isError ? (
            <ErroDeConsulta erro={eventos.error} tentarNovamente={() => void eventos.refetch()} />
          ) : documentos.isError ? (
            <ErroDeConsulta
              erro={documentos.error}
              tentarNovamente={() => void documentos.refetch()}
            />
          ) : documentos.isPending && ehAdm ? (
            <Carregando descricao="Carregando documentos…" />
          ) : (
            (() => {
              const itens = ehAdm
                ? montarItensAdm(adm, eventos.data ?? [], documentos.data ?? { autorizadoEm: null, nota: null, recebimentos: [] }, nomes.data ?? {})
                : montarItensOperacional(eventos.data ?? [])
              if (itens.length === 0) {
                return <p className="py-6 text-center text-sm text-muted-foreground">Nenhum evento registrado.</p>
              }
              return <LinhaTempo itens={itens} />
            })()
          )}
        </CardContent>
      </Card>

      <DialogCancelar
        aberto={cancelando}
        aoFechar={() => setCancelando(false)}
        projetoId={id}
      />
      {ehAdm ? (
        <>
          <DialogOrdemCompra aberto={ocAberta} aoFechar={() => setOcAberta(false)} projetoId={id} />
          <DialogNotaFiscal aberto={notaAberta} aoFechar={() => setNotaAberta(false)} projetoId={id} />
          {adm.nota_fiscal_id ? (
            <DialogRecebimento
              aberto={recebimentoAberto}
              aoFechar={() => setRecebimentoAberto(false)}
              notaId={adm.nota_fiscal_id}
              saldo={adm.saldo_receber ?? 0}
            />
          ) : null}
          <DialogLote aberto={loteAberto} aoFechar={() => setLoteAberto(false)} />
        </>
      ) : null}
    </div>
  )
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="font-medium">{valor}</p>
    </div>
  )
}

function LinhaFinanceira({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="font-medium">{valor}</span>
    </div>
  )
}
