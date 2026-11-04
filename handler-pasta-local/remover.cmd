@echo off
rem Remove o handler do protocolo "fera-pasta" do usuario atual.

reg delete "HKCU\Software\Classes\fera-pasta" /f >nul 2>&1
if errorlevel 1 (
  echo Handler "fera-pasta" nao estava instalado para este usuario. Nada a fazer.
  pause
  exit /b 0
)

echo Handler "fera-pasta" removido do usuario atual.
reg query "HKCU\Software\Classes\fera-pasta" >nul 2>&1
if errorlevel 1 (
  echo Confirmado: a chave nao existe mais.
) else (
  echo ATENCAO: a chave ainda existe; verifique o registro manualmente.
)
pause
