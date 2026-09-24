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
import { mensagemDeErro } from "@/lib/formato"
import {
  alterarSituacaoTipoProjeto,
  atualizarTipoProjeto,
  chavesCadastros,
  inserirTipoProjeto,
  listarTipos,
  type TipoProjeto,
  type ValoresTipoProjeto,
} from "@/queries/cadastros"

// Regras locais do formulário (spec cadastros-basicos), espelhando as constraints
// do banco: nome obrigatório, limite de parcelas mínimo 1 e Torre com limite
// entre 1 e 3. A numeração dos projetos é sequencial anual e independe do tipo.
function validarTipo(valores: ValoresTipoProjeto): string | null {
  if (!valores.nome.trim()) return "Informe o nome do tipo."
  if (valores.limite_parcelas < 1) return "O limite de parcelas deve ser no mínimo 1."
  if (valores.nome.trim().toLowerCase() === "torre" && (valores.limite_parcelas > 3 || valores.limite_parcelas < 1))
    return "O tipo Torre deve ter limite de parcelas entre 1 e 3."
  return null
}

function DialogTipo({
  aberto,
  aoFechar,
  edicao,
}: {
  aberto: boolean
  aoFechar: () => void
  edicao: TipoProjeto | null
}) {
  const queryClient = useQueryClient()
  const [valores, setValores] = useState<ValoresTipoProjeto>({
    nome: edicao?.nome ?? "",
    limite_parcelas: edicao?.limite_parcelas ?? 1,
  })

  function mudar<K extends keyof ValoresTipoProjeto>(campo: K, valor: ValoresTipoProjeto[K]) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
  }

  const mutacao = useMutation({
    mutationFn: async () => {
      const limpos: ValoresTipoProjeto = { ...valores, nome: valores.nome.trim() }
      if (edicao) await atualizarTipoProjeto(edicao.id, limpos)
      else await inserirTipoProjeto(limpos)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(edicao ? "Tipo de projeto atualizado." : "Tipo de projeto criado.")
      aoFechar()
    },
    // Unicidade de nome e demais restrições chegam do banco.
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  const erroLocal = validarTipo(valores)

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{edicao ? "Editar tipo de projeto" : "Novo tipo de projeto"}</DialogTitle>
          <DialogDescription>
            O tipo Torre exige limite de parcelas entre 1 e 3.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="tipo-nome">Nome</Label>
            <Input
              id="tipo-nome"
              value={valores.nome}
              onChange={(e) => mudar("nome", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo-parcelas">Limite de parcelas</Label>
            {valores.nome.trim().toLowerCase() === "torre" ? (
              // Torre: select restrito a 1–3 (espelha a constraint do banco). Sem
              // reset de valor: se o valor atual está fora de 1–3 (ex.: rename
              // para Torre com 5), o select fica sem opção e a validação bloqueia.
              <Select
                value={String(valores.limite_parcelas)}
                onValueChange={(v) => mudar("limite_parcelas", Number(v))}
              >
                <SelectTrigger id="tipo-parcelas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="tipo-parcelas"
                type="number"
                min={1}
                value={valores.limite_parcelas}
                onChange={(e) => mudar("limite_parcelas", Number(e.target.value))}
              />
            )}
          </div>
        </div>
        {erroLocal ? <p className="text-sm text-destructive">{erroLocal}</p> : null}
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

export function TiposProjeto() {
  const queryClient = useQueryClient()
  const consulta = useQuery({ queryKey: chavesCadastros.tipos(), queryFn: listarTipos })
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [edicao, setEdicao] = useState<TipoProjeto | null>(null)

  const mutacaoSituacao = useMutation({
    mutationFn: ({ tipo, ativo }: { tipo: TipoProjeto; ativo: boolean }) =>
      alterarSituacaoTipoProjeto(tipo.id, ativo),
    onSuccess: (_dados, { ativo }) => {
      void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
      toast.success(ativo ? "Tipo reativado." : "Tipo inativado.")
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tipos de projeto</h1>
          <p className="text-sm text-muted-foreground">
            Tipos usados nos códigos F-AAAA-NNNN dos projetos.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEdicao(null)
            setDialogoAberto(true)
          }}
        >
          Novo tipo
        </Button>
      </div>

      {consulta.isPending ? (
        <Carregando descricao="Carregando tipos…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (consulta.data ?? []).length === 0 ? (
        <Vazio titulo="Nenhum tipo" descricao="Cadastre o primeiro tipo de projeto." />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((tipo) => (
                  <TableRow key={tipo.id}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>{tipo.limite_parcelas}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tipo.ativo
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {tipo.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEdicao(tipo)
                            setDialogoAberto(true)
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={mutacaoSituacao.isPending}
                          onClick={() => mutacaoSituacao.mutate({ tipo, ativo: !tipo.ativo })}
                        >
                          {tipo.ativo ? "Inativar" : "Reativar"}
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
        <DialogTipo
          aberto={dialogoAberto}
          edicao={edicao}
          aoFechar={() => setDialogoAberto(false)}
        />
      ) : null}
    </div>
  )
}
