import { useQueryClient } from "@tanstack/react-query"
import type { Tables } from "@/types/database.types"
import { supabase } from "@/lib/supabase"

export type UsuarioManutencao = Tables<"v_usuarios_manutencao">

// Listagem de manutenção (ADM): ativos e inativos com perfil, nome e e-mail
// (spec administracao-usuarios). Fonte: v_usuarios_manutencao.
export async function listarUsuariosManutencao(): Promise<UsuarioManutencao[]> {
  const { data, error } = await supabase
    .from("v_usuarios_manutencao")
    .select("*")
    .order("nome")
  if (error) throw error
  return (data ?? []) as UsuarioManutencao[]
}

// Nomes para exibição em eventos (leitura de public.usuario: própria linha para
// qualquer usuário, todas para ADM — RLS usuario_leitura).
export async function listarNomesUsuarios(): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome")
  if (error) throw error
  return Object.fromEntries((data ?? []).map((u) => [u.id, u.nome]))
}

// Usuários ativos para seleção de responsável em novos projetos (ADM).
export async function listarUsuariosAtivos(): Promise<{ id: string; nome: string }[]> {
  const { data, error } = await supabase
    .from("usuario")
    .select("id, nome")
    .eq("ativo", true)
    .order("nome")
  if (error) throw error
  return data ?? []
}

export const chavesUsuarios = {
  manutencao: () => ["usuarios", "manutencao"] as const,
  nomes: () => ["usuarios", "nomes"] as const,
  ativos: () => ["usuarios", "ativos"] as const,
}

export function invalidarUsuarios(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ["usuarios"] })
}
