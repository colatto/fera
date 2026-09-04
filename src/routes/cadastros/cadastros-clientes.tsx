import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Carregando, ErroDeConsulta, Vazio } from "@/components/estados"
import { mensagemDeErro } from "@/lib/formato"
import {
  alterarSituacaoCliente,
  atualizarCliente,
  chavesCadastros,
  inserirCliente,
  listarClientes,
  type Cliente,
} from "@/queries/cadastros"

// CNPJ opcional, somente dígitos (spec cadastros-basicos): pontuação é bloqueada
// localmente antes de qualquer chamada ao banco.
const apenasDigitosCnpj = (valor: string) => /^\d{0,14}$/.test(valor)

function validarCliente(nome: string, cnpj: string): string | null {
  if (!nome.trim()) return "Informe o nome do cliente."
  if (cnpj.length > 0 && cnpj.length !== 14) return "O CNPJ deve ter exatamente 14 dígitos."
  return null
}

function DialogCliente({
  aberto,
  aoFechar,
  edicao,
}: {
  aberto: boolean
  aoFechar: () => void
  edicao: Cliente | null
}) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState(edicao?.nome ?? "")
  const [cnpj, setCnpj] = useState(edicao?.cnpj ?? "")

  const mutacao = useMutation({
    mutationFn: async () => {
      const valores = { nome: nome.trim(), cnpj: cnpj === "" ? null : cnpj }
      if (edicao) await atualizarCliente(edicao.id, valores)
      else await inserirCliente(valores)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(edicao ? "Cliente atualizado." : "Cliente criado.")
      aoFechar()
    },
    // Restrições do banco (unicidade de CNPJ/nome, formato) chegam aqui e são exibidas.
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  const erroLocal = validarCliente(nome, cnpj)

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>
            Nome obrigatório. CNPJ opcional com 14 dígitos, sem pontuação.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-nome">Nome</Label>
            <Input id="cliente-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cliente-cnpj">CNPJ (opcional)</Label>
            <Input
              id="cliente-cnpj"
              inputMode="numeric"
              value={cnpj}
              placeholder="Somente 14 dígitos"
              onChange={(e) => {
                if (apenasDigitosCnpj(e.target.value)) setCnpj(e.target.value)
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button
            disabled={erroLocal !== null || mutacao.isPending}
            onClick={() => mutacao.mutate()}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Clientes() {
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: chavesCadastros.clientes(), queryFn: listarClientes })
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [edicao, setEdicao] = useState<Cliente | null>(null)

  // Inativação/reativação — não existe ação de exclusão física (spec cadastros-basicos).
  const mutacaoSituacao = useMutation({
    mutationFn: ({ cliente, ativo }: { cliente: Cliente; ativo: boolean }) =>
      alterarSituacaoCliente(cliente.id, ativo),
    onSuccess: (_dados, { ativo }) => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(ativo ? "Cliente reativado." : "Cliente inativado.")
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  function abrirNovo() {
    setEdicao(null)
    setDialogoAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setEdicao(cliente)
    setDialogoAberto(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            Manutenção de clientes — ativos selecionáveis para novos projetos.
          </p>
        </div>
        <Button size="sm" onClick={abrirNovo}>
          Novo cliente
        </Button>
      </div>

      {consulta.isPending ? (
        <Carregando descricao="Carregando clientes…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (consulta.data ?? []).length === 0 ? (
        <Vazio titulo="Nenhum cliente" descricao="Cadastre o primeiro cliente." />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.cnpj ?? "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          cliente.ativo
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {cliente.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEdicao(cliente)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={mutacaoSituacao.isPending}
                          onClick={() =>
                            mutacaoSituacao.mutate({ cliente, ativo: !cliente.ativo })
                          }
                        >
                          {cliente.ativo ? "Inativar" : "Reativar"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {dialogoAberto ? (
        <DialogCliente
          aberto={dialogoAberto}
          edicao={edicao}
          aoFechar={() => setDialogoAberto(false)}
        />
      ) : null}
    </div>
  )
}
