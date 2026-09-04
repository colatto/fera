import { FunctionsHttpError } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

// Wrapper da Edge Function admin-usuarios (design D9): contrato { acao, ...params },
// erros no corpo JSON { erro } por status HTTP (400 validação, 401 sessão,
// 403 guarda, 404 alvo, 409 conflito, 500 inesperado).
export interface ErroFuncao {
  status: number
  mensagem: string
}

async function chamarAdminUsuarios<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-usuarios", { body: corpo })
  if (error) {
    // FunctionsHttpError carrega a Response; o corpo { erro } traz a mensagem real.
    if (error instanceof FunctionsHttpError) {
      try {
        const detalhe = (await error.context.json()) as { erro?: string }
        if (detalhe?.erro) {
          throw { status: error.context.status, mensagem: detalhe.erro } satisfies ErroFuncao
        }
      } catch (parse) {
        if (parse && typeof parse === "object" && "mensagem" in parse) throw parse
      }
      throw {
        status: error.context.status,
        mensagem: `Falha na operação (HTTP ${error.context.status}).`,
      } satisfies ErroFuncao
    }
    throw { status: 0, mensagem: error.message } satisfies ErroFuncao
  }
  return data as T
}

// A listagem NÃO passa pela função: usa a view v_usuarios_manutencao
// (src/queries/usuarios.ts), conforme a spec administracao-usuarios.
export const criarUsuario = (params: { perfil: "ADM" | "OPER"; nome: string; email: string; senha: string }) =>
  chamarAdminUsuarios<unknown>({ acao: "criar", ...params })

export const alterarUsuario = (params: { id: string; perfil?: "ADM" | "OPER"; nome?: string; email?: string }) =>
  chamarAdminUsuarios<unknown>({ acao: "alterar", ...params })

export const inativarUsuario = (id: string) =>
  chamarAdminUsuarios<unknown>({ acao: "inativar", id })

export const reativarUsuario = (id: string) =>
  chamarAdminUsuarios<unknown>({ acao: "reativar", id })

export const redefinirSenha = (id: string, senha: string) =>
  chamarAdminUsuarios<unknown>({ acao: "redefinir_senha", id, senha })

// Mensagem para exibição: prioriza o corpo { erro } da função (ErroFuncao),
// cai para a mensagem genérica do erro.
export function mensagemErroFuncao(erro: unknown): string {
  if (erro && typeof erro === "object" && "mensagem" in erro && typeof erro.mensagem === "string") {
    return erro.mensagem
  }
  if (erro instanceof Error) return erro.message
  return "Erro inesperado na operação."
}
