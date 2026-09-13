# ✅ Concluída — Selecionar configuração organizacional no Workspace

> Prioridade: P1
>
> Área afetada: frontend, UX/UI e API de leitura autenticada
>
> Origem ou referência: bloqueio observado por Lucas no Workspace em 2026-09-12
>
> Arquitetura: `APPROVED — Lucas autorizou a continuidade em 2026-09-12.`
>
> Triagem automática: `Material — remove a dependência de identificador interno e introduz leitura organizacional.`
>
> Segurança: `Aplicável — nova rota de leitura tenant-scoped.`

## Pedido

Permitir que uma pessoa autenticada escolha no Workspace uma `VehicleConfiguration` já vinculada à sua organização, sem descobrir, copiar ou colar UUID. A criação normal de ficha continua criando/encontrando a configuração exata e vinculando a ficha à organização automaticamente.

## Critérios de aceite

- [x] O Workspace lista somente configurações que possuem ficha da organização atual; nenhuma configuração global ou de outro tenant aparece.
- [x] A pessoa escolhe o veículo por marca, modelo, versão, ano-modelo e mercado; nenhum UUID é mostrado ou exigido pela interface.
- [x] O estado vazio explica que uma ficha deve ser criada em `Nova ficha`; loading, erro e ausência não sugerem que uma pesquisa será iniciada.
- [x] A seleção continua carregando o mesmo contrato de workspace, com impacto, proveniência e governança preservados.
- [x] A rota usa sessão autenticada, o cliente usa `credentials: same-origin`, e erros não revelam existência de configuração fora da organização.
- [x] Typecheck, build, diff e checkpoint visual/teclado do fluxo preenchido são registrados.

## Restrições ou contexto

- Preservar `VehicleConfiguration` como identidade automotiva compartilhada e `TechnicalSheet` como linha de trabalho tenant-scoped.
- Não alterar schema, migrations, prompt, provider, pesquisa, persistência de ficha, regras de seleção `latest`/`recommended`/`primary` ou autorização existente.
- O catálogo global não substitui essa listagem organizacional.
- Usar os componentes e tokens existentes; `NO_IMAGE` e sem movimento novo.

## Architecture Gate — 2026-09-12

### Fatos confirmados

- `persistTechnicalSheetInTransaction` cria/encontra `VehicleConfiguration` pela identidade exata e cria/usa `TechnicalSheet` filtrada pela `organizationId` do ator.
- `readVehicleWorkspace(id, actor)` já filtra as fichas por organização, mas a tela `VehicleWorkspace` solicita o UUID de configuração manualmente.
- O catálogo é global por configuração/versão e, por contrato, não pode ser usado para descobrir o workspace organizacional.
- Os endpoints já usam sessão e `credentials: same-origin`; a interface atual já possui estados de loading, erro e vazio reutilizáveis.

### Decisão, fluxo e impacto técnico

1. Adicionar leitura autenticada `GET /api/workspace/configuracoes-veiculo`, cujo repositório parte de `technical_sheets.organization_id = actor.organizationId`, agrupa por configuração e devolve somente a identidade legível e dados mínimos de contexto.
2. Manter `GET /api/configuracoes-veiculo/:id/workspace` como detalhe selecionado. O novo índice não substitui nem amplia o contrato de leitura da ficha.
3. No front, carregar o índice ao abrir a seção Workspace e renderizar uma lista de cartões selecionáveis. A seleção interna chama o endpoint existente pelo id, que não é renderizado no DOM textual.
4. Não haverá criação, execução de pesquisa, promoção de ficha ou alteração de governança por esse fluxo.

### Arquitetura visual PEK

- **Tela/objetivo:** Workspace organizacional; a pessoa reconhece um veículo já trabalhado e abre suas fichas e sessões com um clique seguro.
- **Evidência atual/problema:** o campo “Identificador da configuração” contém um UUID opaco sem origem na interface, tornando o primeiro uso impraticável.
- **Composição:** cabeçalho com título e explicação factual; abaixo, estado de carregamento/erro/vazio ou grade/lista de cartões com marca, modelo, versão, ano e mercado; o veículo escolhido abre o contexto e mantém as regiões existentes de fichas, sessões e governança.
- **Interação:** cartão é botão com nome completo acessível; foco visível; Enter/Espaço seleciona; não há CTA de pesquisa. O identificador permanece somente no estado local e na URL de API autenticada.
- **Responsividade:** desktop usa grade de duas colunas quando houver largura; tablet e mobile passam a uma coluna, com área de toque integral e dados em duas linhas legíveis.
- **Imagem/movimento:** `NO_IMAGE`; sem movimento novo.
- **Estados:** loading informa leitura de veículos da organização; vazio direciona para `Nova ficha`; erro é neutro e permite tentar novamente; configuração selecionada mantém feedback no próprio contexto, sem toast decisório.

### Revisão de segurança proporcional

- **Gatilho:** novo endpoint de leitura autenticada e identidade de veículo vinculada a tenant.
- **Fronteira:** sessão/cookie → `requireAuthenticated` → `actor.organizationId` no repositório → resposta mínima → estado efêmero no browser.
- **Abuso relevante:** enumeração de veículos de outro tenant por id ou pelo índice. Controle: o índice consulta somente `technical_sheets` da organização ativa; o endpoint detalhado existente preserva filtro de organização e retorno neutro para ausência. Nenhum segredo, URL de fonte, prompt, snapshot LLM ou dado pessoal é retornado.
- **Verificação:** typecheck/build; inspeção do predicado tenant-scoped; smoke autenticado de lista vazia/preenchida; tentativa sem sessão deve receber 401. A verificação de isolamento com dois tenants fica bloqueada sem fixture autorizada e não será simulada com dados persistentes.
- **Compliance:** não aplicável neste recorte: não há novo dado pessoal, terceiro, retenção, cookie, analytics ou transferência.

### Double-check da arquitetura

- A decisão não usa o catálogo global nem infere pertencimento por `VehicleConfiguration`; a associação vem de `TechnicalSheet.organizationId`.
- A lista não revela UUID nem converte `latest`, `recommended` ou `primary` em sinônimos.
- A rota é de leitura, autenticada e reversível por remoção de código; schema e dados existentes não mudam.
- Os estados vazio/erro não instruem a pessoa a procurar id interno nem executam pesquisa.
- `APPROVED`: a autorização explícita de Lucas (“perfeito, pode seguir”) recebida após a explicação deste desenho libera a implementação.

## Resultado do agente — 2026-09-12

- Estado: `✅ Concluída`.
- Backend: adicionado `GET /api/workspace/configuracoes-veiculo`. A consulta parte de `technical_sheets.organization_id = actor.organizationId`, agrupa somente as configurações que já possuem ficha na organização e devolve identidade automotiva mínima mais a quantidade de fichas. O endpoint detalhado de workspace permanece com sua proteção tenant-scoped existente.
- Frontend: o campo de UUID foi removido. O Workspace agora carrega cartões por marca/modelo/versão/ano/mercado, com loading, erro recuperável, vazio que aponta para `Nova ficha`, estado atual semântica de navegação e abertura direta do workspace selecionado. Nenhum cartão dispara pesquisa.
- Arquivos alterados: `services/api/db/repository.ts`, `services/api/index.ts`, `apps/web/src/api.ts`, `apps/web/src/types.ts`, `apps/web/src/VehicleWorkspace.tsx`, `apps/web/src/vehicle-workspace.css` e esta task.
- Verificações: `npm run typecheck` aprovado; `npm run build` aprovado; `git diff --check` aprovado; smoke local sem cookie retornou `401`; checkpoint no app autenticado confirmou a lista legível de veículos e abertura da Ford Ranger, com contexto, ficha, estados e governança preservados. A árvore de acessibilidade confirma cartões como botões, não checkboxes; os breakpoints CSS reorganizam a grade para uma coluna em até 900px e compactam metadados/ação em até 620px.
- Segurança: endpoint autenticado, `credentials: same-origin`, predicado de organização no repositório e mensagens neutras. Não foram alterados schema, persistência, prompt, provider ou dados da organização.
- Limitação: não há redimensionamento de viewport exposto pela automação atual; a responsividade foi verificada pelo contrato de CSS, enquanto o render preenchido e a interação foram confirmados em desktop.
- Commit: não criado. O worktree contém alterações paralelas e arquivos não rastreados de múltiplas tasks; criar um commit isolado misturaria ownerships.
