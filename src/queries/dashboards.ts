import type { Json } from "@/types/database.types"
import { supabase } from "@/lib/supabase"

// Dashboards (spec painel-dashboards): o operacional por período vem da RPC
// dashboard_operacional; o financeiro, exclusivo de ADM, da v_dashboard_financeiro.

export interface DashboardOperacional {
  porStatus: { status: string; quantidade: number }[]
  enviadosNoPeriodo: number
  enviadosSemOc: number
}

interface LinhaRpcDashboard {
  projetos_por_status: Json
  enviados_no_periodo: number
  enviados_sem_oc: number
}

export async function obterDashboardOperacional(
  dataInicial: string,
  dataFinal: string,
): Promise<DashboardOperacional> {
  const { data, error } = await supabase.rpc("dashboard_operacional", {
    p_data_inicial: dataInicial,
    p_data_final: dataFinal,
  })
  if (error) throw error
  const linha = (data ?? [])[0] as LinhaRpcDashboard | undefined
  const bruto =
    linha?.projetos_por_status && typeof linha.projetos_por_status === "object"
      ? (linha.projetos_por_status as Record<string, number>)
      : {}
  return {
    porStatus: Object.entries(bruto).map(([status, quantidade]) => ({
      status,
      quantidade: Number(quantidade) || 0,
    })),
    enviadosNoPeriodo: Number(linha?.enviados_no_periodo) || 0,
    enviadosSemOc: Number(linha?.enviados_sem_oc) || 0,
  }
}

export interface DashboardFinanceiro {
  faturado: number
  recebido: number
  saldo: number
}

export async function obterDashboardFinanceiro(): Promise<DashboardFinanceiro> {
  const { data, error } = await supabase
    .from("v_dashboard_financeiro")
    .select("valor_faturado, valor_recebido, saldo_receber")
    .maybeSingle()
  if (error) throw error
  return {
    faturado: Number(data?.valor_faturado) || 0,
    recebido: Number(data?.valor_recebido) || 0,
    saldo: Number(data?.saldo_receber) || 0,
  }
}

export const chavesDashboards = {
  operacional: (dataInicial: string, dataFinal: string) =>
    ["dashboards", "operacional", dataInicial, dataFinal] as const,
  financeiro: () => ["dashboards", "financeiro"] as const,
}
