import { useState } from "react"
import { useRouteLoaderData } from "react-router"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SessaoAtual } from "@/lib/auth"
import { ROTULOS_PERFIL } from "@/lib/constantes"
import { mensagemDeErro } from "@/lib/formato"
import { supabase } from "@/lib/supabase"

const SENHA_MINIMA = 6

// Troca da própria senha (spec administracao-usuarios): o Supabase Auth exige
// comprovação da credencial atual — feita por signInWithPassword prévio
// (design D6). Dados de perfil em public.usuario não são alterados.
export function MinhaSenha() {
  const { usuario } = useRouteLoaderData("shell") as SessaoAtual
  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [processando, setProcessando] = useState(false)

  const valido =
    senhaAtual !== "" &&
    novaSenha.length >= SENHA_MINIMA &&
    novaSenha === confirmacao

  async function submeter() {
    setProcessando(true)
    try {
      // Comprovação da credencial atual: recusa exibida, senha anterior mantida.
      const { error: erroComprovacao } = await supabase.auth.signInWithPassword({
        email: usuario.email,
        password: senhaAtual,
      })
      if (erroComprovacao) {
        toast.error("Credencial atual não comprovada. Verifique a senha atual.")
        return
      }
      const { error } = await supabase.auth.updateUser({ password: novaSenha })
      if (error) {
        toast.error(mensagemDeErro(error))
        return
      }
      toast.success("Senha alterada. Use a nova senha no próximo login.")
      setSenhaAtual("")
      setNovaSenha("")
      setConfirmacao("")
    } finally {
      setProcessando(false)
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Minha senha</h1>
        <p className="text-sm text-muted-foreground">
          {usuario.nome} — {ROTULOS_PERFIL[usuario.perfil]}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
          <CardDescription>
            Informe a senha atual para comprovar sua identidade. Dados de perfil não são alterados.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha-atual">Senha atual</Label>
            <Input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha-nova">Nova senha (mínimo {SENHA_MINIMA} caracteres)</Label>
            <Input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="senha-confirmacao">Confirmar nova senha</Label>
            <Input
              id="senha-confirmacao"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </div>
          {confirmacao !== "" && novaSenha !== confirmacao ? (
            <p className="text-sm text-destructive">As senhas não coincidem.</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button disabled={!valido || processando} onClick={() => void submeter()}>
            Alterar senha
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
