# P2-006 — Matriz de aceite transversal UX/UI

> Data: `2026-09-12`  
> Modo PEK: `AUDITORIA_DE_EXPERIENCIA_IMPLEMENTADA` com evidência visual incompleta  
> Escopo: acesso/cadastro, pesquisa e ficha, catálogo, comparação, administração e ajuda contextual.  
> Regra de leitura: `ACEITO` significa somente o check descrito na linha; não prova endpoint, autorização, persistência ou estados não exercitados.

## Limites desta execução

- As capturas em `evidence/ux-ui/current/` são histórico da interface anterior. Elas servem como linha de base e não como aceite da refatoração atual.
- A automação observacional local foi tentada e não iniciou: `failed to start Node runtime: O sistema não pode encontrar o caminho especificado. (os error 3)`. Portanto, não houve captura atual, alteração de viewport, navegação por teclado ou interação de formulário nesta execução.
- Não foram chamados provider real, API para fabricar dados, banco, rotas administrativas mutáveis ou ações de envio. Nenhuma evidência contém credencial, token, cookie, log bruto ou dado pessoal adicional.
- A inspeção estática abaixo aponta estrutura presente no código; ela não substitui leitura por tecnologia assistiva em navegador real.

## Legenda de resultado

| Resultado | Significado |
| --- | --- |
| `ACEITO (estático)` | o código/CSS contém o mecanismo indicado; requer confirmação em render quando aplicável |
| `EVIDÊNCIA_INCOMPLETA` | não foi possível observar o comportamento ou composição reais nesta execução |
| `NÃO APLICÁVEL` | a verificação não é pertinente à jornada ou ao estado nesta fase |

## Evidência estática confirmada

| Check | Evidência | Resultado | Limite |
| --- | --- | --- |
| Foco visível em controles comuns | `design-system.css` declara `:focus-visible` para botão, input, select, textarea e link; `styles.css` mantém regra equivalente no shell legado | `ACEITO (estático)` | contraste, clipping e ordem de foco exigem navegador real |
| Salto para conteúdo no shell autenticado | `App.tsx` fornece `skip-link` para `#main-content`, e o `main` é focalizável | `ACEITO (estático)` | não foi exercitado por teclado |
| Feedback de campo | `UiField` associa label, hint/erro, `aria-describedby`, `aria-invalid` e erro com `role="alert"` | `ACEITO (estático)` | não foi exercitada a validação de cada campo |
| Toast transversal | `UiToast` é renderizado em portal para `document.body`; `.ui-toast-region` usa `position: fixed` e `z-index: 1000`; sucesso/erro usam `status`/`alert`, `aria-live` e botão de fechar | `ACEITO (estático)` | a ausência de deslocamento, foco e leitura por leitor de tela ainda precisa de smoke real |
| Movimento reduzido | `design-system.css` reduz transições/animações globalmente; acesso e comparação possuem regras específicas de `prefers-reduced-motion` | `ACEITO (estático)` | não houve troca de preferência no navegador |
| Cadastro em telas estreitas | `styles.css` declara stepper em duas colunas, marcadores com dimensão e proporção explícitas, e recomposição abaixo de `680px` | `ACEITO (estático)` | não houve render a `390px`; colisão de labels permanece não observada |
| Catálogo responsivo | `catalog-workspace.css` troca a grade de três colunas para duas e depois uma; a rail deixa a lateral no breakpoint intermediário | `ACEITO (estático)` | ordem visual, scroll e alvo de toque não foram observados |
| Comparação responsiva | `comparison-workspace.css` remove cabeçalho tabular e recompõe linhas, identidade, toolbar e ações abaixo de `680px` | `ACEITO (estático)` | conteúdo real longo e abertura de evidências não foram observados |
| Sinalização de comparação | `ComparisonPanel.tsx` informa seleção X/Y, usa `aria-pressed`, filtros com estado pressionado, disclosure com `aria-expanded` e erros com `role="alert"` | `ACEITO (estático)` | não prova elegibilidade real, resultados ou fluxo de teclado |

## Matriz por jornada e viewport

| Jornada | Desktop 1440 | Tablet 768 | Mobile 390 | Teclado/foco/zoom/contraste | Estados reais | Resultado atual |
| --- | --- | --- | --- | --- | --- | --- |
| Acesso e cadastro | não observado | não observado | não observado | foco e reduced motion têm base estática; zoom/contraste não observados | validação, revisão, envio, análise e erro não exercitados | `EVIDÊNCIA_INCOMPLETA` |
| Pesquisa e ficha | não observado | não observado | não observado | não observado | loading, vazio, parcial, conflito, indisponível e erro não exercitados | `EVIDÊNCIA_INCOMPLETA` |
| Catálogo | não observado | não observado | não observado | recomposição declarada estaticamente; uso real não observado | filtro, ausência e erro não exercitados | `EVIDÊNCIA_INCOMPLETA` |
| Comparação X/Y | não observado | não observado | não observado | semântica e recomposição declaradas; navegação e zoom não observados | pré-requisito, parcial, conflito, erro e resultado não exercitados | `EVIDÊNCIA_INCOMPLETA` |
| Administração: equipe e consumo | não observado | não observado | não observado | não observado | sem permissão, vazio, carregamento, erro e confirmação não exercitados | `EVIDÊNCIA_INCOMPLETA` |
| Ajuda contextual | não observado | não observado | não observado | não observado | destino da orientação e retorno ao contexto não exercitados | `EVIDÊNCIA_INCOMPLETA` |

## Critérios de captura para desbloqueio

Quando o ambiente visual local estiver disponível, repetir somente os checks abaixo com dados seguros/simulados e salvar as capturas sanitizadas conforme `evidence/ux-ui/README.md`:

1. Cada jornada em `1440×900`, `768×1024` e `390×844`, com objeto, estado e ação primária identificáveis em cinco segundos.
2. Cadastro nas quatro etapas: campo inválido antes do avanço, revisão, envio e espera; conferir que o stepper não deforma, que o toast não desloca a composição e que o foco fica no retorno acionável.
3. Ficha, catálogo e comparação em estado cheio, vazio e erro; verificar texto de fonte, status, completude, conflito e elegibilidade sem depender só de cor.
4. Equipe e consumo em loading, vazio e erro seguro; confirmar que nenhuma mensagem expõe detalhe interno, outro tenant ou dado pessoal desnecessário.
5. Tab/Shift+Tab, Enter/Espaço em controles expansíveis, zoom de 200%, contraste efetivo e `prefers-reduced-motion: reduce` em pelo menos uma tela de cada família.

## Achados e encaminhamento

Não há defeito visual confirmado nesta execução: sem render atual, abrir uma task de correção seria inferência e reduziria a rastreabilidade. O bloqueio confirmado é de evidência: o runtime de automação visual local não iniciou. A P2-006 permanece bloqueada até que haja ambiente de navegador local observável ou capturas atuais equivalentes fornecidas por Lucas.

Qualquer achado posterior deve registrar: jornada, URL/tela, viewport, estado/dados seguros, passos de reprodução, impacto para a pessoa usuária, captura sanitizada, task de origem e critério de aceite para reabertura.
