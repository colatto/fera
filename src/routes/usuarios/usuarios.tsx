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
import { ROTULOS_PERFIL } from "@/lib/constantes"
import {
  alterarUsuario,
  criarUsuario,
  inativarUsuario,
  mensagemErroFuncao,
  reativarUsuario,
  redefinirSenha,
} from "@/lib/adminUsuarios"
import {
  chavesUsuarios,
  invalidarUsuarios,
  listarUsuariosManutencao,
  type UsuarioManutencao,
} from "@/queries/usuarios"

type Perfil = "ADM" | "OPER"

const SENHA_MINIMA = 6

function DialogNovoUsuario({
  aberto,
  aoFechar,
}: {
  aberto: boolean
  aoFechar: () => void
}) {
  const queryClient = useQueryClient()
  const [perfil, setPerfil] = useState<Perfil>("OPER")
  const [nome, setNome] = useState("")
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")

  // Senha inicial transita somente na chamada autenticada e não é retida:
  // o estado local é limpo ao fechar (spec administracao-usuarios).
  function limpar() {
    setPerfil("OPER")
    setNome("")
    setEmail("")
    setSenha("")
  }

  const mutacao = useMutation({
    mutationFn: () =>
      criarUsuario({ perfil, nome: nome.trim(), email: email.trim().toLowerCase(), senha }),
    onSuccess: () => {
      invalidarUsuarios(queryClient)
      toast.success("Usuário criado e ativo com a senha inicial.")
      limpar()
      aoFechar()
    },
    // E-mail duplicado (409) e validações (400) exibem a mensagem da função.
    onError: (erro) => toast.error(mensagemErroFuncao(erro)),
  })

  const valido =
    nome.trim() !== "" && email.trim() !== "" && senha.length >= SENHA_MINIMA

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          limpar()
          aoFechar()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            A credencial é criada confirmada; a senha inicial deve ter ao menos {SENHA_MINIMA}{" "}
            caracteres.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Perfil</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADM">{ROTULOS_PERFIL.ADM}</SelectItem>
                <SelectItem value="OPER">{ROTULOS_PERFIL.OPER}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="novo-nome">Nome</Label>
            <Input id="novo-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="novo-email">E-mail</Label>
            <Input
              id="novo-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="novo-senha">Senha inicial</Label>
            <Input
              id="novo-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!valido || mutacao.isPending} onClick={() => mutacao.mutate()}>
            Criar usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogEditarUsuario({
  usuario,
  aoFechar,
}: {
  usuario: UsuarioManutencao
  aoFechar: () => void
}) {
  const queryClient = useQueryClient()
  const [perfil, setPerfil] = useState<Perfil>(usuario.perfil ?? "OPER")
  const [nome, setNome] = useState(usuario.nome ?? "")
  const [email, setEmail] = useState(usuario.email ?? "")

  const mutacao = useMutation({
    mutationFn: () =>
      alterarUsuario({
        id: usuario.id ?? "",
        perfil,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
      }),
    onSuccess: () => {
      invalidarUsuarios(queryClient)
      toast.success("Dados do usuário atualizados.")
      aoFechar()
    },
    // Salvaguarda do último ADM ativo (409) exibida sem efeito (spec administracao-usuarios).
    onError: (erro) => toast.error(mensagemErroFuncao(erro)),
  })

  const valido = nome.trim() !== "" && email.trim() !== ""

  return (
    <Dialog open onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Altera perfil, nome e e-mail do usuário.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Perfil</Label>
            <Select value={perfil} onValueChange={(v) => setPerfil(v as Perfil)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADM">{ROTULOS_PERFIL.ADM}</SelectItem>
                <SelectItem value="OPER">{ROTULOS_PERFIL.OPER}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editar-nome">Nome</Label>
            <Input id="editar-nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="editar-email">E-mail</Label>
            <Input
              id="editar-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button disabled={!valido || mutacao.isPending} onClick={() => mutacao.mutate()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DialogRedefinirSenha({
  usuario,
  aoFechar,
}: {
  usuario: UsuarioManutencao
  aoFechar: () => void
}) {
  const queryClient = useQueryClient()
  const [senha, setSenha] = useState("")

  const mutacao = useMutation({
    mutationFn: () => redefinirSenha(usuario.id ?? "", senha),
    onSuccess: () => {
      invalidarUsuarios(queryClient)
      toast.success(
        usuario.ativo
          ? "Senha redefinida — as sessões do usuário foram revogadas."
          : "Senha redefinida — o usuário continua inativo.",
      )
      setSenha("")
      aoFechar()
    },
    onError: (erro) => toast.error(mensagemErroFuncao(erro)),
  })

  return (
    <Dialog open onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Redefinir senha</DialogTitle>
          <DialogDescription>
            Nova senha para {usuario.nome}. Ao menos {SENHA_MINIMA} caracteres. As sessões do
            usuário serão revogadas; usuário inativo não é reativado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nova-senha">Nova senha</Label>
          <Input
            id="nova-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button
            disabled={senha.length < SENHA_MINIMA || mutacao.isPending}
            onClick={() => mutacao.mutate()}
          >
            Redefinir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Usuarios() {
  const queryClient = useQueryClient()
  const consulta = useQuery({
    queryKey: chavesUsuarios.manutencao(),
    queryFn: listarUsuariosManutencao,
  })
  const [novoAberto, setNovoAberto] = useState(false)
  const [edicao, setEdicao] = useState<UsuarioManutencao | null>(null)
  const [redefinicao, setRedefinicao] = useState<UsuarioManutencao | null>(null)

  const mutacaoSituacao = useMutation({
    mutationFn: ({ usuario, ativar }: { usuario: UsuarioManutencao; ativar: boolean }) =>
      ativar ? reativarUsuario(usuario.id ?? "") : inativarUsuario(usuario.id ?? ""),
    onSuccess: (_dados, { ativar }) => {
      invalidarUsuarios(queryClient)
      toast.success(
        ativar
          ? "Usuário reativado."
          : "Usuário inativado — as sessões dele foram revogadas.",
      )
    },
    // Salvaguarda do último ADM ativo (409) exibida sem efeito.
    onError: (erro) => toast.error(mensagemErroFuncao(erro)),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Administração de acessos — ativos e inativos.
          </p>
        </div>
        <Button size="sm" onClick={() => setNovoAberto(true)}>
          Novo usuário
        </Button>
      </div>

      {consulta.isPending ? (
        <Carregando descricao="Carregando usuários…" />
      ) : consulta.isError ? (
        <ErroDeConsulta erro={consulta.error} tentarNovamente={() => void consulta.refetch()} />
      ) : (consulta.data ?? []).length === 0 ? (
        <Vazio titulo="Nenhum usuário" descricao="Crie o primeiro usuário." />
      ) : (
        <Card>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(consulta.data ?? []).map((usuario) => (
                  <TableRow key={usuario.id ?? ""}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>{usuario.perfil ? ROTULOS_PERFIL[usuario.perfil] : "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          usuario.ativo
                            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        }
                      >
                        {usuario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEdicao(usuario)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setRedefinicao(usuario)}>
                          Redefinir senha
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={mutacaoSituacao.isPending}
                          onClick={() =>
                            mutacaoSituacao.mutate({ usuario, ativar: !usuario.ativo })
                          }
                        >
                          {usuario.ativo ? "Inativar" : "Reativar"}
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

      <DialogNovoUsuario aberto={novoAberto} aoFechar={() => setNovoAberto(false)} />
      {edicao ? (
        <DialogEditarUsuario usuario={edicao} aoFechar={() => setEdicao(null)} />
      ) : null}
      {redefinicao ? (
        <DialogRedefinirSenha usuario={redefinicao} aoFechar={() => setRedefinicao(null)} />
      ) : null}
    </div>
  )
}
