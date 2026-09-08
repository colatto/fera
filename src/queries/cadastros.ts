import { useQueryClient } from "@tanstack/react-query"
import type { Tables } from "@/types/database.types"
import { supabase } from "@/lib/supabase"

// Leitura dos cadastros (RLS: ADM vê ativos e inativos; OPER vê somente ativos).
// A manutenção é exclusiva de ADM (spec cadastros-basicos); OPER usa os ativos
// em seletores e filtros.
export type Cliente = Tables<"cliente">
export type Operadora = Tables<"operadora">
export type TipoProjeto = Tables<"tipo_projeto">

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase.from("cliente").select("*").order("nome")
  if (error) throw error
  return data ?? []
}

export async function listarOperadoras(): Promise<Operadora[]> {
  const { data, error } = await supabase.from("operadora").select("*").order("nome")
  if (error) throw error
  return data ?? []
}

export async function listarTipos(): Promise<TipoProjeto[]> {
  const { data, error } = await supabase.from("tipo_projeto").select("*").order("nome")
  if (error) throw error
  return data ?? []
}

export function apenasAtivos<T extends { ativo: boolean }>(linhas: T[]): T[] {
  return linhas.filter((linha) => linha.ativo)
}

export function invalidarCadastros(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: ["cadastros"] })
}

// Escritas diretas nas tabelas de cadastro — permitidas a ADM por RLS e grants.
// Inativação é a saída do cadastro: não existe exclusão física (spec cadastros-basicos).

export async function inserirCliente(valores: { nome: string; cnpj: string | null }): Promise<void> {
  const { error } = await supabase.from("cliente").insert(valores)
  if (error) throw error
}

export async function atualizarCliente(
  id: number,
  valores: { nome: string; cnpj: string | null },
): Promise<void> {
  const { error } = await supabase.from("cliente").update(valores).eq("id", id)
  if (error) throw error
}

export async function alterarSituacaoCliente(id: number, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("cliente").update({ ativo }).eq("id", id)
  if (error) throw error
}

export async function inserirOperadora(nome: string): Promise<void> {
  const { error } = await supabase.from("operadora").insert({ nome })
  if (error) throw error
}

export async function atualizarOperadora(id: number, nome: string): Promise<void> {
  const { error } = await supabase.from("operadora").update({ nome }).eq("id", id)
  if (error) throw error
}

export async function alterarSituacaoOperadora(id: number, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("operadora").update({ ativo }).eq("id", id)
  if (error) throw error
}

export interface ValoresTipoProjeto {
  nome: string
  is_ppi: boolean
  faixa_inicial: number
  faixa_final: number | null
  limite_parcelas: number
}

export async function inserirTipoProjeto(valores: ValoresTipoProjeto): Promise<void> {
  const { error } = await supabase.from("tipo_projeto").insert(valores)
  if (error) throw error
}

export async function atualizarTipoProjeto(
  id: number,
  valores: ValoresTipoProjeto,
): Promise<void> {
  const { error } = await supabase.from("tipo_projeto").update(valores).eq("id", id)
  if (error) throw error
}

export async function alterarSituacaoTipoProjeto(id: number, ativo: boolean): Promise<void> {
  const { error } = await supabase.from("tipo_projeto").update({ ativo }).eq("id", id)
  if (error) throw error
}

export const chavesCadastros = {
  clientes: () => ["cadastros", "clientes"] as const,
  operadoras: () => ["cadastros", "operadoras"] as const,
  tipos: () => ["cadastros", "tipos"] as const,
}
