@echo off
rem Instala o handler do protocolo "fera-pasta" para o usuario atual (HKCU),
rem sem elevacao de administrador. Rodar uma unica vez por maquina/usuario.

setlocal
set "DIR=%~dp0"

rem "URL Protocol" vazio marca a chave como protocolo de URL.
reg add "HKCU\Software\Classes\fera-pasta" /ve /d "URL:Fera Pasta" /f >nul || goto :erro
reg add "HKCU\Software\Classes\fera-pasta" /v "URL Protocol" /t REG_SZ /d "" /f >nul || goto :erro

rem Comando acionado pelo navegador: o %%1 do registro recebe a URL completa
rem entre aspas; o caminho do ps1 e resolvido relativo a este instalador.
reg add "HKCU\Software\Classes\fera-pasta\shell\open\command" /ve /d "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File \"%DIR%abrir-pasta.ps1\" \"%%1\"" /f >nul || goto :erro

echo Handler "fera-pasta" instalado para o usuario atual.
echo.
echo Chave shell\open\command registrada:
reg query "HKCU\Software\Classes\fera-pasta\shell\open\command" /ve
echo.
echo Pronto: abrir uma pasta no Fera agora aciona o Explorador de Arquivos.
echo O primeiro clique pede confirmacao no Chrome - marque "Sempre permitir".
pause
exit /b 0

:erro
echo ERRO: falha ao criar as chaves de registro do protocolo fera-pasta.
pause
exit /b 1
