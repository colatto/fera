import { useState, type FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mensagemLogin } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export function TelaLogin() {
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [submetendo, setSubmetendo] = useState(false)

  // Mensagem única de falha, sem revelar se o e-mail existe (spec interface-web).
  const [erro, setErro] = useState<string | null>(
    mensagemLogin(parametros.get("motivo")),
  )

  const proxima = parametros.get("proxima")

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setSubmetendo(true)
    setErro(null)
    const { data: autenticado, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    })
    if (error || !autenticado.user) {
      setSubmetendo(false)
      // Mesma mensagem para credencial inválida, e-mail inexistente ou não confirmado.
      setErro("Falha na autenticação. Verifique e-mail e senha.")
      return
    }
    // Pós-login: leitura da própria linha em public.usuario. Ausente ou inativa →
    // sessão encerrada com mensagem de acesso indisponível (spec interface-web).
    const { data: linha } = await supabase
      .from("usuario")
      .select("ativo")
      .eq("id", autenticado.user.id)
      .maybeSingle()
    if (!linha || !linha.ativo) {
      await supabase.auth.signOut()
      setSubmetendo(false)
      setErro("Acesso indisponível para este usuário.")
      return
    }
    navegar(proxima && proxima.startsWith("/") ? proxima : "/projetos", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4">
      <img src="/feralogo.jpg" alt="Fera" className="w-56 max-w-full rounded-lg" />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acesso ao sistema</CardTitle>
          <CardDescription>Entre com suas credenciais para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={aoSubmeter} className="flex flex-col gap-4" noValidate>
            {erro ? (
              <p role="alert" className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-red-300">
                {erro}
              </p>
            ) : null}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete="current-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={submetendo}>
              {submetendo ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
