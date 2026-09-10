import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useRouteLoaderData } from "react-router"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, FunnelX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Carregando, ErroDeConsulta, Vazio } from "@/components/estados"
import { useQuery } from "@tanstack/react-query"
import type { SessaoAtual } from "@/lib/auth"
import { CORES_STATUS, ROTULOS_STATUS, type StatusProjeto } from "@/lib/constantes"
import { baixarCsv, formatarData, formatarMoeda } from "@/lib/formato"
import {
  chavesProjetos,
  filtrosAtivos,
  filtrosVazios,
  listarProjetos,
  type FiltrosProjetos,
  type ProjetoAdministrativo,
  type ProjetoOperacional,
} from "@/queries/projetos"
import { chavesCadastros, listarClientes, listarOperadoras, listarTipos } from "@/queries/cadastros"

function useDebounce<T>(valor: T, milissegundos: number): T {
  const [atrasado, setAtrasado] = useState(valor)
  useEffect(() => {
    const tempo = setTimeout(() => setAtrasado(valor), milissegundos)
    return () => clearTimeout(tempo)
  }, [valor, milissegundos])
  return atrasado
}

function colunaTexto(
  acessor: (linha: LinhaProjeto) => string | null | undefined,
  cabecalho: string,
  celula?: (valor: string | null | undefined) => string,
): ColumnDef<LinhaProjeto> {
  return {
    accessorFn: (linha) => acessor(linha) ?? "",
    id: cabecalho,
    header: cabecalho,
    cell: (info) => (celula ? celula(info.getValue() as string) : info.getValue<string>() || "—"),
  }
}

const TODOS = "__todos__"

function FiltroSelect({
  rotulo,
  valor,
  aoMudar,
  opcoes,
}: {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  opcoes: string[]
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{rotulo}</Label>
      <Select
        value={valor || TODOS}
        onValueChange={(v) => aoMudar(v === TODOS ? "" : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos</SelectItem>
          {opcoes.map((opcao) => (
            <SelectItem key={opcao} value={opcao}>
              {opcao}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FiltroTexto({
  rotulo,
  valor,
  aoMudar,
  tamanhoMaximo,
}: {
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  tamanhoMaximo?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{rotulo}</Label>
      <Input
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        maxLength={tamanhoMaximo}
        className="h-9"
      />
    </div>
  )
}

type LinhaProjeto = ProjetoOperacional | ProjetoAdministrativo

function colunasOperacionais(): ColumnDef<LinhaProjeto>[] {
  return [
    colunaTexto((l) => l.codigo_pasta, "Código"),
    {
      accessorFn: (l) => l.status ?? "",
      id: "Status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue<StatusProjeto>()
        return (
          <Badge variant="outline" className={CORES_STATUS[status]}>
            {ROTULOS_STATUS[status]}
          </Badge>
        )
      },
    },
    colunaTexto((l) => l.cliente, "Cliente"),
    colunaTexto((l) => l.identificador_cliente, "Ident. cliente"),
    colunaTexto((l) => l.operadora, "Operadora"),
    colunaTexto((l) => l.identificador_operadora, "Ident. operadora"),
    colunaTexto((l) => l.tipo_projeto, "Tipo"),
    colunaTexto((l) => l.cidade, "Cidade"),
    colunaTexto((l) => l.uf, "UF"),
    colunaTexto((l) => l.data_envio, "Envio", formatarData),
  ]
}

const comoAdm = (linha: LinhaProjeto) => linha as ProjetoAdministrativo

function colunasAdministrativas(): ColumnDef<LinhaProjeto>[] {
  return [
    colunaTexto((l) => l.codigo_pasta, "Código"),
    {
      accessorFn: (l) => l.status ?? "",
      id: "Status",
      header: "Status",
      cell: (info) => {
        const status = info.getValue<StatusProjeto>()
        return (
          <Badge variant="outline" className={CORES_STATUS[status]}>
            {ROTULOS_STATUS[status]}
          </Badge>
        )
      },
    },
    colunaTexto((l) => l.cliente, "Cliente"),
    colunaTexto((l) => l.identificador_cliente, "Ident. cliente"),
    colunaTexto((l) => l.operadora, "Operadora"),
    colunaTexto((l) => l.identificador_operadora, "Ident. operadora"),
    colunaTexto((l) => l.tipo_projeto, "Tipo"),
    colunaTexto((l) => l.cidade, "Cidade"),
    colunaTexto((l) => l.uf, "UF"),
    colunaTexto((l) => l.data_envio, "Envio", formatarData),
    {
      accessorFn: (l) => comoAdm(l).valor ?? 0,
      id: "Valor",
      header: "Valor",
      cell: (info) => formatarMoeda(info.getValue<number>()),
    },
    colunaTexto((l) => comoAdm(l).numero_oc, "OC"),
    colunaTexto((l) => comoAdm(l).data_oc, "Data OC", formatarData),
    colunaTexto((l) => comoAdm(l).numero_nota_fiscal, "Nota fiscal"),
    colunaTexto((l) => comoAdm(l).data_emissao, "Emissão", formatarData),
    {
      accessorFn: (l) => comoAdm(l).valor_nota ?? 0,
      id: "Valor nota",
      header: "Valor nota",
      cell: (info) => formatarMoeda(info.getValue<number>()),
    },
    {
      accessorFn: (l) => comoAdm(l).valor_recebido ?? 0,
      id: "Valor recebido",
      header: "Recebido",
      cell: (info) => formatarMoeda(info.getValue<number>()),
    },
    {
      accessorFn: (l) => comoAdm(l).saldo_receber ?? 0,
      id: "Saldo",
      header: "Saldo a receber",
      cell: (info) => formatarMoeda(info.getValue<number>()),
    },
    colunaTexto((l) => comoAdm(l).previsao_recebimento, "Previsão", formatarData),
  ]
}

function exportarConsulta(
  perfil: "ADM" | "OPER",
  linhas: LinhaProjeto[],
): void {
  const colunas =
    perfil === "ADM"
      ? [
          "Código", "Status", "Cliente", "Identificador cliente", "Operadora",
          "Identificador operadora", "Tipo", "Cidade", "UF", "Data de envio",
          "Valor do projeto", "OC", "Data OC", "Centro de custo", "Nota fiscal", "Data de emissão",
          "Valor da nota", "Valor recebido", "Saldo a receber", "Previsão de recebimento",
        ]
      : [
          "Código", "Status", "Cliente", "Identificador cliente", "Operadora",
          "Identificador operadora", "Tipo", "Cidade", "UF", "Data de envio",
        ]
  const conteudo = linhas.map((linha) =>
    perfil === "ADM"
      ? linhaToCsvAdm(linha as ProjetoAdministrativo)
      : linhaToCsvOper(linha as ProjetoOperacional),
  )
  baixarCsv(
    `projetos-${new Date().toISOString().slice(0, 10)}.csv`,
    colunas,
    conteudo,
  )
}

function linhaToCsvOper(l: ProjetoOperacional): string[] {
  return [
    l.codigo_pasta ?? "", ROTULOS_STATUS[l.status ?? "CADASTRADO"], l.cliente ?? "",
    l.identificador_cliente ?? "", l.operadora ?? "", l.identificador_operadora ?? "",
    l.tipo_projeto ?? "", l.cidade ?? "", l.uf ?? "", formatarData(l.data_envio),
  ]
}

function linhaToCsvAdm(l: ProjetoAdministrativo): string[] {
  return [
    ...linhaToCsvOper(l),
    l.valor?.toFixed(2).replace(".", ",") ?? "",
    l.numero_oc ?? "", formatarData(l.data_oc), l.centro_custo ?? "",
    l.numero_nota_fiscal ?? "", formatarData(l.data_emissao),
    l.valor_nota?.toFixed(2).replace(".", ",") ?? "",
    l.valor_recebido?.toFixed(2).replace(".", ",") ?? "",
    l.saldo_receber?.toFixed(2).replace(".", ",") ?? "",
    formatarData(l.previsao_recebimento),
  ]
}

const TAMANHO_PAGINA = 15

export function ProjetosListar() {
  const { usuario } = useRouteLoaderData("shell") as SessaoAtual
  const ehAdm = usuario.perfil === "ADM"
  const navegar = useNavigate()

  const [filtros, setFiltros] = useState<FiltrosProjetos>(filtrosVazios)
  const filtrosAplicados = useDebounce(filtros, 300)
  const [ordenacao, setOrdenacao] = useState<SortingState>([])

  const consulta = useQuery({
    queryKey: chavesProjetos.lista(usuario.perfil, filtrosAplicados),
    queryFn: () => listarProjetos(usuario.perfil, filtrosAplicados),
  })

  const clientes = useQuery({ queryKey: chavesCadastros.clientes(), queryFn: listarClientes })
  const operadoras = useQuery({ queryKey: chavesCadastros.operadoras(), queryFn: listarOperadoras })
  const tipos = useQuery({ queryKey: chavesCadastros.tipos(), queryFn: listarTipos })

  const dados = useMemo(() => consulta.data ?? [], [consulta.data])
  const colunas = useMemo<ColumnDef<LinhaProjeto>[]>(
    () => (ehAdm ? colunasAdministrativas() : colunasOperacionais()),
    [ehAdm],
  )

  const tabela = useReactTable({
    data: dados as LinhaProjeto[],
    columns: colunas,
    state: { sorting: ordenacao },
    onSortingChange: setOrdenacao,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: TAMANHO_PAGINA } },
  })

  function mudarFiltro<K extends keyof FiltrosProjetos>(campo: K, valor: FiltrosProjetos[K]) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }))
  }

  const semFiltros = !filtrosAtivos(filtrosAplicados)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Consulta de projetos do fluxo Fera.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={dados.length === 0}
            onClick={() => exportarConsulta(usuario.perfil, tabela.getSortedRowModel().rows.map((r) => r.original))}
          >
            <Download className="size-4" aria-hidden />
            Exportar CSV
          </Button>
          {ehAdm ? (
            <Button asChild size="sm">
              <Link to="/projetos/novo">Novo projeto</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <Card>
        <CardContent className="relative">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5 lg:grid-cols-9">
            <FiltroTexto rotulo="Código" valor={filtros.codigo} aoMudar={(v) => mudarFiltro("codigo", v)} />
            <FiltroSelect
              rotulo="Cliente"
              valor={filtros.cliente}
              aoMudar={(v) => mudarFiltro("cliente", v)}
              opcoes={(clientes.data ?? []).map((c) => c.nome)}
            />
            <FiltroTexto
              rotulo="Ident. cliente"
              valor={filtros.identificadorCliente}
              aoMudar={(v) => mudarFiltro("identificadorCliente", v)}
            />
            <FiltroSelect
              rotulo="Operadora"
              valor={filtros.operadora}
              aoMudar={(v) => mudarFiltro("operadora", v)}
              opcoes={(operadoras.data ?? []).map((o) => o.nome)}
            />
            <FiltroTexto
              rotulo="Ident. operadora"
              valor={filtros.identificadorOperadora}
              aoMudar={(v) => mudarFiltro("identificadorOperadora", v)}
            />
            <FiltroTexto rotulo="Cidade" valor={filtros.cidade} aoMudar={(v) => mudarFiltro("cidade", v)} />
            <FiltroTexto
              rotulo="UF"
              valor={filtros.uf}
              aoMudar={(v) => mudarFiltro("uf", v.toUpperCase())}
              tamanhoMaximo={2}
            />
            <FiltroSelect
              rotulo="Tipo"
              valor={filtros.tipo}
              aoMudar={(v) => mudarFiltro("tipo", v)}
              opcoes={(tipos.data ?? []).map((t) => t.nome)}
            />
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={filtros.status || TODOS}
                onValueChange={(v) => mudarFiltro("status", v === TODOS ? "" : (v as StatusProjeto))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {Object.entries(ROTULOS_STATUS).map(([valor, rotulo]) => (
                    <SelectItem key={valor} value={valor}>
                      {rotulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {!semFiltros ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => setFiltros(filtrosVazios)}
            >
              <FunnelX className="size-4" aria-hidden />
              Limpar filtros
            </Button>
          ) : null}
        </CardContent>
      </Card>

      {consulta.isPending ? (
        <Carregando descricao="Consultando projetos…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : dados.length === 0 ? (
        <Vazio
          titulo={semFiltros ? "Nenhum projeto" : "Nenhum projeto encontrado"}
          descricao={
            semFiltros
              ? "Ainda não há projetos na consulta deste perfil."
              : "Nenhum projeto atende aos filtros aplicados. Ajuste ou limpe os filtros."
          }
        />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                {tabela.getHeaderGroups().map((grupo) => (
                  <TableRow key={grupo.id} className="hover:bg-transparent">
                    {grupo.headers.map((cabecalho) => (
                      <TableHead key={cabecalho.id}>
                        <button
                          type="button"
                          className="flex items-center gap-1 hover:text-foreground"
                          onClick={cabecalho.column.getToggleSortingHandler()}
                        >
                          {flexRender(cabecalho.column.columnDef.header, cabecalho.getContext())}
                          {cabecalho.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : cabecalho.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="size-3" aria-hidden />
                          ) : null}
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {tabela.getRowModel().rows.map((linha) => (
                  <TableRow
                    key={linha.id}
                    className="cursor-pointer"
                    onClick={() => navegar(`/projetos/${linha.original.id}`)}
                  >
                    {linha.getVisibleCells().map((celula) => (
                      <TableCell key={celula.id}>
                        {flexRender(celula.column.columnDef.cell, celula.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
              <span>
                {dados.length} projeto(s) — página {tabela.getState().pagination.pageIndex + 1} de{" "}
                {tabela.getPageCount() || 1}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!tabela.getCanPreviousPage()}
                  onClick={() => tabela.previousPage()}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={!tabela.getCanNextPage()}
                  onClick={() => tabela.nextPage()}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
