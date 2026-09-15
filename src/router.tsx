import { lazy } from "react"
import { Outlet, redirect, createBrowserRouter, useRouteLoaderData } from "react-router"
import { Shell } from "@/components/shell"
import { RotaLazy } from "@/components/rota-lazy"
import { SemDados } from "@/components/estados"
import { exigirSessao, type SessaoAtual } from "@/lib/auth"

// Código de rota baixado sob demanda (spec carregamento-progressivo): cada
// página vira um chunk próprio; o shell e a guarda de sessão permanecem no
// bundle inicial. Nomes e exports das rotas não mudam.
const TelaLogin = lazy(() => import("@/routes/login").then((m) => ({ default: m.TelaLogin })))
const NaoEncontrado = lazy(() =>
  import("@/routes/nao-encontrado").then((m) => ({ default: m.NaoEncontrado })),
)
const ProjetosListar = lazy(() =>
  import("@/routes/projetos/projetos-listar").then((m) => ({ default: m.ProjetosListar })),
)
const ProjetoDetalhe = lazy(() =>
  import("@/routes/projetos/projeto-detalhe").then((m) => ({ default: m.ProjetoDetalhe })),
)
const ProjetoNovo = lazy(() =>
  import("@/routes/projetos/projeto-novo").then((m) => ({ default: m.ProjetoNovo })),
)
const DashboardOperacional = lazy(() =>
  import("@/routes/dashboards/dashboard-operacional").then((m) => ({
    default: m.DashboardOperacional,
  })),
)
const DashboardFinanceiro = lazy(() =>
  import("@/routes/dashboards/dashboard-financeiro").then((m) => ({
    default: m.DashboardFinanceiro,
  })),
)
const Clientes = lazy(() =>
  import("@/routes/cadastros/cadastros-clientes").then((m) => ({ default: m.Clientes })),
)
const Operadoras = lazy(() =>
  import("@/routes/cadastros/cadastros-operadoras").then((m) => ({ default: m.Operadoras })),
)
const TiposProjeto = lazy(() =>
  import("@/routes/cadastros/cadastros-tipos").then((m) => ({ default: m.TiposProjeto })),
)
const Usuarios = lazy(() =>
  import("@/routes/usuarios/usuarios").then((m) => ({ default: m.Usuarios })),
)
const MinhaSenha = lazy(() =>
  import("@/routes/usuarios/minha-senha").then((m) => ({ default: m.MinhaSenha })),
)

// Rotas administrativas sob guarda de perfil na interface (task 2.5):
// OPER que força a URL não recebe o conteúdo — degrada para estado sem dados,
// permanecendo utilizável (spec interface-web). A proteção efetiva é RLS.
function ExigirAdm() {
  const { usuario } = useRouteLoaderData("shell") as SessaoAtual
  if (usuario.perfil !== "ADM") {
    return <SemDados descricao="Este conteúdo é exclusivo do perfil administrador." />
  }
  return <Outlet />
}

export function criarRouter() {
  return createBrowserRouter([
    {
      path: "/login",
      element: (
        <RotaLazy centralizado>
          <TelaLogin />
        </RotaLazy>
      ),
    },
    {
      id: "shell",
      path: "/",
      loader: () => exigirSessao(),
      element: <Shell />,
      children: [
        { index: true, loader: () => redirect("/projetos") },
        {
          path: "projetos",
          element: (
            <RotaLazy>
              <ProjetosListar />
            </RotaLazy>
          ),
        },
        {
          path: "projetos/:id",
          element: (
            <RotaLazy>
              <ProjetoDetalhe />
            </RotaLazy>
          ),
        },
        {
          element: <ExigirAdm />,
          children: [
            {
              path: "projetos/novo",
              element: (
                <RotaLazy>
                  <ProjetoNovo />
                </RotaLazy>
              ),
            },
            {
              path: "dashboard-financeiro",
              element: (
                <RotaLazy>
                  <DashboardFinanceiro />
                </RotaLazy>
              ),
            },
            {
              path: "cadastros/clientes",
              element: (
                <RotaLazy>
                  <Clientes />
                </RotaLazy>
              ),
            },
            {
              path: "cadastros/operadoras",
              element: (
                <RotaLazy>
                  <Operadoras />
                </RotaLazy>
              ),
            },
            {
              path: "cadastros/tipos",
              element: (
                <RotaLazy>
                  <TiposProjeto />
                </RotaLazy>
              ),
            },
            {
              path: "usuarios",
              element: (
                <RotaLazy>
                  <Usuarios />
                </RotaLazy>
              ),
            },
          ],
        },
        {
          path: "dashboard-operacional",
          element: (
            <RotaLazy>
              <DashboardOperacional />
            </RotaLazy>
          ),
        },
        {
          path: "minha-senha",
          element: (
            <RotaLazy>
              <MinhaSenha />
            </RotaLazy>
          ),
        },
        {
          path: "*",
          element: (
            <RotaLazy>
              <NaoEncontrado />
            </RotaLazy>
          ),
        },
      ],
    },
  ])
}
