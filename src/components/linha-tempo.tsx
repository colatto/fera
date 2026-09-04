import { cn } from "@/lib/utils"
import { formatarData, formatarDataHora } from "@/lib/formato"

export interface ItemLinhaTempo {
  id: string
  quando: string
  titulo: string
  descricao?: string
  detentor?: string
  tipo: "evento" | "documento" | "previsao"
}

// Linha do tempo cronológica do projeto (spec consulta-projetos):
// eventos e (para ADM) documentos em ordem crescente de tempo.
export function LinhaTempo({ itens }: { itens: ItemLinhaTempo[] }) {
  const ordenados = [...itens].sort(
    (a, b) => new Date(a.quando).getTime() - new Date(b.quando).getTime(),
  )
  return (
    <ol className="relative flex flex-col gap-6 border-l border-border pl-6">
      {ordenados.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className={cn(
              "absolute -left-[calc(1.5rem+5px)] top-1.5 size-2.5 rounded-full border-2 border-background",
              item.tipo === "documento"
                ? "bg-acao"
                : item.tipo === "previsao"
                  ? "bg-amber-400"
                  : "bg-steel",
            )}
          />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="font-medium">{item.titulo}</p>
            <p className="text-xs text-muted-foreground">
              {item.tipo === "previsao" ? formatarData(item.quando) : formatarDataHora(item.quando)}
            </p>
          </div>
          {item.descricao ? <p className="mt-0.5 text-sm text-muted-foreground">{item.descricao}</p> : null}
          {item.detentor ? (
            <p className="mt-0.5 text-xs text-muted-foreground">Por {item.detentor}</p>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
