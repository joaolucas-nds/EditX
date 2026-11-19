# SETUP.md — Guia de Ambiente

> **Opcional, para o humano.** Como instalar, configurar e rodar o projeto do zero nesta máquina, e o que já deu errado. **Não entra no ritual de leitura** do assistente: ele o consulta quando o assunto é ambiente, e acrescenta aqui o passo que resolveu um bloqueio.

---

## Pré-requisitos
- Windows com CMD (Prompt de Comando) e Git for Windows (Git Bash vem junto).
- Node.js com npm (o projeto usa Vite 8, TypeScript 6 e Vitest; versões exatas no `package.json`).
- Claude Code instalado, para aplicar as WOs (`/apply-wo`).

## Instalar
1. Clonar o repositório dentro de `C:\Users\alexk\Tools\Editorial\` (a pasta-pai `Editorial` guarda os relatórios e as notas; o chat lê de lá).
2. Na pasta `EditX`: `npm install`.

## Rodar
- Desenvolvimento: `npm run dev` → `http://localhost:5173/` (a página do exemplo; `?page=<id>` escolhe a página).
- Build: `npm run build` (`tsc -b` + Vite).
- A rede: `npm test`, `npm run lint`, `npm run build` (ver CONTEXT, «Build e validação»).
- Formatar: `npm run format` (Prettier em `src/`).

## Configurar
- Nada de `.env` por enquanto. Nunca o valor secreto aqui.
- `.claude/settings.local.json` é do usuário (o Claude Code o cria com caminhos desta máquina) e fica fora do Git.

## Já deu errado (e como saiu)
- **[2026-11-11] `python3` trava no Git Bash** — é o stub da Microsoft Store, que espera instalar → script de apoio em `node` (CEREBRO, «Técnicas específicas deste projeto»).
- **[2026-11-15] `git push` sem resposta (SSH, porta 22)** — causa não medida; o dono fez o push depois (log de 2026-11-15) → se voltar: SSH pela porta 443 (docs do GitHub), no `~/.ssh/config`: `Host github.com`, `Hostname ssh.github.com`, `Port 443`. Ainda não usado aqui.
