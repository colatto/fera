import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query"
import type { Database, Json } from "@/types/database.types"
import type { StatusProjeto } from "@/lib/constantes"
import { supabase } from "@/lib/supabase"

// Mutações do fluxo exclusivamente pelas RPCs transacionais do banco
// (spec fluxo-projetos). Sem aplicação otimista: o estado só muda após a
// confirmação da RPC — o erro do banco é exibido e o estado anterior preservado.

// Invalidação pós-confirmação (design D4): listas, detalhe, eventos, documentos
// e dashboards — cada ação reflete imediatamente em status, linha do tempo e painéis.
export function invalidarAposFluxo(
  queryClient: ReturnType<typeof useQueryClient>,
  projetoId?: number,
): void {
  void queryClient.invalidateQueries({ queryKey: ["projetos"] })
  void queryClient.invalidateQueries({ queryKey: ["projeto"] })
  if (projetoId !== undefined) {
    void queryClient.invalidateQueries({ queryKey: ["eventos", projetoId] })
    void queryClient.invalidateQueries({ queryKey: ["documentos", projetoId] })
  }
  void queryClient.invalidateQueries({ queryKey: ["dashboards"] })
  void queryClient.invalidateQueries({ queryKey: ["ordens-compra"] })
}

// Hook comum: mutation sem aplicação otimista que invalida o cache após o sucesso.
export function useAcaoFluxo<TVariaveis>(
  acao: (variaveis: TVariaveis) => Promise<unknown>,
  projetoId?: number,
): UseMutationResult<unknown, Error, TVariaveis> {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: acao,
    onSuccess: () => invalidarAposFluxo(queryClient, projetoId),
  })
}

export interface ParametrosCriacao {
  p_tipo_id: number
  p_cliente_id: number
  p_identificador_cliente: string
  p_operadora_id: number
  p_identificador_operadora: string
  p_cidade: string
  p_uf: string
  p_valor: number
  p_responsavel_id: string
  p_anterior_id?: number
}

export async function criarProjeto(params: ParametrosCriacao): Promise<number> {
  const { data, error } = await supabase.rpc("criar_projeto", params)
  if (error) throw error
  return Number(data)
}

export async function enviarProjeto(id: number): Promise<void> {
  const { error } = await supabase.rpc("alterar_status_projeto", {
    p_id: id,
    p_novo: "ENVIADO" satisfies StatusProjeto,
  })
  if (error) throw error
}

export async function cancelarProjeto(id: number, motivo: string): Promise<void> {
  const { error } = await supabase.rpc("alterar_status_projeto", {
    p_id: id,
    p_novo: "CANCELADO" satisfies StatusProjeto,
    p_motivo: motivo,
  })
  if (error) throw error
}

export async function registrarOrdemCompra(
  p_numero: string,
  p_data: string,
  p_centro: string | null,
): Promise<number> {
  const { data, error } = await supabase.rpc("registrar_ordem_compra", {
    p_numero,
    p_data,
    p_centro: p_centro ?? undefined,
  })
  if (error) throw error
  return Number(data)
}

export async function vincularOrdemCompra(p_projeto: number, p_oc: number): Promise<void> {
  const { error } = await supabase.rpc("vincular_ordem_compra", { p_projeto, p_oc })
  if (error) throw error
}

export async function autorizarFaturamento(p_projeto: number): Promise<void> {
  const { error } = await supabase.rpc("autorizar_faturamento", { p_projeto })
  if (error) throw error
}

export async function registrarNotaFiscal(
  p_projeto: number,
  p_numero: string,
  p_data: string,
): Promise<number> {
  const { data, error } = await supabase.rpc("registrar_nota_fiscal", {
    p_projeto,
    p_numero,
    p_data,
  })
  if (error) throw error
  return Number(data)
}

export async function registrarRecebimento(
  p_nota: number,
  p_data: string,
  p_valor: number,
): Promise<void> {
  const { error } = await supabase.rpc("registrar_recebimento", { p_nota, p_data, p_valor })
  if (error) throw error
}

export interface ItemRecebimentoLote {
  nota_fiscal_id: number
  data_recebimento: string
  valor_recebido: number
}

// Lote transacional (spec fluxo-projetos): qualquer parcela inválida falha
// integralmente no banco — nada é aplicado.
export async function confirmarRecebimentosLote(itens: ItemRecebimentoLote[]): Promise<void> {
  const { error } = await supabase.rpc("confirmar_recebimentos_lote", {
    p_itens: itens as unknown as Json,
  })
  if (error) throw error
}

export async function definirCompatibilizacaoFundacao(
  p_projeto: number,
  p_marcada: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("definir_compatibilizacao_fundacao", {
    p_projeto,
    p_marcada,
  })
  if (error) throw error
}

// Tipo auxiliar para o contrato completo das funções públicas (referência).
export type FuncoesPublicas = Database["public"]["Functions"]
