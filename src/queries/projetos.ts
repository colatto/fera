import type { Tables } from "@/types/database.types"
import type { Perfil, StatusProjeto } from "@/lib/constantes"
import { supabase } from "@/lib/supabase"

// Projeções por perfil (spec consulta-projetos): ADM lê a projeção completa,
// OPER lê a projeção operacional — sem colunas financeiras nem de documentos.
export type ProjetoOperacional = Tables<"v_projetos_operacional">
export type ProjetoAdministrativo = Tables<"v_projetos_administrativo">
export type EventoProjeto = Tables<"v_eventos_operacionais">
export type OrdemCompraAdm = Tables<"v_ordens_compra_administrativo">

const vAdministrativo = "v_projetos_administrativo" as const
const vOperacional = "v_projetos_operacional" as const

// Filtros combináveis (spec consulta-projetos): aplicados em conjunto no servidor.
export interface FiltrosProjetos {
  codigo: string
  cliente: string
  identificadorCliente: string
  operadora: string
  identificadorOperadora: string
  cidade: string
  uf: string
  tipo: string
  status: StatusProjeto | ""
}

export const filtrosVazios: FiltrosProjetos = {
  codigo: "",
  cliente: "",
  identificadorCliente: "",
  operadora: "",
  identificadorOperadora: "",
  cidade: "",
  uf: "",
  tipo: "",
  status: "",
}

export function filtrosAtivos(filtros: FiltrosProjetos): boolean {
  return Object.values(filtros).some((valor) => valor !== "")
}

function montarConsulta(perfil: Perfil, filtros: FiltrosProjetos) {
  const consulta = supabase
    .from(perfil === "ADM" ? vAdministrativo : vOperacional)
    .select("*")
    .order("criado_em", { ascending: false })

  let q = consulta
  if (filtros.codigo) q = q.ilike("codigo_pasta", `%${filtros.codigo.trim()}%`)
  if (filtros.cliente) q = q.eq("cliente", filtros.cliente)
  if (filtros.identificadorCliente)
    q = q.ilike("identificador_cliente", `%${filtros.identificadorCliente.trim()}%`)
  if (filtros.operadora) q = q.eq("operadora", filtros.operadora)
  if (filtros.identificadorOperadora)
    q = q.ilike("identificador_operadora", `%${filtros.identificadorOperadora.trim()}%`)
  if (filtros.cidade) q = q.ilike("cidade", `%${filtros.cidade.trim()}%`)
  if (filtros.uf) q = q.eq("uf", filtros.uf.trim().toUpperCase())
  if (filtros.tipo) q = q.eq("tipo_projeto", filtros.tipo)
  if (filtros.status) q = q.eq("status", filtros.status)
  return q
}

export async function listarProjetos(perfil: "ADM", filtros: FiltrosProjetos): Promise<ProjetoAdministrativo[]>
export async function listarProjetos(perfil: "OPER", filtros: FiltrosProjetos): Promise<ProjetoOperacional[]>
export async function listarProjetos(
  perfil: Perfil,
  filtros: FiltrosProjetos,
): Promise<ProjetoAdministrativo[] | ProjetoOperacional[]>
export async function listarProjetos(
  perfil: Perfil,
  filtros: FiltrosProjetos,
): Promise<ProjetoAdministrativo[] | ProjetoOperacional[]> {
  const { data, error } = await montarConsulta(perfil, filtros)
  if (error) throw error
  return (data ?? []) as ProjetoAdministrativo[] | ProjetoOperacional[]
}

export async function obterProjeto(perfil: "ADM", id: number): Promise<ProjetoAdministrativo | null>
export async function obterProjeto(perfil: "OPER", id: number): Promise<ProjetoOperacional | null>
export async function obterProjeto(
  perfil: Perfil,
  id: number,
): Promise<ProjetoAdministrativo | ProjetoOperacional | null>
export async function obterProjeto(
  perfil: Perfil,
  id: number,
): Promise<ProjetoAdministrativo | ProjetoOperacional | null> {
  const { data, error } = await supabase
    .from(perfil === "ADM" ? vAdministrativo : vOperacional)
    .select("*")
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  return data as ProjetoAdministrativo | ProjetoOperacional | null
}

// Linha do tempo — eventos (spec consulta-projetos): fonte comum
// v_eventos_operacionais, em ordem cronológica.
export async function listarEventos(id: number): Promise<EventoProjeto[]> {
  const { data, error } = await supabase
    .from("v_eventos_operacionais")
    .select("*")
    .eq("projeto_id", id)
    .order("realizado_em", { ascending: true })
  if (error) throw error
  return (data ?? []) as EventoProjeto[]
}

// Documentos do detalhe para ADM (spec consulta-projetos): autorização, nota e
// recebimentos lidos das próprias tabelas; a OC vem na projeção do projeto
// (numero_oc/data_oc/centro_custo), pois uma OC atende vários projetos.
export interface DocumentosAdm {
  autorizadoEm: string | null
  nota: { id: number; numero: string; dataEmissao: string; valor: number } | null
  recebimentos: { id: number; dataRecebimento: string; valorRecebido: number }[]
}

export async function obterDocumentosAdm(projetoId: number): Promise<DocumentosAdm> {
  const { data: autorizacao, error: erroAutorizacao } = await supabase
    .from("autorizacao_faturamento")
    .select("autorizado_em")
    .eq("projeto_id", projetoId)
    .maybeSingle()
  if (erroAutorizacao) throw erroAutorizacao

  const { data: nota, error: erroNota } = await supabase
    .from("nota_fiscal")
    .select("id, numero, data_emissao, valor")
    .eq("projeto_id", projetoId)
    .maybeSingle()
  if (erroNota) throw erroNota

  let recebimentos: DocumentosAdm["recebimentos"] = []
  if (nota) {
    const { data, error } = await supabase
      .from("recebimento")
      .select("id, data_recebimento, valor_recebido")
      .eq("nota_fiscal_id", nota.id)
      .order("data_recebimento", { ascending: true })
    if (error) throw error
    recebimentos = (data ?? []).map((r) => ({
      id: r.id,
      dataRecebimento: r.data_recebimento,
      valorRecebido: r.valor_recebido,
    }))
  }

  return {
    autorizadoEm: autorizacao?.autorizado_em ?? null,
    nota: nota
      ? {
          id: nota.id,
          numero: nota.numero,
          dataEmissao: nota.data_emissao,
          valor: nota.valor,
        }
      : null,
    recebimentos,
  }
}

// OCs registradas (ADM) — para vincular a um projeto enviado (spec fluxo-projetos).
export async function listarOrdensCompra(): Promise<OrdemCompraAdm[]> {
  const { data, error } = await supabase
    .from("v_ordens_compra_administrativo")
    .select("*")
    .order("data_oc", { ascending: false })
  if (error) throw error
  return (data ?? []) as OrdemCompraAdm[]
}

// Chaves de cache do domínio projetos — usadas por listas, detalhe e invalidações.
export const chavesProjetos = {
  todos: (perfil: Perfil) => ["projetos", perfil] as const,
  lista: (perfil: Perfil, filtros: FiltrosProjetos) => ["projetos", perfil, filtros] as const,
  detalhe: (perfil: Perfil, id: number) => ["projeto", perfil, id] as const,
  eventos: (id: number) => ["eventos", id] as const,
  documentos: (id: number) => ["documentos", id] as const,
  ordensCompra: () => ["ordens-compra"] as const,
}
