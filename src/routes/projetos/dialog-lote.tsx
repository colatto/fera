import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { dataLocalHoje, formatarMoeda, mensagemDeErro } from "@/lib/formato"
import {
  confirmarRecebimentosLote,
  useAcaoFluxo,
  type ItemRecebimentoLote,
} from "@/queries/fluxo"
import type { ProjetoAdministrativo } from "@/queries/projetos"

interface LinhaLote {
  notaFiscalId: string
  data: string
  valor: string
}

export function DialogLote({
  aberto,
  aoFechar,
  notasDisponiveis,
}: {
  aberto: boolean
  aoFechar: () => void
  notasDisponiveis: ProjetoAdministrativo[]
}) {
  const [linhas, setLinhas] = useState<LinhaLote[]>([])

  const mutacao = useAcaoFluxo((itens: ItemRecebimentoLote[]) =>
    confirmarRecebimentosLote(itens),
  )

  function adicionarLinha() {
    setLinhas((atual) => [...atual, { notaFiscalId: "", data: dataLocalHoje(), valor: "" }])
  }

  function mudarLinha(indice: number, campos: Partial<LinhaLote>) {
    setLinhas((atual) =>
      atual.map((linha, i) => (i === indice ? { ...linha, ...campos } : linha)),
    )
  }

  async function submeter() {
    const itens: ItemRecebimentoLote[] = linhas.map((linha) => ({
      nota_fiscal_id: Number(linha.notaFiscalId),
      data_recebimento: linha.data,
      valor_recebido: Number(linha.valor.replace(",", ".")),
    }))
    try {
      await mutacao.mutateAsync(itens)
      toast.success("Recebimentos do lote confirmados.")
      aoFechar()
    } catch (erro) {
      // Falha integral (spec fluxo-projetos): nada é aplicado.
      toast.error(`Lote não aplicado: ${mensagemDeErro(erro)}`)
    }
  }

  const valido = linhas.every(
    (linha) =>
      linha.notaFiscalId !== "" &&
      linha.data !== "" &&
      Number(linha.valor.replace(",", ".")) > 0,
  )

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar recebimentos em lote</DialogTitle>
          <DialogDescription>
            Operação transacional: se qualquer item falhar, nenhum recebimento é aplicado.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {linhas.map((linha, indice) => (
            <div key={indice} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-end gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <Label className="text-xs">Nota (projeto)</Label>
                <Select
                  value={linha.notaFiscalId}
                  onValueChange={(v) => mudarLinha(indice, { notaFiscalId: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {notasDisponiveis.map((p) => (
                      <SelectItem key={p.nota_fiscal_id} value={String(p.nota_fiscal_id)}>
                        {p.codigo_pasta} — nota {p.numero_nota_fiscal} — saldo{" "}
                        {formatarMoeda(p.saldo_receber)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={linha.data}
                  onChange={(e) => mudarLinha(indice, { data: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">Valor</Label>
                <Input
                  inputMode="decimal"
                  value={linha.valor}
                  onChange={(e) => mudarLinha(indice, { valor: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Remover item"
                onClick={() => setLinhas((atual) => atual.filter((_, i) => i !== indice))}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="self-start" onClick={adicionarLinha}>
            Adicionar item
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Voltar
          </Button>
          <Button
            disabled={linhas.length === 0 || !valido || mutacao.isPending}
            onClick={() => void submeter()}
          >
            Confirmar lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
