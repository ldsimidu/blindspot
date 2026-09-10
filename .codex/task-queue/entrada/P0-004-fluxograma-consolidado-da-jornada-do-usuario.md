# ✅ Concluída — Fluxograma consolidado da jornada do usuário no backlog BlindSpot

> Prioridade: P0
>
> Área afetada: produto, planejamento, rastreabilidade, documentação e visualização
>
> Origem ou referência: `docs/product/backlog.md` (P0-003 aprovada), `docs/product/features/README.md`, `docs/product/roadmap.md`, `docs/product/coverage-matrix.md` e contratos em `docs/architecture/agent-core/`
>
> Arquitetura: `APPROVED — Lucas autorizou a execução documental/visual em 2026-09-07`

## Pedido

Criar um fluxograma consolidado, navegável e fiel à jornada de uma pessoa usuária corporativa pelo BlindSpot, percorrendo todo o backlog aprovado: entrada e ativação de conta, autenticação, autorização, consulta e qualidade de fichas, comparação, exportação/compartilhamento, reporte de qualidade, gestão de membros, consumo, alertas, indisponibilidade e operação percebida pela pessoa usuária.

O artefato deve permitir distinguir, em uma única leitura, o que já é comprovado no checkout, o que é parcial, o que é planejado e o que é apenas proposta. Ele não pode apresentar backlog como produto entregue nem decidir contratos técnicos pendentes.

## Resultado esperado

Criar uma visualização documental em `docs/product/` e, se necessário para legibilidade, um índice complementar em Markdown. Ela deve representar a sequência principal, bifurcações, estados de erro/ausência, responsáveis e dependências entre os épicos E01–E05 e RF01–RF13.

O fluxo deve começar pelo acesso de uma pessoa sem conta e terminar em resultados possíveis: ficha consultada com proveniência, comparação/exportação autorizada, ação bloqueada corretamente, reporte encaminhado, alerta de consumo, indisponibilidade comunicada ou saída/logout. Deve mostrar claramente os gates que impedem avançar: aprovação corporativa, convite/ativação, sessão/MFA, papel/permissão, organização/tenant, existência/qualidade da ficha, compatibilidade da comparação, autorização de exportação e disponibilidade do serviço.

## Critérios de aceite

- [x] O fluxograma cobre todos os cinco épicos E01–E05 e relaciona RF01–RF13 sem requisito órfão.
- [x] A pessoa usuária, administradora da organização, equipe de QA e operação aparecem com responsabilidades visualmente distintas.
- [x] Há trilhas explícitas para criação/aprovação/ativação de conta, login, recuperação, MFA/SSO, RBAC e logout, sem afirmar que esses recursos já existem.
- [x] A jornada de consulta mostra identidade exata do veículo, coleta/validação, fontes, status, ausência, conflito, ficha inválida e indisponibilidade.
- [x] Comparação, salvamento, exportação, compartilhamento, reporte de qualidade, gestão de membros, consumo e alertas aparecem com suas dependências e bloqueios.
- [x] O fluxo mostra isolamento por organização, autorização no servidor e fronteiras de segurança/privacidade sem expor segredos, logs ou detalhes exploráveis.
- [x] Estados `implementado`, `parcial`, `planejado`, `proposta` e `a decidir` são visualmente distinguíveis e possuem legenda acessível.
- [x] O artefato é legível em tela única ou possui navegação/zoom estruturado; conectores não se sobrepõem, não escondem decisões e têm alternativa textual.
- [x] Há links/referências para backlog, matriz, roadmap, catálogo e contratos técnicos, preservando a precedência do runtime sobre documentos históricos.
- [x] O double-check interno confere cobertura, transições quebradas, caminhos de erro, links, acessibilidade básica, ausência de segredo e coerência com estados comprovados.

## Restrições ou contexto

- Ler antes de executar: `AGENTS.md`, perfil/estratégia PDK, esta task, `docs/product/backlog.md`, catálogo, roadmap, matriz, inventário de fontes e `docs/architecture/agent-core/`.
- `packages/agent-runtime/assets/`, `services/api/`, `apps/web/` e `evidence/` são fonte de verdade para capacidade atual. O fluxograma deve refletir essa precedência.
- A P0-003 é planejamento aprovado, não autorização para implementar conta, login, banco, provider, comparação, exportação, alertas ou infraestrutura.
- O trabalho é documental/visual. Não alterar schema, prompt, provider, endpoint, UI de produto, banco, dependências, automação, CI/CD, infraestrutura ou integrações externas.
- Se a solução incluir HTML/CSS/SVG/Mermaid, ela deve ser estática, local, acessível e sem dependência de rede; a escolha do formato e do caminho requer Architecture Gate antes de execução.
- Não copiar `.env`, token, credencial, logs, snapshots brutos de LLM ou conteúdo externo protegido.

## Arquitetura proposta

### Decisão e escopo

Criar dois artefatos estáticos em `docs/product/`: `fluxograma-jornada-usuario.html`, a visualização primária em SVG sem rede, e `fluxograma-jornada-usuario.md`, a alternativa textual, legenda, índice de RF e referência de manutenção. Eles consolidam a jornada pelo backlog; não representam UI de produto nem autorizam qualquer PBI.

### Pessoas, fluxo e exceções

A visualização terá quatro raias: pessoa usuária/analista, administradora da organização, QA e operação. A sequência central é acesso sem conta → solicitação/aprovação/convite → ativação/login/MFA-SSO → sessão, tenant e papel → consulta/qualidade de ficha → comparação/exportação/reporte → consumo/alerta → logout. Gates laterais representam recusa/expiração/sem permissão, ficha ausente ou inválida, conflito de fonte, comparação incompatível, exportação negada e indisponibilidade.

### Organização visual e informação

O SVG terá um único canvas horizontal por fases, nós arredondados, conectores ortogonais, legenda textual e marcadores que combinam cor, borda e rótulo para `implementado`, `parcial`, `planejado`, `proposta` e `a decidir`. A alternativa Markdown fornece a mesma sequência em texto, tabela de estados/RFs e descrição dos caminhos de erro. Links locais apontam a backlog, catálogo, roadmap, matriz e contratos.

### Impacto técnico, dados e confiabilidade

Somente documentação estática; sem JavaScript, rede, dependência, schema, prompt, API, banco ou UI. Informações de capacidade vêm do checkout/documentos canônicos; propostas são rotuladas. O HTML usa SVG acessível com título, descrição e texto visível, e o Markdown permite leitura sem renderização gráfica.

### Segurança e riscos

O fluxograma explicita servidor como ponto de autorização, tenant antes de recurso, mínimo privilégio e falha fechada em exportação/compartilhamento. Não mostra valores de credenciais, tokens, logs, prompts ou detalhes de incidente exploráveis. Risco residual: a figura pode envelhecer quando PBI ou runtime mudar; manutenção exige atualizar os dois artefatos e revalidar estados contra runtime.

### Plano incremental e verificações

1. Consolidar nós e transições a partir de E01–E05/RF01–RF13.
2. Criar SVG/HTML e alternativa textual com referências.
3. Conferir toda a jornada e exceções contra backlog e contratos.
4. Validar IDs/links, ausência de segredo, integridade do SVG, legibilidade e `git diff --check`.

### Double-check da arquitetura

- Fatos e planejamento foram separados: somente geração/validação/visualização parcial/health recebem estados comprovados ou parciais.
- Os futuros auth, tenant, banco, comparador, exportação, cota e operação têm marcadores planejados/propostos.
- Atores, erros, indisponibilidade, autorização e isolamento aparecem no escopo; nenhum depende de uma escolha de provider ou contrato ainda ausente.
- A decisão é reversível e não inclui dependência ou serviço externo.

**Gate:** `APPROVED — Lucas disse “pode seguir com P0-004” em 2026-09-07.`

## Emenda de arquitetura — whiteboard consolidado

**Estado:** `APPROVED e executada — Lucas disse “pode seguir” em 2026-09-07 para ampliar o HTML estático com interação local.`

### Decisão e escopo

Acrescentar, no final de `docs/product/fluxograma-jornada-usuario.html`, um único canvas SVG consolidado que reúna a visão geral e os quatro detalhamentos. Um script local, sem rede e sem dependências, permitirá: arrastar o canvas, zoom por roda do mouse/pinch, botões acessíveis de aumentar/diminuir/restaurar e atalhos de navegação para Consulta, Acesso, Análise e Operação. A alternativa Markdown continuará sem JavaScript.

### Fluxo e organização

O canvas terá as fases do fluxo geral como trilha principal e, abaixo de cada fase, seus nós internos: consulta (entrada, catálogo, coleta, normalização, validação, QA); acesso (cadastro, aprovação, convite, sessão, tenant/RBAC); análise (comparação, compatibilidade, exportação, reporte); operação (evento, cota, alerta, health, incidente). Os atalhos apenas reposicionam a câmera local; não mudam dado, estado, runtime ou navegação externa.

### Segurança, acessibilidade e confiabilidade

O HTML não fará `fetch`, não persistirá estado e não carregará recursos externos. Controles nativos terão rótulo, o zoom terá estado textual e o canvas preservará alternativa textual/links existentes. Limites de zoom evitam perder o mapa; `Escape` ou Restaurar retorna à visão integral. Continuam proibidos segredos, prompts, tokens, logs e detalhes exploráveis.

### Plano e verificação

1. Adicionar canvas consolidado, controles de navegação e JavaScript local mínimo.
2. Validar todos os nós/arestas contra os dois fluxogramas existentes e RF01–RF13.
3. Testar zoom, pan, restaurar, teclas e layout em desktop/mobile; gerar screenshot local.
4. Executar varredura de segredo, inspeção de links e `git diff --check`.

### Double-check da emenda

- A interação é somente de apresentação e não altera qualquer contrato, API, dado, provider ou integração.
- O modelo de informação e os estados já aprovados permanecem os mesmos; o novo canvas apenas consolida-os.
- O risco residual é acessibilidade de gestos e legibilidade em telas menores; controles de teclado, limite de zoom, atalhos e alternativa Markdown mitigam esse risco.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou a execução documental/visual em 2026-09-07`.
- Implementação: criado fluxograma estático em SVG/HTML com cinco fases, quatro raias de responsabilidade, 21 nós e 23 conectores; a alternativa textual inclui fluxo por ator, cobertura RF, regras de manutenção e fluxograma Mermaid em Markdown. Ao final do HTML foi adicionado um whiteboard consolidado, com 35 nós de detalhe, arrastar, zoom por roda/pinch, controles de zoom/restauração, atalhos por fase e teclado; a interação é local, sem rede nem persistência. Nenhum runtime, schema, prompt, provider, API, UI de produto, banco, dependência, automação, CI/CD, infraestrutura ou integração foi alterado.
- Arquivos alterados: `docs/product/fluxograma-desenvolvimento-agente.md`, `docs/product/archive/p0/p0-004-preflight.md`, `docs/product/archive/p0/security-review-p0-004.md`, `docs/product/README.md` e esta task. Os fluxogramas HTML e Markdown anteriores foram removidos na limpeza documental aprovada.
- Verificação: cobertura estática E01–E05 e RF01–RF13, título/descrição SVG, 21 nós, 23 conectores e links locais conferidos; varredura de segredo nos novos artefatos e `git diff --no-index --check` passaram. Renderização local pelo Edge headless confirmou a leitura visual do fluxograma; a alternativa textual assegura leitura sem SVG.
- Limitações: SSO, MFA, tenancy, retenção, cotas, exportação, provider e SLA continuam explicitamente `a decidir`; o artefato deve ser atualizado junto do backlog e revalidado contra runtime antes de mudar estados.
- Manutenção posterior (2026-09-07): corrigidos conectores que terminavam fora de nós ou induziam semântica incorreta; reporte e alerta agora têm nós e rotas próprios, a decisão pendente conecta ao núcleo e o visual recebeu contraste, sombras sutis e agrupamento mais claro. Em revisão adicional, a rota de exportação deixou de atravessar `Reportar dado`; `Gerir membros` passou a sair do RBAC; e `Reportar dado` contorna `Gerir membros` por corredor lateral antes de chegar a `Resolver reporte`.
- Manutenção posterior (2026-09-07, detalhamento): adicionadas quatro trilhas de execução sob a visão geral. Consulta agora detalha identificação, validação, catálogo/histórico, fila, coleta, normalização e validação; acesso descreve aprovação até autorização; análise abre comparação, exportação e reporte; operação abre eventos, consumo, alertas e incidentes.
- Manutenção posterior (2026-09-07, whiteboard): acrescentado canvas consolidado ao fim do HTML, reunindo acesso, consulta, análise e operação. Os controles `+`, `−`, Visão integral e atalhos de fase, além de arrastar, roda/pinch e teclado, controlam somente a apresentação local.
- Manutenção posterior (2026-09-07, Markdown-first): a referência de fluxo foi consolidada em `docs/product/fluxograma-desenvolvimento-agente.md`. Ela incorpora todas as trilhas do HTML (jornada, consulta, acesso, análise e operação) como diagramas Mermaid e acrescenta o pipeline efetivo do agente, mapa de arquivos, contrato de erros, checklist e uma divergência de caminhos de assets a ser resolvida por task futura. O HTML foi preservado somente como histórico; nenhuma mudança de runtime foi realizada.
- Manutenção posterior (2026-09-07, limpeza aprovada): os fluxogramas legados `fluxograma-jornada-usuario.html` e `fluxograma-jornada-usuario.md` foram removidos. Os registros de preflight e segurança de P0-003/P0-004 foram movidos para `docs/product/archive/p0/`; o índice aponta somente para a referência Markdown ativa e para o arquivo documental.
- Manutenção posterior (2026-09-07, ampliação aprovada): Lucas autorizou o detalhamento documental de persistência/catálogo, autenticação, estados de consulta e reporte, revogação e recuperação de incidente. O Architecture Gate é `APPROVED` para documentação de planejamento; os novos nós seguem planejados/a decidir e não alteram runtime, schema, API, banco, provider, UI, dependências ou serviços externos.
- Próximo passo: selecionar uma task de implementação específica do backlog; não iniciar automaticamente qualquer capability apenas porque ela está representada no fluxograma.
