import { cn } from "@/lib/utils"

// Linha institucional do sistema (spec interface-web): marca R3, ano corrente,
// versão do build e canal de suporte — discreta, em texto pequeno e esmaecido.
// Links abrem em nova aba; em viewport estreito a linha encurta ocultando o
// nome completo e trocando "Solicitar suporte" por "Suporte".
const URL_SITE_R3 = "https://ruatrez.com"
const URL_SUPORTE_R3 = "https://calendly.com/suporter3/agenda"

const CLASSE_LINK =
  "transition-colors hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline"

export function RodapeSistema({ alinhadoDireita = false }: { alinhadoDireita?: boolean }) {
  return (
    <p
      className={cn(
        "text-xs text-muted-foreground",
        alinhadoDireita ? "text-right" : "text-center",
      )}
    >
      <a href={URL_SITE_R3} target="_blank" rel="noopener noreferrer" className={CLASSE_LINK}>
        R3
      </a>
      {" © "}
      {new Date().getFullYear()}
      <span className="hidden sm:inline"> - F.E.R.A. Projetos e Engenharia</span>
      {" - v "}
      {__VERSAO_APP__}
      {" - "}
      <a href={URL_SUPORTE_R3} target="_blank" rel="noopener noreferrer" className={cn(CLASSE_LINK, "hidden sm:inline")}>
        Solicitar suporte
      </a>
      <a href={URL_SUPORTE_R3} target="_blank" rel="noopener noreferrer" className={cn(CLASSE_LINK, "sm:hidden")}>
        Suporte
      </a>
    </p>
  )
}
