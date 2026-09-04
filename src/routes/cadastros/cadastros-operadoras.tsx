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
  alterarSituacaoOperadora,
  atualizarOperadora,
  chavesCadastros,
  inserirOperadora,
  listarOperadoras,
  type Operadora,
} from "@/queries/cadastros"

function DialogOperadora({
  aberto,
  aoFechar,
  edicao,
}: {
  aberto: boolean
  aoFechar: () => void
  edicao: Operadora | null
}) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState(edicao?.nome ?? "")

  const mutacao = useMutation({
    mutationFn: async () => {
      if (edicao) await atualizarOperadora(edicao.id, nome.trim())
      else await inserirOperadora(nome.trim())
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(edicao ? "Operadora atualizada." : "Operadora criada.")
      aoFechar()
    },
    // Nome duplicado → unicidade do banco exibida (spec cadastros-basicos).
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? "Editar operadora" : "Nova operadora"}</DialogTitle>
          <DialogDescription>Nome obrigatório e único no sistema.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="operadora-nome">Nome</Label>
          <Input
            id="operadora-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!nome.trim() || mutacao.isPending} onClick={() => mutacao.mutate()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Operadoras() {
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: chavesCadastros.operadoras(), queryFn: listarOperadoras })
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [edicao, setEdicao] = useState<Operadora | null>(null)

  const mutacaoSituacao = useMutation({
    mutationFn: ({ operadora, ativo }: { operadora: Operadora; ativo: boolean }) =>
      alterarSituacaoOperadora(operadora.id, ativo),
    onSuccess: (_dados, { ativo }) => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(ativo ? "Operadora reativada." : "Operadora inativada.")
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Operadoras</h1>
          <p className="text-sm text-muted-foreground">
            Manutenção de operadoras — ativas selecionáveis para novos projetos.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEdicao(null)
            setDialogoAberto(true)
          }}
        >
          Nova operadora
        </Button>
      </div>

      {consulta.isPending ? (
        <Carregando descricao="Carregando operadoras…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (consulta.data ?? []).length === 0 ? (
        <Vazio titulo="Nenhuma operadora" descricao="Cadastre a primeira operadora." />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((operadora) => (
                  <TableRow key={operadora.id}>
                    <TableCell className="font-medium">{operadora.nome}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          operadora.ativo
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {operadora.ativo ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEdicao(operadora)
                            setDialogoAberto(true)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={mutacaoSituacao.isPending}
                          onClick={() =>
                            mutacaoSituacao.mutate({ operadora, ativo: !operadora.ativo })
                          }
                        >
                          {operadora.ativo ? "Inativar" : "Reativar"}
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
        <DialogOperadora
          aberto={dialogoAberto}
          edicao={edicao}
          aoFechar={() => setDialogoAberto(false)}
        />
      ) : null}
    </div>
  )
}
