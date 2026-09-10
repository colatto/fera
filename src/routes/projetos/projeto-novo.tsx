import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { mensagemDeErro } from "@/lib/formato"
import { criarProjeto, invalidarAposFluxo, type ParametrosCriacao } from "@/queries/fluxo"
import {
  chavesProjetos,
  filtrosVazios,
  listarProjetos,
  obterProjeto,
} from "@/queries/projetos"
import {
  apenasAtivos,
  chavesCadastros,
  listarClientes,
  listarOperadoras,
  listarTipos,
} from "@/queries/cadastros"
import { chavesUsuarios, listarUsuariosAtivos } from "@/queries/usuarios"

const SEM_PREDECESSOR = "__sem__"

export function ProjetoNovo() {
  const queryClient = useQueryClient()

  const [tipoId, setTipoId] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [identificadorCliente, setIdentificadorCliente] = useState("")
  const [operadoraId, setOperadoraId] = useState("")
  const [identificadorOperadora, setIdentificadorOperadora] = useState("")
  const [cidade, setCidade] = useState("")
  const [uf, setUf] = useState("")
  const [valor, setValor] = useState("")
  const [responsavelId, setResponsavelId] = useState("")
  const [predecessorId, setPredecessorId] = useState(SEM_PREDECESSOR)
  const [processando, setProcessando] = useState(false)
  const [codigoCriado, setCodigoCriado] = useState<string | null>(null)

  // Somente cadastros ativos podem ser selecionados (spec cadastros-basicos).
  const tipos = useQuery({ queryKey: chavesCadastros.tipos(), queryFn: listarTipos })
  const clientes = useQuery({ queryKey: chavesCadastros.clientes(), queryFn: listarClientes })
  const operadoras = useQuery({ queryKey: chavesCadastros.operadoras(), queryFn: listarOperadoras })
  const responsaveis = useQuery({
    queryKey: chavesUsuarios.ativos(),
    queryFn: listarUsuariosAtivos,
  })
  // Predecessor: projeto cancelado (validação do banco) — lista limitada a cancelados.
  const cancelados = useQuery({
    queryKey: chavesProjetos.lista("ADM", { ...filtrosVazios, status: "CANCELADO" }),
    queryFn: () => listarProjetos("ADM", { ...filtrosVazios, status: "CANCELADO" }),
  })

  // Valor obrigatório e positivo, validado localmente antes da RPC (spec fluxo-projetos).
  const valorNumerico = Number(valor.replace(",", "."))
  const valido = useMemo(
    () =>
      tipoId !== "" &&
      clienteId !== "" &&
      identificadorCliente.trim() !== "" &&
      operadoraId !== "" &&
      identificadorOperadora.trim() !== "" &&
      cidade.trim() !== "" &&
      /^[A-Z]{2}$/.test(uf.trim()) &&
      valorNumerico > 0 &&
      responsavelId !== "",
    [tipoId, clienteId, identificadorCliente, operadoraId, identificadorOperadora, cidade, uf, valorNumerico, responsavelId],
  )

  async function submeter() {
    setProcessando(true)
    const parametros: ParametrosCriacao = {
      p_tipo_id: Number(tipoId),
      p_cliente_id: Number(clienteId),
      p_identificador_cliente: identificadorCliente.trim(),
      p_operadora_id: Number(operadoraId),
      p_identificador_operadora: identificadorOperadora.trim(),
      p_cidade: cidade.trim(),
      p_uf: uf.trim().toUpperCase(),
      p_valor: valorNumerico,
      p_responsavel_id: responsavelId,
    }
    if (predecessorId !== SEM_PREDECESSOR) parametros.p_anterior_id = Number(predecessorId)
    try {
      const idCriado = await criarProjeto(parametros)
      // Código F-AAAA-NNNN gerado pelo banco — exibido após a confirmação.
      const criado = await obterProjeto("ADM", Number(idCriado))
      invalidarAposFluxo(queryClient)
      setCodigoCriado(criado?.codigo_pasta ?? `#${idCriado}`)
    } catch (erro) {
      toast.error(mensagemDeErro(erro))
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link to="/projetos">
            <ArrowLeft className="size-4" aria-hidden />
            Projetos
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Novo projeto</h1>
        <p className="text-sm text-muted-foreground">
          O código F-AAAA-NNNN é reservado pelo banco na confirmação.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do projeto</CardTitle>
          <CardDescription>Somente cadastros ativos são selecionáveis.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label>Tipo de projeto</Label>
            <Select value={tipoId} onValueChange={setTipoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {apenasAtivos(tipos.data ?? []).map((tipo) => (
                  <SelectItem key={tipo.id} value={String(tipo.id)}>
                    {tipo.nome} — próximo número {tipo.proximo_numero}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {apenasAtivos(clientes.data ?? []).map((cliente) => (
                  <SelectItem key={cliente.id} value={String(cliente.id)}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ident-cliente">Identificador do cliente</Label>
            <Input
              id="ident-cliente"
              value={identificadorCliente}
              onChange={(e) => setIdentificadorCliente(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Operadora</Label>
            <Select value={operadoraId} onValueChange={setOperadoraId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {apenasAtivos(operadoras.data ?? []).map((operadora) => (
                  <SelectItem key={operadora.id} value={String(operadora.id)}>
                    {operadora.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ident-operadora">Identificador da operadora</Label>
            <Input
              id="ident-operadora"
              value={identificadorOperadora}
              onChange={(e) => setIdentificadorOperadora(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              maxLength={2}
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="valor-projeto">Valor (R$)</Label>
            <Input
              id="valor-projeto"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Responsável interno</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {(responsaveis.data ?? []).map((resp) => (
                  <SelectItem key={resp.id} value={resp.id}>
                    {resp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Projeto predecessor (opcional)</Label>
            <Select value={predecessorId} onValueChange={setPredecessorId}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_PREDECESSOR}>Nenhum</SelectItem>
                {((cancelados.data ?? []) as { id: number | null; codigo_pasta: string | null }[]).map(
                  (projeto) => (
                    <SelectItem key={projeto.id} value={String(projeto.id)}>
                      {projeto.codigo_pasta}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={!valido || processando} onClick={() => void submeter()}>
            Criar projeto
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={codigoCriado !== null} onOpenChange={(v) => !v && setCodigoCriado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projeto criado</DialogTitle>
            <DialogDescription>
              Código reservado: <span className="font-mono font-semibold">{codigoCriado}</span>.
              O projeto consta na listagem com status cadastrado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button asChild>
              <Link to="/projetos">Ir para a listagem</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
