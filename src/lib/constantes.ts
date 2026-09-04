import type { Database } from "@/types/database.types"

export type Perfil = Database["public"]["Enums"]["app_role"]
export type StatusProjeto = Database["public"]["Enums"]["project_status"]
export type TipoEvento = Database["public"]["Enums"]["project_event_type"]

export const ROTULOS_STATUS: Record<StatusProjeto, string> = {
  CADASTRADO: "Cadastrado",
  ENVIADO: "Enviado",
  OC_REGISTRADA: "OC registrada",
  AUTORIZADO_FATURAMENTO: "Autorizado faturamento",
  NOTA_EMITIDA: "Nota emitida",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
}

// Badge distinta por status do fluxo.
export const CORES_STATUS: Record<StatusProjeto, string> = {
  CADASTRADO: "bg-steel/30 text-steel-light border-steel/40",
  ENVIADO: "bg-acao/15 text-acao border-acao/30",
  OC_REGISTRADA: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  AUTORIZADO_FATURAMENTO: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  NOTA_EMITIDA: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  PAGO: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  CANCELADO: "bg-destructive/15 text-red-300 border-destructive/30",
}

export const ROTULOS_EVENTO: Record<TipoEvento, string> = {
  CRIACAO: "Criação",
  ALTERACAO_CADASTRAL: "Alteração cadastral",
  ALTERACAO_STATUS: "Alteração de status",
  COMPATIBILIZACAO_FUNDACAO: "Compatibilização de fundação",
  SUBSTITUICAO: "Substituição",
}

export const ROTULOS_PERFIL: Record<Perfil, string> = {
  ADM: "Administrador",
  OPER: "Operacional",
}

export const ROTULOS_UF_INVALIDA = "UF deve conter 2 letras maiúsculas"
