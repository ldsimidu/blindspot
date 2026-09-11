# 🚧 Em execução — E03-01 Base web acessível e primeiro acesso

> Prioridade: P1
>
> Área afetada: interface React, navegação e acessibilidade
>
> Origem ou referência: `docs/product/backlog.md` E03-01; jornada consolidada
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação da P1-007A em 08/09/2026`
>
> Triagem automática: `Material — altera interface e fluxos de usuário.`
>
> Segurança: `Não aplicável neste corte local — reavaliar se introduzir identidade, telemetria ou endpoint novo.`

## Pedido

Estruturar a experiência web de consulta com navegação compreensível, primeiro acesso, estados de carregamento, vazio, erro e acessibilidade proporcional.

## Critérios de aceite

- [x] Fluxos principais são navegáveis por teclado e têm estados acessíveis.
- [x] UI não apresenta controles visuais como substitutos de autorização no servidor.
- [x] Erros e ausência de dados têm mensagens acionáveis sem detalhes internos.

## Restrições ou contexto

- Depende de contratos de consulta estáveis; não implementar login nesta task.

## Preflight — 2026-09-08

- **Fatos confirmados:** `apps/web/src/App.tsx` já tem formulário, sidebar e as visões Requisição, Catálogo e Histórico; as rotas atuais retornam erros sanitizados; não há sessão, usuário, organização, RBAC ou endpoint de primeiro acesso. A P1-005 deixou o catálogo bloqueado no PostgreSQL, portanto a interface deve manter seu erro explícito.
- **Lacuna relevante:** o backlog descreve uma pessoa autenticada, header de organização e sessão expirada, mas E01/P1-011/P1-013 ainda não existem. Criar estados falsos de login/tenant seria enganoso e poderia transformar controle visual em suposta autorização.
- **Recorte:** P1-007A entrega somente shell de interface local acessível e orientação inicial local. Não cria identidade, rota, persistência, telemetria, chamada externa ou política de autorização.

## Arquitetura proposta — P1-007A

### Decisão e escopo

Manter React/Vite atual e melhorar a experiência já entregue, sem trocar framework ou design system. O produto passa a ter:

1. estrutura semântica previsível (`skip link`, navegação nomeada, conteúdo principal e títulos de visão);
2. foco visível e ordem de teclado compatível com sidebar, formulário, lista, acordeões e ações de paginação;
3. regiões `aria-live` para carregando, resultado, vazio e erro, sem anunciar repetidamente a ficha inteira;
4. mensagens acionáveis e seguras para ausência, catálogo indisponível, erro de API e entrada inválida;
5. painel de primeiro acesso somente local, retomável por `localStorage`, que explica consulta, histórico, catálogo e a diferença entre dado local e acesso corporativo ainda não implementado.

O painel não pergunta e-mail, empresa, senha ou papel. Fechar/concluir a orientação grava apenas uma preferência booleana no navegador; “ver novamente” a restaura. A interface não mostra cabeçalho de organização, logout, permissão ou sessão expirada como se existissem. Quando P1-011/P1-013 forem implementadas, elas substituirão esse contexto local por estado vindo do servidor.

### Fluxo da pessoa usuária

1. No primeiro carregamento, a pessoa recebe uma orientação curta, com foco no diálogo, descrição e ações “começar”/“pular”.
2. Ao concluir ou pular, o foco segue para o conteúdo principal; a orientação não volta automaticamente até a pessoa pedir “ver orientação”.
3. A pessoa usa a navegação por teclado ou mouse para Requisição, Catálogo ou Histórico. A visão ativa tem título e indicação semântica.
4. Formulário e catálogo anunciam carregamento, sucesso, ausência ou erro em região apropriada. Catálogo indisponível continua informando que requer persistência PostgreSQL, sem sugerir fallback.
5. A pessoa pode alternar tema e recolher sidebar sem perder rótulo acessível, foco ou destino navegável.

### Impacto técnico, dados e segurança

- Alterar somente `apps/web/src/App.tsx` e `apps/web/src/styles.css`; se necessário, incluir teste/guia local de acessibilidade. Não modificar API, schema, prompt, provider, banco ou contratos HTTP.
- Preferência de orientação usa chave namespaced `blindspot_onboarding_completed` com valor booleano; não armazena veículo, resposta, identificador de pessoa ou segredo.
- Segurança é **não aplicável** neste corte porque não há mudança de identidade, autorização, endpoint, persistência, integração ou dado sensível. A fronteira é reavaliada se qualquer um deles entrar no escopo.
- O risco residual é a interface continuar disponível sem autorização corporativa real; isso já é fato do protótipo, será informado na orientação e não será apresentado como proteção.

### Plano incremental e verificações

1. Adicionar semântica, skip link, gestão de foco e anúncios de estado sem alterar as chamadas existentes.
2. Adicionar orientação local com persistência mínima e ação de reabrir; testar primeira visita, retorno, pular e fechar.
3. Revisar labels, contraste, foco, teclado, estados de erro/vazio/carregando e comportamento em 1080px e viewport estreito.
4. Rodar `npm run typecheck`, `npm run build` e smoke simulated; fazer inspeção manual por teclado e leitor de estrutura no navegador local.

### Double-check da arquitetura

- Confirmado: a UI atual já usa elementos `button` e `label`, mas não tem skip link, live regions, orientação inicial nem declaração clara de que não há sessão corporativa.
- Confirmado: P1-007 não deve desbloquear catálogo, importar dados ou chamar provider; ela deve expor o estado real de cada fluxo.
- Revistos: primeira visita, retorno, orientação ignorada, foco ao fechar diálogo, erro 400/422/500, vazio, catálogo 503, sidebar recolhida e viewport até 1080px.
- Conclusão: arquitetura `READY`. O corte P1-007A é isolado de autenticação e pode ser implementado após `APPROVED` explícito de Lucas.

## Resultado do agente

- Estado: `✅ Concluída`; Arquitetura: `APPROVED — Lucas autorizou a implementação da P1-007A em 08/09/2026`; Segurança: `Não aplicável — UI local sem identidade, endpoint, persistência ou integração nova`.
- Implementação: adicionados skip link, landmarks nomeados, foco visível, títulos de visão focáveis, anúncios `aria-live`, alertas semânticos e orientação de primeiro acesso local/retomável. A orientação deixa explícito que não há login, organização ou permissões e não coleta dados pessoais.
- Arquivos alterados: `apps/web/src/App.tsx`, `apps/web/src/styles.css` e esta task.
- Verificações: `npm run typecheck` e `npm run build` passaram; smoke simulated em `GET /api/health`, `POST /api/ficha-tecnica` e `GET /api/ficha-tecnica/latest` passou com ficha Ford Ranger e 204 caminhos; inspeção local confirmou diálogo, skip link, navegação nomeada, estado pressionado, foco no título após fechar a orientação e controles rotulados.
- Limites: sessão expirada, organização, login, RBAC, telemetria e autorização no servidor permanecem fora do escopo e exigem suas próprias tasks/Gates.
