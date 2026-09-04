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

// Extrai a mensagem do erro Postgrest/RPC; evita "[object Object]" na tela.
export function mensagemDeErro(erro: unknown): string {
  if (erro && typeof erro === "object" && "message" in erro && typeof erro.message === "string") {
    return erro.message
  }
  if (erro instanceof Error) return erro.message
  return "Erro inesperado. Tente novamente."
}
