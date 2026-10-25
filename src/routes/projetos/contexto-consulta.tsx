import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import type { SortingState } from "@tanstack/react-table"
import { filtrosVazios, type FiltrosProjetos } from "@/queries/projetos"

// Estado da consulta de projetos (spec consulta-projetos, "Estado da consulta
// preservado na navegação"): vive acima das rotas para sobreviver à navegação
// entre a listagem e o detalhe; recarregar a página (ou deslogar, que desmonta
// o provider junto do shell) zera a consulta.
interface EstadoConsultaProjetos {
  filtros: FiltrosProjetos
  setFiltros: Dispatch<SetStateAction<FiltrosProjetos>>
  ordenacao: SortingState
  setOrdenacao: Dispatch<SetStateAction<SortingState>>
  pagina: number
  setPagina: Dispatch<SetStateAction<number>>
}

const ContextoConsultaProjetos = createContext<EstadoConsultaProjetos | null>(null)

export function ProvedorConsultaProjetos({ children }: { children: ReactNode }) {
  const [filtros, setFiltros] = useState<FiltrosProjetos>(filtrosVazios)
  const [ordenacao, setOrdenacao] = useState<SortingState>([])
  const [pagina, setPagina] = useState(0)

  const estado = useMemo<EstadoConsultaProjetos>(
    () => ({ filtros, setFiltros, ordenacao, setOrdenacao, pagina, setPagina }),
    [filtros, ordenacao, pagina],
  )

  return (
    <ContextoConsultaProjetos.Provider value={estado}>
      {children}
    </ContextoConsultaProjetos.Provider>
  )
}

export function useConsultaProjetos(): EstadoConsultaProjetos {
  const estado = useContext(ContextoConsultaProjetos)
  if (!estado) {
    throw new Error("useConsultaProjetos deve ser usado dentro de ProvedorConsultaProjetos")
  }
  return estado
}
