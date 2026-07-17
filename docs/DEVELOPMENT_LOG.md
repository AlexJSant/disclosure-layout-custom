## Development Log

### 2026-07-07 — Análise prévia (item 1) e plano inicial

- **Contexto do repositório**
  - Fork do app VTEX IO [`vtex-apps/disclosure-layout`](https://github.com/vtex-apps/disclosure-layout), ainda idêntico ao original (sem customizações próprias até este chat).
  - Uso principal: FAQs em accordion (`disclosure-layout` → `disclosure-trigger` + `disclosure-content`, opcionalmente agrupados em `disclosure-layout-group`).
  - Objetivo: gerar schema.org [`FAQPage`](https://schema.org/FAQPage) JSON-LD nativamente neste fork, inspirado no padrão do app oficial [`vtex-apps/structured-data`](https://github.com/vtex-apps/structured-data) (`Helmet` + `<script type="application/ld+json">` via `vtex.render-runtime`), **sem** adicionar `vtex.structured-data` como dependência.

- **Como os blocks renderizam children hoje**
  - Os componentes deste app são wrappers finos sobre `@vtex/disclosure` (`^0.1.5`):
    - `react/DisclosureLayout.tsx` → repassa `children` para `<DisclosureLayout>`.
    - `react/DisclosureLayoutGroup.tsx` → repassa `children` para `<DisclosureLayoutGroup>`.
    - `react/DisclosureTrigger.tsx` / `react/DisclosureContent.tsx` → idem.
  - Em `@vtex/disclosure`, `DisclosureLayoutGroup` renderiza `{children}` **diretamente** dentro de `DisclosureContextProvider` (dois `Context.Provider` aninhados). Sem portal, sem render-prop assíncrono, sem slot separado.
  - Conclusão **1b**: um React Context provido pelo group propaga normalmente até os `disclosure-layout` filhos (é o mesmo padrão que o próprio pacote já usa para `DisclosureGroupContext`).
  - Conclusão **1c**: wrappers intermediários (grid/`flex-layout`/container) entre group e layout **não quebram** Context — Context propaga pela árvore de componentes React, não pelo DOM.

- **Achados atípicos que mudaram o plano**
  - **(A) Fronteira de `ExtensionPoint`**: os `children` de trigger/content não são nós React “planos” com o texto do `rich-text`; o texto real vive nas props resolvidas do runtime. Travessia de `props.children` sozinha **não** alcança o texto do `rich-text` de forma confiável.
  - **(B) Extração via DOM (`ref` + `textContent`)**: rejeitada depois — só funciona no cliente (`useEffect`), o que impede o JSON-LD de existir no HTML do SSR.
  - **(C) Site Editor**: `initialVisibility` / `animated` estavam só no README — **não** havia `schema` estático no projeto. Foi necessário introduzir `Component.schema` nos dois blocos.
  - **(D) `manifest.json`**: só declarava `vtex.css-handles`. `vtex.render-runtime` **não** constava em `dependencies` (confirmado antes de adicionar).

### 2026-07-07 — Plano revisado (SSR-safe, Opção B)

- **Problema com o plano inicial de extração via DOM**
  - `ref` + `querySelector` + `textContent` só rodam após montagem no browser → `<script ld+json>` ausente no HTML do SSR → risco de SEO (bots sem JS / atraso de indexação).
  - `Helmet` do `vtex.render-runtime` **já é compatível com SSR** (`Helmet.rewind()`); o problema era só a estratégia de extração.

- **Decisão de extração: Opção B (`useRuntime().extensions`)**
  - Adotada em vez da Opção A (`child.props.text` no React element):
    - Através da fronteira `ExtensionPoint`, as props do `rich-text` **não** ficam em `child.props`.
    - Fonte de verdade: `extensions[treePath].props` e `.content` (Site Editor sobrescreve via `content`).
  - Confirmado via typings/fonte `vtex.render-runtime@8.111.1`:
    - `useRuntime()` expõe `extensions` síncrono no render (incluindo SSR).
    - `useTreePath()` → `{ treePath }` com o id do bloco atual.
    - Filho = `` `${parentTreePath}/${extensionPointId}` ``.
    - `Helmet` reexportado de `react-helmet`, SSR-ok.

- **Troca crítica: Context deixa de ser canal de registro**
  - Registro por callback/`useEffect` do filho → pai é **incompatível com SSR** (`setState` do pai a partir do filho só em effect).
  - Novo desenho (validado pelo usuário):
    - `disclosure-layout-group` **se auto-agrega em tempo de render** lendo `extensions`.
    - Context vira apenas marcador booleano `insideEnabledGroup` (`DisclosureStructuredDataProvider value={true}`).
    - Filho com group habilitado acima: **nunca** emite script próprio (prop do group prevalece).
    - Filho isolado + `generateStructuredData`: emite seu próprio script.

- **Bump de versão**
  - Confirmado: **não** fazer bump manual; fica para `vtex release` / processo do time.
  - `CHANGELOG.md` permanece em `## [Unreleased]` / `### Added`.

### 2026-07-13 — Correção do algoritmo de travessia de `extensions`

- **Problema com `key.startsWith(treePath + '/')`**
  1. Ordem de chaves do mapa `extensions` **não** é a ordem de renderização.
  2. Comparar segmento do path com igualdade estrita `'disclosure-layout'` falha para aliases (`disclosure-layout#id`).

- **Correção adotada**
  - Percorrer recursivamente `extensions[treePath].blocks` (lista ordenada `{ extensionPointId }` usada pelo `ExtensionPoint` — nome real do campo nesta versão do runtime; funcionalmente o “children” da árvore de blocks).
  - Comparar nome do bloco com `extensionPointId.split('#')[0]`.
  - Funções afetadas: `findDescendantLayouts`, `findDirectChildTreePathByBlockName`, `buildFAQItem` / `collectTextFromSubtree`.

### 2026-07-13 (chat atual) — Implementação

- **Tipagem e augmentation**
  - `react/typings/structuredData.ts`: `FAQItem`, `FAQPage`, `ExtensionLike`, `ExtensionsMap`, `BlockInsertion` (shape mínima local — globals `Extension`/`Extensions` do runtime não vêm no tarball de typings instalado).
  - `react/typings/block.ts`: `BlockComponent<P>` = `FC<P> & { schema? }` para `Layout.schema` / `Group.schema`.
  - `react/typings/vtex.render-runtime.d.ts`: module augmentation declarando `useTreePath` e `Helmet` (entrypoint publicado de `8.111.1` só exporta `useRuntime` no root; o JS real exporta ambos).

- **Utils SSR-safe (`react/utils/structuredData.ts`)**
  - `getBlockName`, `findDescendantTreePathsByBlockName`, `findDescendantLayouts`, `findDirectChildTreePathByBlockName`.
  - `collectTextFromSubtree`: lê `props`/`content` (merge), prioriza `text` (rich-text), strip de markup HTML, desce `blocks`.
  - `extractTextFromReactNode`: fallback recursivo em nós React (strings/números/`props.children`), nunca DOM, nunca lança.
  - `buildFAQItem` / `buildFAQPage`: omite item silenciosamente se faltar pergunta ou resposta.

- **Context e JSON-LD**
  - `react/DisclosureStructuredDataContext.tsx`: `createContext<boolean>(false)`, `useInsideStructuredDataGroup()`, Provider.
  - `react/FAQJsonLd.tsx`: `<Helmet><script type="application/ld+json">{JSON.stringify(data)}</script></Helmet>`.

- **`react/DisclosureLayout.tsx`**
  - Prop `generateStructuredData?: boolean` (default `false`).
  - Se `insideEnabledGroup`: não gera script próprio.
  - Se isolado + prop `true`: `buildFAQItem` via `extensions` + fallback de children → `FAQJsonLd`.
  - `Layout.schema` com `initialVisibility`, `animated`, `generateStructuredData` (Site Editor).

- **`react/DisclosureLayoutGroup.tsx`**
  - Prop `generateStructuredData?: boolean` (default `false`).
  - Se `true`: Provider booleano + agrega via `findDescendantLayouts` + um único `FAQJsonLd`.
  - Se `false`: caminho idêntico ao anterior (sem Provider, sem processamento).
  - `Group.schema` com `maxVisible` e `generateStructuredData`.

- **`manifest.json`**
  - Adicionado `"vtex.render-runtime": "8.x"` em `dependencies` (sem duplicar; antes só havia `vtex.css-handles`).

- **Mocks de teste**
  - `react/__mocks__/vtex.render-runtime.jsx`: `useRuntime`, `useTreePath`, `Helmet` (mesmo padrão de `vtex.css-handles`).

- **Testes**
  - `react/utils/__tests__/structuredData.test.ts`:
    - **(a)** layouts aliasados (`#first` / `#second`) encontrados na ordem de `blocks`.
    - **(b)** wrapper intermediário (`flex-layout.row#wrapper`) ainda encontra `disclosure-layout`.
    - Preferência `content` sobre `props`, omitir item vazio, fallback React node, `buildFAQPage`.
  - `react/__tests__/DisclosureLayout.test.tsx`: default sem script; isolado com script; omitir sem throw.
  - `react/__tests__/DisclosureLayoutGroup.test.tsx`: agregação, wrapper intermediário, precedência do group, sem “ghost” após remoção em re-render.
  - Resultado final da suíte: **3 suites / 28 testes passando**; `tsc --noEmit` limpo.

- **Documentação**
  - `docs/README.md`: prop nos dois blocos; seção **Structured data (FAQPage)** com exemplos JSON (isolado e group) e exemplos do JSON-LD; nota de precedência do group.
  - `CHANGELOG.md`: entrada em `## [Unreleased]` / `### Added` (sem bump de versão).

### TODOs deste chat (todos concluídos)

- [x] Análise prévia (propagação de Context, wrappers intermediários, achados atípicos) antes de implementar.
- [x] Plano revisado SSR-safe (Opção B + agregação por `extensions` + Context só como marcador).
- [x] Travessia por `extensions[treePath].blocks` com comparação pré-`#` (ordem + aliases).
- [x] Implementar FAQPage opt-in em layout isolado e group agregado.
- [x] Prop `generateStructuredData` + schema Site Editor nos dois blocos.
- [x] Adicionar `vtex.render-runtime` no `manifest.json` sem duplicar.
- [x] Testes unitários (aliases, wrapper intermediário, precedência, sem ghost).
- [x] Atualizar `docs/README.md` e `CHANGELOG.md` (Unreleased).
- [x] Registrar tudo em `docs/DEVELOPMENT_LOG.md`.

### TODOs pendentes / validação manual

- [ ] **Bump de versão**: quando for publicar, usar `vtex release` (ou bump manual) — minor semântica sugerida; CHANGELOG já está em Unreleased.
- [ ] **Smoke test no Site Editor**: toggle `generateStructuredData` nos dois blocos e conferir comportamento isolado vs group (prop do group prevalece).

### 2026-07-13 — Confirmação do campo `.blocks` (TODO 1)

- **Fonte canônica**: `vtex-apps/render-runtime@v8.111.1` → `react/typings/global.d.ts` (ambiente global; **não** vem no tarball `@types` instalado em `node_modules/vtex.render-runtime` — por isso este app declara `BlockInsertion`/`ExtensionLike` localmente).
- **Declaração**:
  - `BlockInsertion` — linhas **64–75**: `{ extensionPointId: string; blockId: string; children?: boolean; blockRole?: 'block' | 'children' | 'slot' }`.
  - `Extension.blocks` — linha **82**: `blocks?: BlockInsertion[]`.
- **Uso pelo runtime (prova de que é a lista de filhos, não variações)**:
  - `react/components/ExtensionPoint/index.tsx` → `getChildExtensions` (linhas **45–75**): lê `extension.blocks`, filtra slots/não-children, e `map` na **ordem do array** gerando `<ExtensionPoint id={child.extensionPointId} />`.
  - Mesmo arquivo (linhas **205–211**): quando `composition === 'children'`, os `componentChildren` vêm de `getChildExtensions` (ou seja, de `.blocks`).
  - Variações de bloco / wrappers de composição usam campos **separados**: `after` / `around` / `before` (`string[]` em `Extension`, linhas 78–80) e `blockRole` / `children` dentro de cada `BlockInsertion` (para distinguir child vs slot — não para listar variações).
- **Conclusão**: `.blocks` é a lista **ordenada** de blocos filhos declarados; a travessia do FAQ JSON-LD está no campo certo.

### TODOs abertos (2026-07-13) — pós-implementação / validação

- [x] 1. Confirmar no typings do render-runtime (`v8.111.1`) que o campo usado pela travessia (`.blocks`, lista de `{extensionPointId}`) é de fato a lista ordenada de blocos filhos, e não outra estrutura (ex: variações de bloco). Pedir ao Cursor o arquivo/linha exata da declaração de tipo.
- [x] 2. Validar SSR real: confirmar que o `<script ld+json>` vem no HTML cru retornado pelo servidor (não apenas visível no DevTools/Elements, que reflete o DOM já hidratado). Fazer via `view-source:` da URL ou `curl <url>` sem JS, e procurar o script no HTML bruto.
- [x] 3. Corrigir bug encontrado: `stripMarkup` não está removendo marcação markdown de `**negrito**` no campo `"question"` (aparecem literalmente os asteriscos no `"name"` do JSON-LD). Investigar por que funcionou para o texto da resposta mas não da pergunta (provavelmente sintaxes diferentes de markdown usadas no rich-text de cada bloco) e cobrir com teste.
- [ ] 4. Validar o JSON-LD gerado no Rich Results Test do Google (https://search.google.com/test/rich-results) e/ou no validador schema.org, usando a URL real da página de FAQ, após a correção do item 3.
- [x] 5. Revisar visualmente se o bug do item 3 também afeta o campo `"text"` (resposta) em outros itens reais do site (o exemplo enviado só tem 3 perguntas — testar com conteúdo que use outras marcações markdown: itálico, links, listas, etc.).

### 2026-07-13 — Fix `stripMarkup` (TODOs 3 e 5)

- **Causa-raiz**: `stripMarkup` só fazia `.replace(/<[^>]*>/g, ' ')`. O `vtex.rich-text` guarda **Markdown cru** em `props.text` (e converte para HTML só na renderização). Se a pergunta usava `**negrito**` e a resposta era texto plano (ou HTML já “achatado” de outra forma), o JSON-LD vazava asteriscos só em `"name"`.
- **Correção**: `stripMarkup` agora remove HTML **e** Markdown comum do rich-text: negrito (`**`/`__`), itálico (`*`/`_`), links (`[texto](url)` → texto), listas (`-`/`*`/`1.`), além de imagens, headings, code e strikethrough defensivamente.
- **Teste**: `buildFAQItem` cobre negrito na pergunta + itálico, link e lista na resposta de uma vez (fecha o item 5 junto com o 3, sem depender só do caso de negrito).

### TODOs pós-lançamento da major 1

- [ ] **Corrigir a prop `animated`**: atualmente, as transições entre os estados aberto e fechado do disclosure/accordion são instantâneas. Quando habilitada, a prop não anima a transição e ainda compromete o funcionamento do app.
- [ ] **Restringir `Generate Structured Data (FAQPage)` ao `disclosure-layout-group`**: remover a prop dos `disclosure-layout` individuais, pois gerar uma tag `<script>` por pergunta não faz sentido. Manter a geração de um único JSON-LD agregado apenas no group.
