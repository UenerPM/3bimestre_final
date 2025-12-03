@echo off
REM quickstart-relatorios.bat - Comandos rápidos para Windows

echo.
echo ========================================
echo   Modulo de Relatorios - Quick Start
echo ========================================
echo.

echo [1] Para iniciar o servidor:
echo     npm run dev
echo.

echo [2] Para testar os endpoints:
echo     node backend/testRelatorios.js
echo.

echo [3] Para acessar o dashboard:
echo     http://localhost:3001/dashboard/dashboard.html
echo.

echo [4] Para acessar via menu:
echo     http://localhost:3001/menu.html
echo     (Clique em Dashboard)
echo.

echo [5] Para testar endpoint especifico:
echo     curl http://localhost:3001/api/relatorios/resumo
echo.

echo [6] Para validar saude do servidor:
echo     curl http://localhost:3001/health
echo.

echo ========================================
echo        DOCUMENTACAO DISPONIVEL
echo ========================================
echo.

echo - RELATORIOS_GUIA.md
echo - RELATORIOS_SUMMARY.md
echo - RELATORIOS_CHECKLIST.txt
echo.

echo ========================================
echo Tudo pronto! Comece pelo: npm run dev
echo ========================================
