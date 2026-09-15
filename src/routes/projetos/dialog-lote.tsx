import { useEffect, useState } from "react"
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
import { dataLocalHoje, formatarMoeda, formatarValorDecimal, mensagemDeErro } from "@/lib/formato"
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

  // O diálogo fica montado na listagem (design D2): as linhas nunca persistem
  // entre aberturas — a regra de nota única pressupõe estado limpo a cada abertura.
  useEffect(() => {
    if (aberto) setLinhas([])
  }, [aberto])

  function adicionarLinha() {
    setLinhas((atual) => [...atual, { notaFiscalId: "", data: dataLocalHoje(), valor: "" }])
  }

  function mudarLinha(indice: number, campos: Partial<LinhaLote>) {
    setLinhas((atual) =>
      atual.map((linha, i) => (i === indice ? { ...linha, ...campos } : linha)),
    )
  }

  // O pre-fill pertence à nota escolhida (designs D1/D6): selecionar ou trocar a
  // nota sobrescreve o valor da linha com o saldo corrente da nota.
  function selecionarNota(indice: number, notaFiscalId: string) {
    const nota = notasDisponiveis.find((p) => String(p.nota_fiscal_id) === notaFiscalId)
    mudarLinha(indice, {
      notaFiscalId,
      valor: nota ? formatarValorDecimal(nota.saldo_receber ?? 0) : "",
    })
  }

  function saldoDaLinha(linha: LinhaLote): number {
    const nota = notasDisponiveis.find((p) => String(p.nota_fiscal_id) === linha.notaFiscalId)
    return nota?.saldo_receber ?? 0
  }

  function erroDaLinha(linha: LinhaLote): string | null {
    if (linha.notaFiscalId === "") return null
    const numero = Number(linha.valor.replace(",", "."))
    if (!Number.isFinite(numero) || numero <= 0) return "Informe um valor positivo"
    const saldo = saldoDaLinha(linha)
    if (numero > saldo) return `O valor excede o saldo de ${formatarMoeda(saldo)}`
    return null
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

  const valido =
    linhas.length > 0 &&
    linhas.every(
      (linha) =>
        linha.notaFiscalId !== "" && linha.data !== "" && erroDaLinha(linha) === null,
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
          {linhas.map((linha, indice) => {
            // Nota já escolhida em OUTRA linha: visível, porém desabilitada (design D5).
            // Excluir a própria linha do conjunto permite a troca devolver a nota ao select.
            const emUso = new Set(
              linhas
                .filter((_, i) => i !== indice)
                .map((l) => l.notaFiscalId)
                .filter(Boolean),
            )
            const erro = erroDaLinha(linha)
            return (
              <div key={indice} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-end gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <Label className="text-xs">Nota (projeto)</Label>
                  <Select
                    value={linha.notaFiscalId}
                    onValueChange={(v) => selecionarNota(indice, v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {notasDisponiveis.map((p) => {
                        const idNota = String(p.nota_fiscal_id)
                        const jaEmUso = emUso.has(idNota)
                        return (
                          <SelectItem key={idNota} value={idNota} disabled={jaEmUso}>
                            {p.codigo_pasta} — nota {p.numero_nota_fiscal} — saldo{" "}
                            {formatarMoeda(p.saldo_receber)}
                            {jaEmUso ? " — já em uso" : ""}
                          </SelectItem>
                        )
                      })}
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
                  {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
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
            )
          })}
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
