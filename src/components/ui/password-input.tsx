import { useState, type ComponentProps } from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "cn"
import { Input } from "@/components/ui/input"

// Campo de senha com alternância de exibição (spec administracao-usuarios):
// o texto digitado pode ser revelado para conferência e ocultado novamente.
function PasswordInput({ className, ...props }: ComponentProps<"input">) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative w-full">
      <Input
        type={visivel ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visivel}
        onClick={() => setVisivel((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-9 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {visivel ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export { PasswordInput }
