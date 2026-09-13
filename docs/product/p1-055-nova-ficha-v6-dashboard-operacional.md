# P1-055 — Nova Ficha V6: dashboard operacional completo

> Estado: `APROVADO VISUALMENTE NO DESKTOP — Lucas aprovou a composição em 2026-09-13; checkpoint mobile permanece pendente`.

## Decisão

Consolidar a tela inicial da Nova Ficha como resumo operacional de uma dobra. A V6 mantém os ganhos da V4 (canvas útil, nenhuma repetição do workspace e modal de pesquisa) e corrige o excesso de redução apontado na V5: pesquisa reconhecível, densidade factual, agrupamento e próxima ação próximos.

## Mapa de composição

| Região | Dados permitidos | Papel visual | Não fazer |
| --- | --- | --- | --- |
| Cabeçalho | tarefa e CTA `Pesquisar nova ficha` | orientação curta, sem hero gigante | competir com a identidade |
| Command surface | critérios de busca, exclusivamente como labels; CTA abre diálogo atual | tornar a pesquisa descobrível | duplicar inputs/payload ou persistir filtros |
| Stage de identidade | marca, modelo, versão, ano, mercado e mensagem factual | maior módulo; substitui a mídia da referência sem alegar imagem real | repetir nome em outro hero |
| Completude | preenchidas/total e percentual calculável | anel factual em módulo próprio | anel sem denominador ou progresso inventado |
| Qualidade | fontes, sem informação e conflitos | três tiles compactos, sem barras decorativas | cor como único significado |
| Leitura técnica rápida | até três atributos âncora reconhecidos (`Motorização`, `Potência`, `Torque`) e seus status | segunda faixa com decisão técnica real | mostrar campos ausentes ou inventar categorias |
| Pontos de atenção | conflito, ausência e histórico compatível já existentes | lista breve, somente se houver fato | reminders, previsão, manutenção ou urgência falsa |
| Atualidade/detalhe | menor/maior `history.finishedAt` compatível e `Abrir ficha completa` | fecha o resumo e encaminha o aprofundamento | desconectar CTA do contexto |

## Dados e algoritmo

- A leitura técnica rápida usa os mesmos paths já reconhecidos no `TechnicalFichaWorkspace`: `motorizacao.tipo_motor`/`motor_tipo`, `motorizacao.potencia_cv` e `motorizacao.torque_kgfm`/`torque_nm`.
- Cada item só aparece quando o campo estruturado existe e contém `valor`/`status`; a V6 não cria fallback semântico artificial.
- A lista de atenção não precisa de novo endpoint: usa `conflitantes`, `nao_encontradas` e histórico estritamente compatível com a identidade atual.
- Exportação continua fora do dashboard enquanto não existir version ID elegível no contrato já carregado.

## Fluxo e acessibilidade

As CTAs de busca chamam o mesmo diálogo nativo V4. O diálogo continua proprietário de campos, foco inicial, trap, `Escape` condicionado por loading, erros e retorno ao gatilho. `Abrir ficha completa` continua local e reversível, sem rota, API, sessão, RBAC, schema ou persistência nova.

## Layout responsivo

- **Desktop 1440×900:** header, command surface, grade principal, faixa técnica e rodapé factual cabem sem scroll inicial.
- **Tablet:** stage ocupa linha própria; completude e qualidade reorganizam sem comprimir números.
- **Mobile:** CTA ocupa largura total; ordem é busca → identidade → completude → qualidade → atributos → atenção → detalhe. Scroll é permitido.

## Segurança e limites

Avaliação proporcional: `Não aplicável` para risco novo. O corte somente reorganiza apresentação de dados já carregados localmente e não introduz API, exportação, provider, dependência, dados pessoais, storage ou analytics.

## Critérios de aceite

- Busca visível em cinco segundos, porém sem formulário persistente.
- Cada módulo contém dado verificável e uma única responsabilidade.
- Não há borda global decorativa, barras métricas vazias, imagem/telemetria fictícia ou repetição de identidade.
- Dark e warm-light preservam hierarquia equivalente.
- Typecheck, build e `git diff --check` passam; render humano valida 1440×900 e 390, inclusive modal e detalhe.

## Resultado da implementação

- A command surface e suas duas CTAs abrem o diálogo existente; os cinco campos continuam exclusivos do modal.
- A tela passa a usar os três atributos âncora estruturados que já são reconhecidos no workspace. Um atributo ausente não cria tile vazio.
- Os indicadores de qualidade não usam mais barras coloridas como suporte visual vazio.
- `npm run typecheck`, `npm run build` e `git diff --check` passaram em 2026-09-13. A automação de captura local continua indisponível por `os error 3`; falta a evidência humana dark/light e mobile para aceitar visualmente.

## Aceite humano registrado

A captura `screencapture-localhost-5173-2026-09-13-03_03_06.png` foi aprovada por Lucas como avanço visual importante. A direção de canvas, densidade, identidade, completude e faixa técnica fica preservada como baseline. Ajustes posteriores não podem reintroduzir moldura externa, formulário permanente, repetição do workspace ou conteúdo não factual.
