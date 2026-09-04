import { Link } from "react-router"
import { Button } from "@/components/ui/button"

// Página not-found interna (design D2): o rewrite da Vercel serve o app em
// qualquer rota; rotas inexistentes caem aqui dentro do shell.
export function NaoEncontrado() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="label-caixa">Página não encontrada</p>
      <p className="text-sm text-muted-foreground">
        O endereço acessado não corresponde a nenhuma tela do sistema.
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/projetos">Voltar para projetos</Link>
      </Button>
    </div>
  )
}
