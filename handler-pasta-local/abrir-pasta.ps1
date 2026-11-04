# Handler do protocolo customizado "fera-pasta" — abre uma janela de pasta
# comum no Explorador de Arquivos no caminho recebido pela URL.
#
# Instalado por instalar.cmd (HKCU) como:
#   powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "<este script>" "<url>"
#
# Superfície mínima: extrai apenas o valor de "caminho=", decodifica o
# percent-encoding (até duas passadas — o Chrome re-codifica a URL ao despachar
# protocolos customizados), valida o mesmo padrão de caminho Windows da
# aplicação e executa somente o explorer.exe. Entrada fora do padrão encerra
# sem abrir nada e sem passar o conteúdo recebido a nenhum outro comando.

param([string]$Url)

if ([string]::IsNullOrWhiteSpace($Url)) { exit 0 }

# Extrai o valor de "caminho=" e corta no próximo "&" — nada além do caminho é usado.
$marcador = 'caminho='
$indice = $Url.IndexOf($marcador, [System.StringComparison]::OrdinalIgnoreCase)
if ($indice -lt 0) { exit 0 }
$bruto = $Url.Substring($indice + $marcador.Length)
$eComercial = $bruto.IndexOf('&')
if ($eComercial -ge 0) { $bruto = $bruto.Substring(0, $eComercial) }

# Decodifica até duas passadas: [System.Uri]::UnescapeDataString decodifica
# sequências UTF-8 (cobre espaços e acentos); a segunda cobre o re-encode do
# Chrome observado no despacho de protocolos customizados.
$caminho = $bruto
for ($passada = 0; $passada -lt 2; $passada++) {
    try {
        $decodificado = [System.Uri]::UnescapeDataString($caminho)
    } catch {
        exit 0
    }
    if ($decodificado -eq $caminho) { break }
    $caminho = $decodificado
}

# Mesmo padrão validado pela edição e pela constraint da tabela: caminho
# Windows absoluto (letra de unidade seguida de ":\"), sem caracteres de controle.
if ($caminho -notmatch '^[A-Za-z]:\\') { exit 0 }
if ($caminho -match '[\u0000-\u001F\u007F]') { exit 0 }

Start-Process explorer.exe "`"$caminho`""
