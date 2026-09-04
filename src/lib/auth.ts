import { redirect } from "react-router"
import type { QueryClient } from "@tanstack/react-query"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Perfil } from "@/lib/constantes"

// Usuário da navegação: linha própria em public.usuario (spec interface-web).
export interface UsuarioAtual {
  id: string
  nome: string
  email: string
  perfil: Perfil
}

export interface SessaoAtual {
  sessao: Session
  usuario: UsuarioAtual
}

// Lê a própria linha em public.usuario. Retorna null quando ausente ou inativa
// (a interface encerra a sessão nesses casos — spec interface-web).
export async function carregarUsuarioAtual(
  sessao: Session | null,
): Promise<UsuarioAtual | null> {
  if (!sessao) return null
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome, email, perfil, ativo")
    .eq("id", sessao.user.id)
    .maybeSingle()
  if (error || !data || !data.ativo) return null
  return { id: data.id, nome: data.nome, email: data.email, perfil: data.perfil }
}

async function obterSessao(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

// Guarda de sessão no loader (experiência, não proteção — spec interface-web).
// Sem sessão: login preservando a rota de retorno. Sessão sem perfil ativo:
// encerra a sessão e manda ao login com motivo "acesso".
export async function exigirSessao(): Promise<SessaoAtual> {
  const sessao = await obterSessao()
  if (!sessao) {
    const destino = `${location.pathname}${location.search}`
    throw redirect(`/login?proxima=${encodeURIComponent(destino)}`)
  }
  const usuario = await carregarUsuarioAtual(sessao)
  if (!usuario) {
    await supabase.auth.signOut()
    throw redirect("/login?motivo=acesso")
  }
  return { sessao, usuario }
}

export function rotaLoginComRetorno(): string {
  return `/login?proxima=${encodeURIComponent(`${location.pathname}${location.search}`)}`
}

// Mensagem da tela de login conforme o motivo da volta (spec interface-web).
export function mensagemLogin(motivo: string | null): string | null {
  switch (motivo) {
    case "acesso":
      return "Acesso indisponível para este usuário."
    case "sessao":
      return "Sua sessão foi encerrada. Faça login novamente."
    default:
      return null
  }
}

// onAuthStateChange (task 2.6): SIGNED_OUT cobre logout, expiração, renovação
// negada e revogação por inativação (supabase-js encerra a sessão nesses casos).
// Limpa o cache do TanStack Query e vai ao login sem loop — só navega se estiver
// fora da tela de login. Registrado uma vez no bootstrap, fora do contexto React.
export function iniciarEscutaSessao(queryClient: QueryClient, aoSair: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((evento) => {
    if (evento !== "SIGNED_OUT") return
    queryClient.clear()
    aoSair()
  })
  return () => data.subscription.unsubscribe()
}
