// Avança a versão do package.json em 1 por commit, com carry de dígito a
// cada 9 (spec interface-web): v0.1.9 → v0.2.0, v0.9.9 → v1.0.0, v1.9.9 → v2.0.0.
// Opera no package.json do diretório corrente — o hook executa a partir da
// raiz da árvore de trabalho.
import { readFileSync, writeFileSync } from "node:fs"

const pacote = JSON.parse(readFileSync("package.json", "utf8"))
const [maior, menor, patch] = pacote.version.split(".").map(Number)

let novoPatch = patch + 1
let novoMenor = menor
let novoMaior = maior
if (novoPatch > 9) {
  novoPatch = 0
  novoMenor += 1
}
if (novoMenor > 9) {
  novoMenor = 0
  novoMaior += 1
}

pacote.version = `${novoMaior}.${novoMenor}.${novoPatch}`
writeFileSync("package.json", JSON.stringify(pacote, null, 2) + "\n")
console.log(`versão: ${maior}.${menor}.${patch} → ${pacote.version}`)
