# P1-040 — arquitetura visual v2: Nova ficha e workspace técnico

> Estado: `REABERTA — implementação inicial revertida após reprovação humana em 2026-09-12`.
>
> Reabertura: feedback humano e evidências de 2026-09-12 substituem a hipótese anterior de hero sem mídia e navegação textual persistente.

## Tela, pessoa e objetivo

**Tela/estado:** `Nova ficha` autenticada, com composer preenchido e última ficha validada (`Ford Ranger Raptor · 2025 · Brasil`) como estado de maior densidade. **Pessoa:** analyst/admin que inicia ou retoma a leitura de uma ficha. **Objetivo:** iniciar uma pesquisa sem perder a sensação de estar trabalhando sobre um veículo real, compreender qualidade rapidamente e aprofundar a evidência sem sair do contexto. **Ação primária:** gerar ficha técnica; quando já existir ficha, abrir/navegar o workspace — nunca executar ação de pesquisa nova sem comando explícito.

## Evidência e diagnóstico atual

- Captura: `C:\Users\lucas\Downloads\visual-refactor\screencapture-localhost-5173-2026-09-12-22_19_06.png`.
- Código observado: `apps/web/src/App.tsx` delega leitura para `TechnicalFichaWorkspace`; `TechnicalFichaWorkspace.tsx` recebe a resposta existente sem `fetch` próprio.
- O fluxo factual já funciona: marca, modelo, versão, ano e mercado são enviados; última ficha, tabs e status são exibidos.
- Problemas observáveis: composer escuro ocupa o primeiro maior bloco; veículo é um título de texto sem presença de objeto; card de qualidade se separa do contexto; tabs e resumo aparecem abaixo de grande espaço vazio; atributos-âncora ficam soltos e fonte não compõe a primeira leitura.

## Referências e tradução

| Origem | Princípio usado | Não copiar |
| --- | --- | --- |
| `BLINDSPOT_VISUAL_NORTH_STAR.md` | vehicle-first, grade assimétrica, superfícies quietas, contexto persistente | layout literal, telemetria/manutenção e dados inventados |
| `NEW_FICHA_SCREEN_REFACTOR_SPEC.md` | composer compacto, hero com qualidade integrada, resumo agrupado e estados reais | imagem de veículo sem identidade comprovada |
| `docs/product/design-system.md` | canvas quente, laranja funcional, status semântico, primitives e responsividade | aplicar vidro/gradiente a informação densa |
| `docs/product/image-system.md` | verdade de identidade e fallback sem mídia | provider, busca, asset externo ou hotlinking |
| `docs/design-system/motion.md` | movimento de evento local e reduced motion | progresso falso ou atraso artificial |

## Conceito de experiência

A tela ensina, nesta ordem: “posso gerar uma ficha” → “este é o veículo em contexto” → “esta é a qualidade do que sei” → “posso explorar o mesmo veículo” → “cada dado tem um limite e uma origem”. O formulário deixa de ser a narrativa visual e passa a ser um comando de entrada estável.

## Arquitetura visual

### Canvas e shell

- Canvas `warm-light`, com máximo de 1280 px e grid de 12 colunas no desktop. O shell usa borda/elevação mínima e nunca uma moldura decorativa que comprima conteúdo.
- Navegação superior compacta: ícones de destinos no estado padrão; botão de seta abre painel ancorado com nomes completos. O painel sobrepõe o canvas sem empurrar hero/composer. Em mobile, rótulos aparecem no menu acessível.
- O ativo é distinguido por ícone, `aria-current`, contorno/contraste e sinal laranja pequeno; não apenas por cor.

### Região 1 — FichaGenerationComposer

- Faixa horizontal de baixa altura, com título curto “Nova ficha”, cinco campos e CTA laranja em desktop. A faixa inteira é uma command surface clara, com padding de 16–20 px e sem heading heroico.
- Em 1024/768, campos quebram em duas linhas mantendo CTA adjacente ou em linha própria. Em 390, os campos empilham; CTA ocupa largura disponível, preservando as labels e a validação existente.
- Após uma ficha carregada, a faixa pode exibir a identidade atual e “Nova pesquisa”, mas esse estado só entra quando confirmado pelo comportamento existente; não presumir colapso sem especificação funcional.

### Região 2 — VehicleIdentityHero

- Abaixo do composer, eyebrow factual “Última ficha validada”, título `Ford Ranger`, linha `Raptor · 2025 · Brasil` e metadados de versão/data somente quando existirem.
- A coluna editorial recebe `VehiclePlaceholder`: um componente local abstrato de carro em outline/silhueta, proporcional à região, sem marca/modelo/desenho que sugira a Ranger real. Tem `aria-hidden` se puramente decorativo; se comunicado como indisponível, texto explícito e alt neutro. Não há asset externo, stock, geração de imagem ou provider.
- A coluna de qualidade contém quatro métricas verdadeiras em ritmo vertical: `Completude`, `Fontes`, `Campos ausentes`, `Conflitos`. Cada uma tem rótulo, valor e, para conflito/estado, texto e ícone. Uma barra segmentada só aparece se a razão real puder ser calculada.
- Ações contextuais ficam abaixo/ao lado do hero e nunca cobrem veículo, qualidade ou identificação. Ações não elegíveis permanecem indisponíveis ou ausentes conforme o runtime atual, com motivo quando necessário.

### Região 3 — ContextTabs e conteúdo

- Tabs: Resumo, Especificações, Fontes, Histórico, Pesquisa e Conflitos, quando os dados/fluxo existentes justificarem cada uma. Rótulos ficam sempre legíveis na área de ficha, inclusive em mobile por scroll horizontal sem barra visual intrusiva.
- `Resumo` usa uma superfície principal única com três ou mais atributos-âncora reais em colunas proporcionais: label, valor/unidade, status textual/ícone e fonte curta quando disponível. Não criar um card para cada atributo.
- `Especificações` agrupa por domínio e disclosure progressivo. `Fonte` e observação são acionáveis sem tirar o atributo do contexto. `Conflitos` mostra o limite e aciona a tab/estado correto sem afirmar solução.
- Hero, qualidade e tabs persistem em toda troca de contexto; apenas `tabpanel` abaixo muda.

## Imagem, acessibilidade e estados

| Estado | Resposta de composição |
| --- | --- |
| Sem ficha | Composer aberto + estado vazio com próximo passo, sem hero artificialmente enorme. |
| Carregando | skeleton que espelha composer/hero/métricas/tabs, sem valores ou percentual fictício. |
| Asset inexistente | `VehiclePlaceholder` local e abstrato, sem afirmar identidade visual do modelo. |
| Ficha parcial | métricas e campos mostram limites reais; ausência não vira zero nem estado de sucesso. |
| Conflito | texto, ícone, token semântico e ação contextual para detalhes; não apenas vermelho. |
| Erro | formulário e valores preservados; retorno persistente próximo à ação; toast é complementar e não desloca CTA. |

Keyboard: foco inicial no título do workspace após troca confirmada; ícones de navegação têm nome acessível; gatilho de rótulos mantém `aria-expanded` e relação com o painel; tabs seguem padrão ARIA; targets mínimos de 42 px; fonte/status não dependem de tooltip/cor. `prefers-reduced-motion` preserva todas as regiões sem entradas, crossfade ou underline animado.

## Não-escopo e invariantes

Não mudar payload, schema, API, busca, validações, mercados, regras de pesquisa, eligibilidade, fontes, conflitos, histórico, permissões ou sessão. Não reintroduzir curadoria de imagens. O placeholder é composição local, não dado do veículo nem integração.

## Plano e checkpoint

1. Revisar a estrutura isolada de `TechnicalFichaWorkspace` e tokens sem alterar contratos.
2. Implementar somente a composição mínima aprovada: shell, composer, hero, placeholder local, métricas, tabs e resumo.
3. Fazer checkpoint PEK de primeira renderização em 1440, 1024, 768 e 390 para estado carregado e estado sem ficha; revisar teclado e reduced motion.
4. Só depois polir seções, movimento e estados complementares. Uma captura humana que reprove composição retorna a este documento.

## Double-check visual

- O veículo continua identificável por texto mesmo sem imagem; o placeholder não cria falsa correspondência com uma configuração exata.
- A seta revela nomes de destinos sem deslocar conteúdo, e mobile não exige descobrir um ícone sem rótulo.
- Todas as quatro métricas de qualidade permanecem próximas ao hero; status e fonte continuam visíveis no detalhe e não viram apenas tooltip.
- Não há vazio sem propósito: a região editorial suporta vehicle-first, enquanto composer, qualidade e tabs têm largura útil.
- A composição traduz hierarquia das referências; não copia seus dados, imagens, telemetria ou UI.

## Decisão humana necessária

Esta arquitetura preserva as direções aprovadas, mas sua primeira tradução em JSX/CSS foi revertida após reprovação humana. Ela não autoriza uma nova implementação sem uma revisão de composição baseada em nova evidência/feedback; o Architecture Gate técnico existente da P1-040 continua válido somente para o escopo de apresentação.
