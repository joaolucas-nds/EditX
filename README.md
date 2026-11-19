# EditX

Editor editorial para produção em massa: um template `.editx` (páginas, frames de texto, imagem e forma, estilos
herdados) é preenchido com dados para gerar catálogos e peças em lote.

**Estado:** em desenvolvimento, uso privado. Já funciona: leitura e validação do template, herança de estilos, canvas
nítido em qualquer zoom, texto com fontes reais e quebra de linha, frames de imagem (caminho relativo à pasta do
projeto) e de forma, e os stores do editor com desfazer/refazer. Próximo: seleção e arraste no canvas.

## Stack
Vite + React + TypeScript, Fabric.js (canvas), Zustand + Immer (estado), opentype.js (métrica de fonte), Vitest.

## Rodar
```
npm install
npm run dev
```
Abre em `http://localhost:5173/`. Testes: `npm test` · lint: `npm run lint` · build: `npm run build`.
Ambiente e problemas conhecidos: `meta/SETUP.md`.

## Documentação
O contexto do projeto mora em `meta/`: `CONTEXT.md` (visão, stack, armadilhas), `STATUS.md` (o agora),
`DECISIONS.md` (o porquê), `CHANGELOG.md` (versões). O trabalho é feito por ordens de serviço em `meta/workorders/`.
