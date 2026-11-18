# WO 0016 — Stores do editor: documento, histórico (desfazer/refazer) e seleção (DEC-021)

> **Tipo:** mista — CÓDIGO (três stores + teste, host React) + DOC (registro nos `meta/`).
> **Config sugerida:** Opus · `/effort` alto — o primeiro estado global do app; todo o resto vai ler e escrever por aqui.
> **Pré-requisito:** escrita sobre `6abc413` (`docs: registra conferencia de tela do FrameShape`), já em `origin/main`; árvore limpa exceto os arquivos que o chat gravou (lista abaixo). 151 testes verdes (relatório da wo0014; a wo0015 foi só de doc).
> **Base:** `meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`, decidida pelo dono em 2026-11-18 (stores primeiro; desfazer junto; no arraste o conteúdo acompanha ao mover e só a caixa ao redimensionar — esta última vale para a WO seguinte). Decisão: DEC-021 (Edição 8). DEC-004 (Zustand + Immer) continua valendo.
> **Depende de:** wo0015 (aplicada: `6abc413`).
> **Arquivos que o chat gravou no disco e esta WO versiona** (`sha1sum` medido pelo chat ao gravar):
> - `6034a5b69f49f1705e4999d32336cb8e69c42db6  meta/CONTEXT.md`
> - `18ac6cc65e57a38634ff81aaa2075a75962a6c9a  meta/analises/261118-ANALISE-ordem-selecao-e-stores.md` (novo, `??`)
> **Âncora semântica:** se um trecho-âncora não bater EXATAMENTE, **PARE e reporte**.
> **Idempotência:** antes de cada edição, procure o texto NOVO INTEIRO no arquivo. Já está lá **e a âncora não** (salvo forma «trocar», em que a âncora está dentro do texto novo) = já aplicada: **PULE** e diga no relatório. Arquivo novo que já existe: **PARE e reporte** (salvo o `App.tsx`, que é substituído).
> **Âncoras lidas em** (pelo chat, 2026-11-18, no disco, neste turno, sobre `6abc413`): `src/App.tsx` inteiro (substituído); `meta/STATUS.md` — nota de revisão (3 linhas), `**v0.0.0** …`, o começo da linha `- **Forma aparece no canvas** …`, as linhas de backlog do `SelectionManager.ts` e dos stores, «Última conversa» e rodapé; `meta/ROADMAP.md` — as linhas do `SelectionManager.ts` e dos stores na F1; `meta/CHANGELOG.md` — o começo da linha «Forma no canvas» em Adicionado; `meta/DECISIONS.md` — `## Template para novo ADR (copie e preencha)` (1 ocorrência); `logs/2026-11-18.md` — a última linha.
> **Medido pelo chat** (2026-11-18, no código instalado e no repositório): **zustand 4.5.7** — `zustand/vanilla` exporta `createStore` e o tipo `StoreApi`; `zustand` (raiz) reexporta `vanilla` e `react`, com `useStore(api, selector)`. **immer 10.2.0** — `enablePatches`, `produceWithPatches`, `applyPatches`, tipos `Draft` e `Patch`. **Formato:** ids de frame são únicos no documento inteiro (o validador usa um `frameIds` só para todas as páginas), então o store acha um frame sem saber a página. `src/store/` não existe.
> **Simulado pelo chat:** as edições aplicadas numa cópia do repositório a partir do texto DESTA WO; `tsc -p tsconfig.app.json --noEmit`, `eslint` e `prettier --check` nos arquivos tocados, e os testes NOVOS (H1–H13) rodados com uma réplica mínima do `vitest` sobre o JS compilado, com o zustand e o immer de verdade — resultado no relatório do chat. A suíte completa é do seu shell.

> **Canal dos meta neste ciclo = CODE** para `STATUS.md`, `ROADMAP.md`, `CHANGELOG.md`, `DECISIONS.md` e o log (Edições 5–9). `meta/CONTEXT.md` e a análise são do chat e já estão gravados — **só versione**. A seção do chat no log vai DENTRO da Edição 9 (o arquivo já tem seções do Code).

---

## 1. Por que

A seleção (próxima WO) é a primeira vez que a tela muda o `.editx`. Esta WO cria o lugar onde o documento mora e muda: `createEditorStores(template)` devolve três stores em `zustand/vanilla` — **documento** (o template aberto e a página ativa), **histórico** (desfazer/refazer) e **seleção** (ids selecionados). Toda mudança do template passa por um ponto único, `edit`, que roda a receita com `produceWithPatches` do Immer e grava os patches no histórico: qualquer ação futura ganha desfazer de graça. Página ativa e seleção não entram no histórico. A primeira ação é `setFrameTransform` — a que a seleção vai chamar ao soltar um arraste.

O `App` passa a ler o template e a página do store (`useStore` do zustand); o `CanvasView` não muda. **Na tela nada muda** — a conferência é ver o canvas igual e, pelo console, mover um frame e desfazer (os stores ficam em `window.__editx` só no `npm run dev`).

---

## Edição 0 — conferência antes de tudo (não edita nada)

1. `sha1sum` nos dois arquivos da lista do cabeçalho. Hash diferente = **PARE e reporte**.
2. Baseline: `npm run lint`, `npm run build`, `npm test` — cru. Esperado: 0 erros, build verde, `Tests  151 passed (151)` (do relatório da wo0014 — número diferente: relate o cru e siga).
3. `git status -sb` sem `ahead`/`behind`; `git status --short -uall` = `M meta/CONTEXT.md`, `?? meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`, `?? meta/workorders/261118-wo0016-stores-do-editor.md`.

## Edição 1 — `src/store/historyStore.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * historyStore.ts
 *
 * Pilhas de desfazer e refazer (DEC-021). Cada entrada guarda os patches de UMA mudança
 * do template e os inversos dela — quem aplica é o `documentStore`; este store só faz a
 * contabilidade das pilhas. Não conhece o documento.
 */

import type { Patch } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

/** Uma mudança do template: o que ela fez e como desfazê-la. */
export interface HistoryEntry {
  /** Rótulo curto da ação (ex.: «mover frame-foto-produto») — para a UI e para depurar. */
  label: string;
  patches: Patch[];
  inversePatches: Patch[];
}

export interface HistoryState {
  /** Mudanças feitas, da mais antiga à mais recente. */
  past: HistoryEntry[];
  /** Mudanças desfeitas, da mais antiga à mais recente (a próxima a refazer é a última). */
  future: HistoryEntry[];
  /** Grava uma mudança nova: apaga o que dava para refazer e respeita o limite. */
  record(entry: HistoryEntry): void;
  /** Tira a última mudança de `past` e a põe em `future`. @returns a entrada, ou `undefined`. */
  takeUndo(): HistoryEntry | undefined;
  /** Tira a última de `future` e a devolve a `past`. @returns a entrada, ou `undefined`. */
  takeRedo(): HistoryEntry | undefined;
  /** Esvazia as duas pilhas. */
  clear(): void;
}

/**
 * Cria o store do histórico.
 *
 * @param limit - quantas mudanças `past` guarda; passou disso, a mais antiga sai
 */
export function createHistoryStore(limit: number): StoreApi<HistoryState> {
  return createStore<HistoryState>()((set, get) => ({
    past: [],
    future: [],
    record: (entry) => {
      const past = [...get().past, entry];
      set({ past: past.length > limit ? past.slice(past.length - limit) : past, future: [] });
    },
    takeUndo: () => {
      const { past, future } = get();
      const entry = past.at(-1);
      if (entry === undefined) return undefined;
      set({ past: past.slice(0, -1), future: [...future, entry] });
      return entry;
    },
    takeRedo: () => {
      const { past, future } = get();
      const entry = future.at(-1);
      if (entry === undefined) return undefined;
      set({ past: [...past, entry], future: future.slice(0, -1) });
      return entry;
    },
    clear: () => set({ past: [], future: [] }),
  }));
}
```

## Edição 2 — `src/store/selectionStore.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * selectionStore.ts
 *
 * Quais frames estão selecionados (DEC-021). Só ids — o frame em si mora no
 * `documentStore`. Seleção não entra no histórico.
 */

import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';

export interface SelectionState {
  /** Ids dos frames selecionados, na ordem em que foram escolhidos, sem repetição. */
  selectedIds: string[];
  /** Troca a seleção por estes ids (repetidos contam uma vez). */
  select(ids: readonly string[]): void;
  /** Nada selecionado. */
  clear(): void;
}

/** Cria o store da seleção, vazio. */
export function createSelectionStore(): StoreApi<SelectionState> {
  return createStore<SelectionState>()((set) => ({
    selectedIds: [],
    select: (ids) => set({ selectedIds: [...new Set(ids)] }),
    clear: () => set({ selectedIds: [] }),
  }));
}
```

## Edição 3 — `src/store/documentStore.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
/**
 * documentStore.ts
 *
 * O documento aberto no editor e as ações que o mudam (DEC-004, DEC-021). Toda mudança do
 * template passa por `edit`, que roda a receita com `produceWithPatches` do Immer e grava
 * os patches no `historyStore` — é o que faz desfazer e refazer valerem para qualquer ação,
 * presente ou futura. Página ativa e seleção NÃO entram no histórico. Os stores são de
 * `zustand/vanilla`: funcionam fora do React (e nos testes, em Node); o React lê com
 * `useStore` do `zustand`.
 */

import { applyPatches, enablePatches, produceWithPatches } from 'immer';
import type { Draft } from 'immer';
import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { EditxTemplate } from '../template/TemplateSchema';
import type { Transform } from '../types/frame.types';
import { createHistoryStore } from './historyStore';
import type { HistoryState } from './historyStore';
import { createSelectionStore } from './selectionStore';
import type { SelectionState } from './selectionStore';

enablePatches();

export interface DocumentState {
  /** O template aberto — uma cópia do que foi carregado, nunca o objeto de quem chamou. */
  template: EditxTemplate;
  /** Página mostrada no canvas. */
  pageId: string;
  /**
   * Troca a página mostrada. Não entra no histórico; limpa a seleção.
   * @throws Error se a página não existe.
   */
  setPage(pageId: string): void;
  /**
   * Troca o `transform` de um frame — o que a seleção chama ao soltar um arraste. Valores
   * iguais aos atuais não mudam nada e não entram no histórico.
   * @throws Error se o frame não existe.
   */
  setFrameTransform(frameId: string, transform: Transform): void;
  /** Desfaz a última mudança do template. @returns `false` se não havia o que desfazer. */
  undo(): boolean;
  /** Refaz a última mudança desfeita. @returns `false` se não havia o que refazer. */
  redo(): boolean;
}

/** Os três stores de um editor aberto, ligados entre si. */
export interface EditorStores {
  document: StoreApi<DocumentState>;
  history: StoreApi<HistoryState>;
  selection: StoreApi<SelectionState>;
}

export interface EditorStoresOptions {
  /** Página inicial; padrão: a primeira do template. */
  pageId?: string;
  /** Quantas mudanças o histórico guarda; padrão: 100. */
  historyLimit?: number;
}

/** Ids de frame são únicos no documento inteiro (o validador cobra), então basta procurar em todas as páginas. */
function hasFrame(template: EditxTemplate, frameId: string): boolean {
  return template.pages.some((page) => page.frames.some((frame) => frame.id === frameId));
}

/**
 * Cria os stores de um editor com `template` aberto. Guarda uma CÓPIA do template: o Immer
 * congela o estado depois da primeira mudança, e o objeto de quem chamou não deve mudar
 * nem congelar.
 *
 * @throws Error se `options.pageId` não existe no template, ou se ele não tem páginas.
 */
export function createEditorStores(
  template: EditxTemplate,
  options: EditorStoresOptions = {},
): EditorStores {
  const initial = structuredClone(template);
  const pageId = options.pageId ?? initial.pages[0]?.id;
  if (pageId === undefined || !initial.pages.some((page) => page.id === pageId)) {
    throw new Error(`A página "${String(pageId)}" não existe no template.`);
  }
  const history = createHistoryStore(options.historyLimit ?? 100);
  const selection = createSelectionStore();

  const document = createStore<DocumentState>()((set, get) => {
    /** Ponto ÚNICO de mudança do template: aplica a receita e grava os patches, se algo mudou. */
    const edit = (label: string, recipe: (draft: Draft<EditxTemplate>) => void): void => {
      const [next, patches, inversePatches] = produceWithPatches(get().template, recipe);
      if (patches.length === 0) return;
      set({ template: next });
      history.getState().record({ label, patches, inversePatches });
    };

    return {
      template: initial,
      pageId,
      setPage: (next) => {
        if (!get().template.pages.some((page) => page.id === next)) {
          throw new Error(`A página "${next}" não existe no template.`);
        }
        set({ pageId: next });
        selection.getState().clear();
      },
      setFrameTransform: (frameId, transform) => {
        if (!hasFrame(get().template, frameId)) {
          throw new Error(`O frame "${frameId}" não existe no template.`);
        }
        edit(`mover ${frameId}`, (draft) => {
          for (const page of draft.pages) {
            const frame = page.frames.find((candidate) => candidate.id === frameId);
            // Campo por campo: valor igual não é mudança para o Immer; objeto novo seria.
            if (frame !== undefined) Object.assign(frame.transform, transform);
          }
        });
      },
      undo: () => {
        const entry = history.getState().takeUndo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.inversePatches) });
        return true;
      },
      redo: () => {
        const entry = history.getState().takeRedo();
        if (entry === undefined) return false;
        set({ template: applyPatches(get().template, entry.patches) });
        return true;
      },
    };
  });

  return { document, history, selection };
}
```

## Edição 4a — `src/store/documentStore.test.ts` · criar arquivo novo

**Criar arquivo novo:**

```ts
import { describe, expect, it } from 'vitest';
import { catalogoSimplesExample } from '../template/__examples__/catalogo-simples.example';
import { validateTemplate } from '../template/TemplateValidator';
import type { Transform } from '../types/frame.types';
import { createEditorStores } from './documentStore';
import type { EditorStores } from './documentStore';

const FOTO = 'frame-foto-produto';
const NOME = 'frame-nome-produto';
const moved: Transform = { x: 20, y: 70, width: 190, height: 120, rotation: 0 };

/** O `transform` do frame `id` no estado atual do documento. */
function transformOf(stores: EditorStores, id: string): Transform {
  for (const page of stores.document.getState().template.pages) {
    const frame = page.frames.find((candidate) => candidate.id === id);
    if (frame !== undefined) return frame.transform;
  }
  throw new Error(`o frame ${id} sumiu`);
}

const open = (pageId = 'page-produto', historyLimit?: number) =>
  createEditorStores(catalogoSimplesExample, { pageId, historyLimit });

describe('createEditorStores', () => {
  it('H1: guarda uma cópia do template e abre na primeira página por padrão', () => {
    const original = structuredClone(catalogoSimplesExample);
    const stores = createEditorStores(original);
    original.pages[1].frames[2].transform.x = 999;
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.document.getState().pageId).toBe('page-capa');
  });

  it('H2: página inicial que não existe lança', () => {
    expect(() => open('nao-existe')).toThrow('nao-existe');
  });

  it('H3: setFrameTransform muda só aquele frame e grava uma entrada', () => {
    const stores = open();
    stores.document.getState().setFrameTransform(FOTO, moved);
    expect(transformOf(stores, FOTO)).toEqual(moved);
    expect(transformOf(stores, NOME).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(stores.history.getState().past[0].label).toBe(`mover ${FOTO}`);
    expect(stores.history.getState().future).toHaveLength(0);
  });

  it('H4: desfazer volta ao anterior e refazer refaz', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    expect(stores.document.getState().undo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(10);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.history.getState().future).toHaveLength(1);
    expect(stores.document.getState().redo()).toBe(true);
    expect(transformOf(stores, FOTO).x).toBe(20);
  });

  it('H5: mudança nova depois de desfazer apaga o que dava para refazer', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...moved, x: 30 });
    expect(stores.history.getState().future).toHaveLength(0);
    expect(stores.history.getState().past).toHaveLength(1);
    expect(doc.redo()).toBe(false);
  });

  it('H6: mudança que não muda nada não entra no histórico nem troca o template', () => {
    const stores = open();
    const before = stores.document.getState().template;
    stores.document.getState().setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(stores.history.getState().past).toHaveLength(0);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H7: frame que não existe lança e não grava nada', () => {
    const stores = open();
    expect(() => stores.document.getState().setFrameTransform('nao-existe', moved)).toThrow(
      'nao-existe',
    );
    expect(stores.history.getState().past).toHaveLength(0);
  });

  it('H8: passou do limite, a mudança mais antiga sai', () => {
    const stores = open('page-produto', 3);
    const doc = stores.document.getState();
    for (const x of [21, 22, 23, 24]) doc.setFrameTransform(FOTO, { ...moved, x });
    expect(stores.history.getState().past).toHaveLength(3);
    doc.undo();
    doc.undo();
    doc.undo();
    expect(transformOf(stores, FOTO).x).toBe(21);
    expect(doc.undo()).toBe(false);
  });

  it('H9: desfazer e refazer sem nada são inofensivos', () => {
    const stores = open();
    const before = stores.document.getState().template;
    expect(stores.document.getState().undo()).toBe(false);
    expect(stores.document.getState().redo()).toBe(false);
    expect(stores.document.getState().template).toBe(before);
  });

  it('H10: trocar de página não entra no histórico e limpa a seleção', () => {
    const stores = open();
    stores.selection.getState().select([FOTO]);
    stores.document.getState().setPage('page-capa');
    expect(stores.document.getState().pageId).toBe('page-capa');
    expect(stores.selection.getState().selectedIds).toEqual([]);
    expect(stores.history.getState().past).toHaveLength(0);
    expect(() => stores.document.getState().setPage('nao-existe')).toThrow('nao-existe');
  });

  it('H11: seleção sem repetição, e limpa', () => {
    const stores = open();
    stores.selection.getState().select([FOTO, FOTO, NOME]);
    expect(stores.selection.getState().selectedIds).toEqual([FOTO, NOME]);
    stores.selection.getState().clear();
    expect(stores.selection.getState().selectedIds).toEqual([]);
  });

  it('H12: depois de mudar, desfazer e refazer, o documento continua válido', () => {
    const stores = open();
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.redo();
    expect(validateTemplate(stores.document.getState().template).ok).toBe(true);
  });

  it('H13: quem assina o documento é avisado da mudança e do desfazer — e não da mudança vazia', () => {
    const stores = open();
    let calls = 0;
    stores.document.subscribe(() => {
      calls += 1;
    });
    const doc = stores.document.getState();
    doc.setFrameTransform(FOTO, moved);
    doc.undo();
    doc.setFrameTransform(FOTO, { ...transformOf(stores, FOTO) });
    expect(calls).toBe(2);
  });
});
```

## Edição 4b — `src/App.tsx` · substituir o arquivo inteiro

**Criar arquivo novo** (substitui o conteúdo atual inteiro):

```tsx
import { useStore } from 'zustand';
import { UrlProjectFiles } from './project/ProjectFiles';
import { createEditorStores } from './store/documentStore';
import { catalogoSimplesExample } from './template/__examples__/catalogo-simples.example';
import { CanvasView } from './ui/CanvasView';

/**
 * Pasta de projeto do exemplo, servida pelo Vite a partir de `public/exemplo/` (DEC-019).
 * No escopo do módulo: a mesma instância a cada renderização (é dependência de efeito).
 */
const exampleFiles = new UrlProjectFiles('/exemplo/');

/**
 * O editor aberto com o exemplo (DEC-021). Página inicial: `?page=<id>` na URL (ex.:
 * `?page=page-capa`), ou a de produto — atalho de desenvolvimento até existir a UI.
 */
const stores = createEditorStores(catalogoSimplesExample, {
  pageId: new URLSearchParams(window.location.search).get('page') ?? 'page-produto',
});

// Só no `npm run dev`: o console alcança os stores (ex.: `__editx.document.getState().undo()`).
if (import.meta.env.DEV) (window as unknown as { __editx?: typeof stores }).__editx = stores;

/**
 * Host de desenvolvimento: mostra a página ativa do documento no canvas, ocupando a janela.
 * Some quando existir a UI do editor.
 */
export default function App() {
  const template = useStore(stores.document, (state) => state.template);
  const pageId = useStore(stores.document, (state) => state.pageId);
  return <CanvasView template={template} pageId={pageId} files={exampleFiles} />;
}
```

## Edição 5a — `meta/STATUS.md` · nota de revisão

**Âncora:**

```
**Mudanças nesta revisão (2026-11-18, wo0015):** `FrameShape.ts` conferido na tela pelo chat; o item sai de «Em
Progresso» e o próximo do backlog é `SelectionManager.ts`. A nota anterior (wo0014) saiu — o que ela registrava está
em DEC-020, no CHANGELOG e no log de 2026-11-18.
```

**Substituir por:**

```
**Mudanças nesta revisão (2026-11-18, wo0016):** stores do editor feitos (DEC-021) e o backlog reordenado — stores
antes da seleção; conferência de tela pelo chat em «Em Progresso». A nota anterior (wo0015) saiu — o que ela
registrava está no log de 2026-11-18.
```

## Edição 5b — `meta/STATUS.md` · versão

**Âncora:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 8 de 15 itens prontos)
```

**Substituir por:**

```
**v0.0.0** — ainda não lançado (Fase 1/F1 do ROADMAP em andamento, 9 de 15 itens prontos)
```

## Edição 5c — `meta/STATUS.md` · Funcionando (stores)

**Âncora** (o COMEÇO da linha da forma — troque só este trecho; o resto da linha fica como está):

```
- **Forma aparece no canvas**
```

**Substituir por:**

```
- **Documento nos stores, com desfazer e refazer** *(wo0016, DEC-021; conferência de tela pendente — ver «Em Progresso»)* — `createEditorStores(template)` (`store/documentStore.ts`) guarda uma cópia do template e a página ativa; toda mudança passa por `edit` (`produceWithPatches` do Immer) e entra no `historyStore` (limite 100; mudança vazia não entra); `undo`/`redo` aplicam os patches; `selectionStore` guarda os ids selecionados. Página e seleção não entram no histórico. Primeira ação: `setFrameTransform`. O `App` lê o documento com `useStore`; no `npm run dev` os stores ficam em `window.__editx`. Testado em Node (H1–H13)
- **Forma aparece no canvas**
```

## Edição 5d — `meta/STATUS.md` · Em Progresso

**Âncora:**

```
*Nada em progresso — próximo item do backlog é `SelectionManager.ts`.*
```

**Substituir por:**

```
- **Conferência de tela dos stores** — o chat confere no navegador embutido com o `npm run dev` do dono rodando: o canvas igual a antes, e pelo console (`window.__editx`) mover um frame, ver o canvas acompanhar, desfazer e refazer. Depois dela, o próximo item do backlog é `SelectionManager.ts`.
```

## Edição 5e — `meta/STATUS.md` · Backlog (stores antes da seleção)

**Âncora:**

```
- [ ] `SelectionManager.ts` — seleção simples, mover, redimensionar ← **próximo**
- [ ] `documentStore.ts` + `selectionStore.ts` + `historyStore.ts`
```

**Substituir por:**

```
- [x] `documentStore.ts` + `selectionStore.ts` + `historyStore.ts` (wo0016, DEC-021 — antes da seleção, por decisão do dono)
- [ ] `SelectionManager.ts` — seleção simples, mover (o conteúdo acompanha), redimensionar (só a caixa até soltar), Ctrl+Z/Ctrl+Shift+Z, cache das imagens decodificadas — DEC-021 ← **próximo**
```

## Edição 5f — `meta/STATUS.md` · Última conversa e rodapé

**Âncora:**

```
**Onde parou:** `FrameShape.ts` conferido na tela pelo chat (wo0015); o próximo item do backlog é `SelectionManager.ts`.

---

*Próximo passo: `SelectionManager.ts` (seleção simples, mover, redimensionar) — muda o `.editx` a partir da tela, então provavelmente pede antes os stores (`documentStore`/`historyStore`) ou uma análise de ordem; pelo chat.*
```

**Substituir por:**

```
Depois: análise da ordem entre seleção e stores, decidida pelo dono (DEC-021), e os stores (wo0016).
**Onde parou:** wo0016 aplicada; falta a conferência de tela dos stores pelo chat.

---

*Próximo passo: conferência de tela dos stores (chat, navegador embutido); depois, `SelectionManager.ts` — WO a escrever pelo chat.*
```

## Edição 6 — `meta/ROADMAP.md` · F1 (stores antes da seleção)

**Âncora:**

```
- [ ] `SelectionManager.ts` — seleção, mover, redimensionar
- [ ] Stores: `documentStore`, `selectionStore`, `historyStore`
```

**Substituir por:**

```
- [x] Stores: `documentStore`, `selectionStore`, `historyStore` (desfazer por patches do Immer: wo0016, DEC-021)
- [ ] `SelectionManager.ts` — seleção, mover, redimensionar (sobre os stores — DEC-021)
```

## Edição 7 — `meta/CHANGELOG.md` · Adicionado

**Âncora** (o COMEÇO da linha da forma — troque só este trecho; o resto da linha fica como está):

```
- Forma no canvas — retângulo (com
```

**Substituir por:**

```
- Stores do editor — `createEditorStores` (`store/documentStore.ts`, `historyStore.ts`, `selectionStore.ts`, em `zustand/vanilla`): documento aberto e página ativa, desfazer/refazer por patches do Immer (toda mudança passa por um ponto único; mudança vazia não entra), seleção por ids; o host lê o documento do store. Ver DEC-021
- Forma no canvas — retângulo (com
```

## Edição 8 — `meta/DECISIONS.md` · DEC-021

**Âncora:**

```
## Template para novo ADR (copie e preencha)
```

**Substituir por:**

```
## DEC-021 — Stores antes da seleção; toda mudança do documento passa por um ponto que grava o desfazer

**Data:** 2026-11-18
**Status:** aceita
**Autor:** dono (ordem e comportamento do arraste) + chat (análise e desenho dos stores)

### Contexto
A seleção é o primeiro passo em que a tela muda o `.editx`, e não havia lugar para o documento mudar
(`src/store/` não existia). O backlog listava a seleção antes dos stores. Análise:
`meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`.

### Decisão
- **Ordem:** stores primeiro (wo0016), seleção depois.
- **Três stores em `zustand/vanilla`**, criados juntos por `createEditorStores(template)` — documento (cópia do
  template + página ativa), histórico (pilhas de patches, limite 100) e seleção (ids). Factory, não singletons: um
  editor por chamada, e os testes rodam em Node sem React.
- **Desfazer desde já:** toda mudança do template passa por `edit`, que usa `produceWithPatches` e grava os patches
  e os inversos; `undo`/`redo` aplicam com `applyPatches`. Mudança que não muda nada não entra. Página ativa e seleção
  não entram no histórico.
- **Para a seleção (próxima WO):** ao MOVER, o conteúdo acompanha a alça durante o arraste e o documento recebe o
  `transform` ao soltar — uma entrada de desfazer por arraste; ao REDIMENSIONAR, só a caixa muda e o frame é
  redesenhado ao soltar. Junto: `fromPx` com arredondamento, cache das imagens decodificadas, Ctrl+Z/Ctrl+Shift+Z.

### Alternativas consideradas
- **Seleção primeiro, com estado local** — retrabalho certo quando os stores chegassem, e mover sem desfazer.
- **Tudo numa WO só** — três frentes novas no mesmo ciclo.
- **Stores sem histórico** — o histórico muda a forma das ações; acrescentá-lo depois é reescrevê-las.
- **Redesenhar o conteúdo continuamente ao redimensionar** — mais parecido com o Canva, mas redesenha o texto a cada
  movimento do mouse; fica para quando a seleção básica existir.

### Consequências
- **Positivas:** qualquer ação futura ganha desfazer passando por `edit`; os stores são testados sem tela.
- **Negativas:** a wo0016 não muda nada na tela; o redesenho ainda é da página inteira a cada mudança (texto ~1 ms,
  imagem 30–50 ms sem cache — medido em 2026-11-18).
- **Riscos:** ação que faz `set({ template })` sem passar por `edit` fica fora do desfazer, em silêncio; atribuir um
  objeto novo dentro da receita gera entrada vazia de desfazer — armadilhas no CONTEXT.

---

## Template para novo ADR (copie e preencha)
```

## Edição 9 — `logs/2026-11-18.md` · seção do chat (análise e wo0016) e seção do Code

**Âncora** (última linha do arquivo):

```
wo0015 aplicada: `FrameShape.ts` conferido na tela. Próximo item do backlog: `SelectionManager.ts` (WO a escrever pelo chat).
```

**Substituir por:**

```
wo0015 aplicada: `FrameShape.ts` conferido na tela. Próximo item do backlog: `SelectionManager.ts` (WO a escrever pelo chat).

## Chat (planejamento) — análise da ordem seleção × stores e wo0016

### ✅ Feito
- Relatório da wo0015 lido (`6abc413` empurrado) e arquivado.
- Análise `meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`. Medido no navegador embutido (`localhost:5173`,
  5 rodadas com cache aquecido, painel oculto): `prepareTextDrawings` 0,7–1,0 ms; `prepareShapeDrawings` ~0 ms;
  `prepareImageDrawings` 30–50 ms (primeira: 371 ms) — a imagem é lida e decodificada de novo a cada redesenho, e o
  `showPage` limpa tudo antes: com a seleção, a imagem piscaria a cada arraste. Lido no código: texto = um `Path` por
  linha (a seleção precisa de UMA alça por frame); `clipPath` absoluto não acompanha arraste; `lock: true` no fundo da
  capa; o `transform` é em mm e não há o inverso de `toPx`.
- Dono aceitou as três recomendações → DEC-021 (pela wo0016).
- CONTEXT (objetivo, árvore de `src/store/`, duas armadilhas do Immer) e status da análise gravados; wo0016 escrita e
  simulada numa cópia, com o zustand e o immer de verdade.

### ⚖️ Decisões tomadas
- DEC-021 — stores antes da seleção; desfazer por patches desde já; comportamento do arraste para a próxima WO.

### ➡️ Próximos passos
- Conferência de tela dos stores (chat, pelo console); depois `SelectionManager.ts`.
```

E depois dela, uma linha em branco e uma seção `## Code (execução) — wo0016` escrita POR VOCÊ no formato de `meta/LOG-TEMPLATE.md`.

---

## Fora de escopo

- `SelectionManager.ts`, alças, eventos do Fabric, teclado, `fromPx`, cache de imagem (próxima WO).
- Mudar o `CanvasView.tsx` (continua recebendo `template`/`pageId` por props).
- `csvStore.ts`; carregar/salvar `.editx` pelo store; outras ações além de `setFrameTransform`.

## Armadilhas desta WO

- **Python não serve:** `python3` do Git Bash desta máquina trava. Use `node`.
- **`erasableSyntaxOnly`/`verbatimModuleSyntax`:** tipos só via `import type` (como está no texto).
- **Os testes dos stores não importam React nem `fabric`** — só `zustand/vanilla` e `immer`.
- **Edições 5c e 7 trocam o COMEÇO de uma linha longa** — o resto da linha fica intacto.
- **`window.__editx` só existe no `npm run dev`** (`import.meta.env.DEV`); não aparece no build de produção.
- **Não suba o `npm run dev` para «conferir»** — o dono deixa o dele rodando e o chat confere. Se subir, feche antes de commitar e diga.

---

## Depois de aplicar — conferência antes do commit

- [ ] `git status --short -uall` mostra **exatamente**, e nada além: `M logs/2026-11-18.md`, `M meta/CHANGELOG.md`, `M meta/CONTEXT.md`, `M meta/DECISIONS.md`, `M meta/ROADMAP.md`, `M meta/STATUS.md`, `M src/App.tsx`, `?? meta/analises/261118-ANALISE-ordem-selecao-e-stores.md`, `?? meta/workorders/261118-wo0016-stores-do-editor.md`, `?? src/store/documentStore.test.ts`, `?? src/store/documentStore.ts`, `?? src/store/historyStore.ts`, `?? src/store/selectionStore.ts` (13 entradas). Um a mais ou a menos = **VERMELHO**.
- [ ] `npm run lint` — 0 erros. `npm run build` — passa. Cru.
- [ ] `npm test` — passa com **pelo menos 164 testes** (151 + H1–H13). Linha de resumo crua. Menos = **VERMELHO**.
- [ ] **Prova de vida:** em `documentStore.ts`, troque temporariamente `if (patches.length === 0) return;` por nada (apague a linha) e rode `npm test` — esperado **falharem H6 e H13** (2 testes). Restaure; verde. Cole as linhas cruas.
      - **Quem roda:** quem aplica. **Chega no ramo?** `documentStore.test.ts` → `setFrameTransform` → `edit` → o descarte da mudança vazia. **NÃO responde:** se o canvas redesenha quando o store muda — isso é a conferência de tela do chat.
- [ ] Conferências (`grep -c` conta LINHAS):
      - `grep -rlE "from '(react|fabric)'" src/store | wc -l` = 0
      - `grep -c "produceWithPatches(" src/store/documentStore.ts` = 1
      - `grep -c "set({ template:" src/store/documentStore.ts` = 3 (o `edit`, o `undo` e o `redo` — nenhum outro)
      - `grep -c "^## DEC-021" meta/DECISIONS.md` = 1
      - `grep -c "^- \[x\] \`documentStore.ts\`" meta/STATUS.md` = 1
      - `grep -c "^- \[x\] Stores:" meta/ROADMAP.md` = 1
      - `grep -c "^## Code (execução) — wo0016" logs/2026-11-18.md` = 1
      *(escritos pelo chat e simulados na VM Linux, não no seu shell — vermelho aqui é suspeita do instrumento: confira abrindo o arquivo.)*
- [ ] Nada aberto fora do repo.

## Relatório de aplicação *(quem aplica preenche ao terminar)*

Grave em `../AAMMDD-HHMM-code-editx-apply-wo0016.txt` (`date +%y%m%d-%H%M`, na hora), pela ferramenta de escrita de arquivo. Inclua as saídas cruas acima, `wc -l` dos arquivos novos, e qualquer decisão sua. **Se o push falhar**, diga o erro cru e deixe o commit local.

## Commit — blocos separados, mensagem SEM acento

```
git add logs/2026-11-18.md meta/CHANGELOG.md meta/CONTEXT.md meta/DECISIONS.md meta/ROADMAP.md meta/STATUS.md meta/analises/261118-ANALISE-ordem-selecao-e-stores.md meta/workorders/261118-wo0016-stores-do-editor.md src/App.tsx src/store/documentStore.ts src/store/documentStore.test.ts src/store/historyStore.ts src/store/selectionStore.ts
```

```
git commit -m "feat(store): cria os stores do editor com desfazer e refazer" -m "createEditorStores guarda o template aberto e a pagina ativa; toda mudanca passa por um ponto que grava os patches do Immer no historico; selecao por ids. O host le o documento do store. DEC-021 (wo0016)."
```

```
git push
```
