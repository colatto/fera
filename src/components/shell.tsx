import { NavLink, Outlet, useNavigate, useRouteLoaderData } from "react-router"
import {
  Building2,
  ChartColumn,
  FolderKanban,
  KeyRound,
  LogOut,
  Tags,
  Truck,
  UsersRound,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ROTULOS_PERFIL, type Perfil } from "@/lib/constantes"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import type { SessaoAtual } from "@/lib/auth"

// Navegação orientada por perfil (spec interface-web): entradas administrativas
// e financeiras só existem para ADM — o OPER nem as vê no menu.
interface EntradaNavegacao {
  para: string
  rotulo: string
  icone: typeof FolderKanban
}

const NAVEGACAO_OPERACAO: EntradaNavegacao[] = [
  { para: "/projetos", rotulo: "Projetos", icone: FolderKanban },
  { para: "/dashboard-operacional", rotulo: "Dashboard operacional", icone: ChartColumn },
]

const NAVEGACAO_ADM: EntradaNavegacao[] = [
  { para: "/dashboard-financeiro", rotulo: "Dashboard financeiro", icone: Wallet },
  { para: "/cadastros/clientes", rotulo: "Clientes", icone: Building2 },
  { para: "/cadastros/operadoras", rotulo: "Operadoras", icone: Truck },
  { para: "/cadastros/tipos", rotulo: "Tipos de projeto", icone: Tags },
  { para: "/usuarios", rotulo: "Usuários", icone: UsersRound },
]

function ItemNavegacao({ entrada }: { entrada: EntradaNavegacao }) {
  const Icone = entrada.icone
  return (
    <NavLink
      to={entrada.para}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive &&
            "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
        )
      }
    >
      <Icone className="size-4 shrink-0" aria-hidden />
      {entrada.rotulo}
    </NavLink>
  )
}

function GrupoNavegacao({
  rotulo,
  entradas,
}: {
  rotulo: string
  entradas: EntradaNavegacao[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="label-caixa px-3 pt-4 pb-1 text-sidebar-foreground/60">{rotulo}</p>
      {entradas.map((entrada) => (
        <ItemNavegacao key={entrada.para} entrada={entrada} />
      ))}
    </div>
  )
}

export function Shell() {
  const { usuario } = useRouteLoaderData("shell") as SessaoAtual
  const navegar = useNavigate()
  const ehAdm = usuario.perfil === ("ADM" satisfies Perfil)

  async function sair() {
    await supabase.auth.signOut()
    navegar("/login", { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col bg-sidebar text-sidebar-foreground md:w-64 md:border-r md:border-sidebar-border">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 pb-2 md:justify-center md:py-5">
          <NavLink to="/projetos" className="flex items-center gap-3" aria-label="Fera — início">
            <img
              src="/feralogo.jpg"
              alt="Fera"
              className="h-10 w-auto rounded-md md:h-12"
            />
          </NavLink>
          <Button
            variant="ghost"
            size="sm"
            onClick={sair}
            className="md:hidden"
            aria-label="Encerrar sessão"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-x-auto px-3 pb-3 md:overflow-y-auto md:px-3">
          <GrupoNavegacao rotulo="Operação" entradas={NAVEGACAO_OPERACAO} />
          {ehAdm ? <GrupoNavegacao rotulo="Administração" entradas={NAVEGACAO_ADM} /> : null}
          <GrupoNavegacao
            rotulo="Conta"
            entradas={[{ para: "/minha-senha", rotulo: "Minha senha", icone: KeyRound }]}
          />
        </nav>
        <div className="hidden border-t border-sidebar-border px-4 py-3 md:block">
          <p className="truncate text-sm font-medium">{usuario.nome}</p>
          <p className="text-xs text-sidebar-foreground/70">{ROTULOS_PERFIL[usuario.perfil]}</p>
          <Button variant="ghost" size="sm" onClick={sair} className="mt-2 w-full justify-start">
            <LogOut className="size-4" aria-hidden />
            Encerrar sessão
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  )
}
