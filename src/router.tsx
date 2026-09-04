import { Outlet, redirect, createBrowserRouter, useRouteLoaderData } from "react-router"
import { Shell } from "@/components/shell"
import { SemDados } from "@/components/estados"
import { exigirSessao, type SessaoAtual } from "@/lib/auth"
import { TelaLogin } from "@/routes/login"
import { NaoEncontrado } from "@/routes/nao-encontrado"
import { ProjetosListar } from "@/routes/projetos/projetos-listar"
import { ProjetoDetalhe } from "@/routes/projetos/projeto-detalhe"
import { ProjetoNovo } from "@/routes/projetos/projeto-novo"
import { DashboardOperacional } from "@/routes/dashboards/dashboard-operacional"
import { DashboardFinanceiro } from "@/routes/dashboards/dashboard-financeiro"
import { Clientes } from "@/routes/cadastros/cadastros-clientes"
import { Operadoras } from "@/routes/cadastros/cadastros-operadoras"
import { TiposProjeto } from "@/routes/cadastros/cadastros-tipos"
import { Usuarios } from "@/routes/usuarios/usuarios"
import { MinhaSenha } from "@/routes/usuarios/minha-senha"

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
    { path: "/login", element: <TelaLogin /> },
    {
      id: "shell",
      path: "/",
      loader: () => exigirSessao(),
      element: <Shell />,
      children: [
        { index: true, loader: () => redirect("/projetos") },
        { path: "projetos", element: <ProjetosListar /> },
        { path: "projetos/:id", element: <ProjetoDetalhe /> },
        {
          element: <ExigirAdm />,
          children: [
            { path: "projetos/novo", element: <ProjetoNovo /> },
            { path: "dashboard-financeiro", element: <DashboardFinanceiro /> },
            { path: "cadastros/clientes", element: <Clientes /> },
            { path: "cadastros/operadoras", element: <Operadoras /> },
            { path: "cadastros/tipos", element: <TiposProjeto /> },
            { path: "usuarios", element: <Usuarios /> },
          ],
        },
        { path: "dashboard-operacional", element: <DashboardOperacional /> },
        { path: "minha-senha", element: <MinhaSenha /> },
        { path: "*", element: <NaoEncontrado /> },
      ],
    },
  ])
}
