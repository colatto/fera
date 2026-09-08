// Formatação pt-BR (design D10): datas e moeda com Intl, fuso do usuário.

export function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—"
  const data = new Date(valor.length === 10 ? `${valor}T12:00:00` : valor)
  if (Number.isNaN(data.getTime())) return "—"
  return data.toLocaleDateString("pt-BR")
}

export function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return "—"
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return "—"
  return data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

const formatoBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return formatoBRL.format(valor)
}

export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return valor.toLocaleString("pt-BR")
}

// Escape CSV: campo entre aspas quando contém ; " ou quebra de linha.
function escaparCampoCsv(valor: string): string {
  if (/[";\n]/.test(valor)) {
    return `"${valor.replaceAll('"', '""')}"`
  }
  return valor
}

// Exportação client-side da consulta corrente: separador ";" e BOM UTF-8
// para compatibilidade com Excel pt-BR (design D10). Colunas definidas pelo chamador
// conforme o perfil.
export function baixarCsv(nomeArquivo: string, colunas: string[], linhas: string[][]): void {
  const conteudo = [colunas, ...linhas]
    .map((linha) => linha.map((celula) => escaparCampoCsv(celula ?? "")).join(";"))
    .join("\r\n")
  const blob = new Blob([`\uFEFF${conteudo}`], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const ancora = document.createElement("a")
  ancora.href = url
  ancora.download = nomeArquivo
  ancora.click()
  URL.revokeObjectURL(url)
}

// Tradução de violações de constraint (design D3): chave = nome da constraint
// versionado em banco.sql; "X" é substituído pelo valor duplicado quando o
// campo `details` do PostgREST o informa.
const MENSAGENS_CONSTRAINT: Record<string, { comValor: string; semValor: string }> = {
  operadora_nome_key: {
    comValor: 'Já existe uma operadora com o nome "X".',
    semValor: "Já existe uma operadora com este nome.",
  },
  cliente_cnpj_unico: {
    comValor: "Já existe um cliente cadastrado com o CNPJ X.",
    semValor: "Já existe um cliente cadastrado com este CNPJ.",
  },
  tipo_projeto_nome_key: {
    comValor: 'Já existe um tipo de projeto com o nome "X".',
    semValor: "Já existe um tipo de projeto com este nome.",
  },
  tipo_faixas_sem_sobreposicao: {
    comValor: "A faixa de números sobrepõe a faixa de outro tipo de projeto.",
    semValor: "A faixa de números sobrepõe a faixa de outro tipo de projeto.",
  },
  tipo_faixa_valida: {
    comValor: "Faixa inconsistente com o indicador PPI: tipos comuns usam 0–1000; PPI, a partir de 1001.",
    semValor: "Faixa inconsistente com o indicador PPI: tipos comuns usam 0–1000; PPI, a partir de 1001.",
  },
  tipo_proximo_valido: {
    comValor: "O próximo número deve estar dentro da faixa definida.",
    semValor: "O próximo número deve estar dentro da faixa definida.",
  },
  tipo_torre_limite_parcelas: {
    comValor: "O tipo Torre exige limite de parcelas igual a 3.",
    semValor: "O tipo Torre exige limite de parcelas igual a 3.",
  },
}

// Códigos Postgres traduzíveis: unique, exclusion e check (design D2).
const CODIGOS_CONSTRAINT = new Set(["23505", "23P01", "23514"])

// details chega como `Key (nome)=(Vivo) already exists.`; sem details, degrada
// para a forma sem valor (design D3).
function valorDuplicado(details: unknown): string | null {
  if (typeof details !== "string") return null
  const m = /Key \([^)]+\)=\((.*)\)/.exec(details)
  return m ? m[1] : null
}

// Extrai a mensagem do erro Postgrest/RPC; evita "[object Object]" na tela.
// Violações de constraint mapeada viram mensagem em português; o resto
// (RPCs em português, rede, constraints fora do mapa) passa direto (design D4).
export function mensagemDeErro(erro: unknown): string {
  if (erro && typeof erro === "object") {
    const postgrest = erro as { code?: unknown; message?: unknown; details?: unknown }
    if (
      typeof postgrest.message === "string" &&
      typeof postgrest.code === "string" &&
      CODIGOS_CONSTRAINT.has(postgrest.code)
    ) {
      const m = /constraint "([^"]+)"/.exec(postgrest.message)
      const traducao = m ? MENSAGENS_CONSTRAINT[m[1]] : undefined
      if (traducao) {
        const valor = valorDuplicado(postgrest.details)
        return valor ? traducao.comValor.replace("X", () => valor) : traducao.semValor
      }
    }
    if ("message" in postgrest && typeof postgrest.message === "string" && postgrest.message) {
      return postgrest.message
    }
  }
  if (erro instanceof Error) return erro.message
  return "Erro inesperado. Tente novamente."
}
