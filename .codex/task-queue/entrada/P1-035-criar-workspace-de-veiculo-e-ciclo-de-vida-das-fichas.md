# 🚧 Em execução — Criar workspace de veículo e ciclo de vida das fichas

> Prioridade: P1
>
> Área afetada: API, interface, identidade e autorização
>
> Origem ou referência: P1-030 e proposta, seções 5, 6, 10 a 12, 51 e 62 a 64
>
> Arquitetura: `APPROVED — Lucas autorizou executar a task inteira em 2026-09-11.`
>
> Triagem automática: `Material — nova jornada, endpoints e ações sobre dados.`
>
> Segurança: `Aplicável — dados de organização, autorização e API.`

## Pedido

Criar a visão de Vehicle como espaço de trabalho de configurações normalizadas, com suas fichas independentes e ações claras: continuar, criar do zero, criar a partir de base, refresh e comparar. A identidade ambígua deve pedir confirmação, não unir veículos por similaridade silenciosamente.

## Critérios de aceite

- [ ] A página mostra identidade de configuração, fichas, revisão mais recente, qualidade explicável, alertas e rótulos Latest/Recommended/Primary quando aplicáveis.
- [ ] Criar nova ficha não altera as existentes; continuar cria sessão na ficha selecionada; refresh preserva linhagem e regras definidas.
- [ ] Ações de criar/selecionar respeitam escopo de organização e papel do servidor.
- [ ] Resolver de veículo usa normalização/aliases determinísticos; caso incerto oferece decisão humana e registra a escolha.
- [ ] Estados de vazio, erro, sem permissão e identidade incompatível são acessíveis e não escondem alternativas.

## Restrições ou contexto

- Depende de P1-030, P1-034 e das tasks de autenticação/RBAC relevantes.
- Reutilizar a descoberta de fichas existente; não introduzir um segundo catálogo nem pesquisa textual sem contrato.
- Fork e merge ficam fora; a interface só prepara pontos de extensão aprovados.

## Architecture Gate — workspace de veículo (2026-09-11)

O workspace será tenant-scoped e composto por endpoints próprios de leitura/criação de `TechnicalSheet`; o catálogo global continua somente descoberta. Cada ação deriva ator/organização da sessão e usa identidade exata da configuração. `latest` é temporal, `recommended` é calculado e `primary` permanece indisponível; nenhuma ação altera ficha existente. A UI será um componente isolado integrado sem reescrever as primitives ou fluxos paralelos. Estados de ausência, erro, acesso e identidade incompatível terão representação explícita. Provider, fork e merge ficam fora. Segurança: IDs são filtrados no servidor por organização/papel; o cliente não escolhe tenant, ator ou versão vencedora. Conclusão: `APPROVED`.

## Resultado do agente

- Estado: `🚧 Em execução — reaberta pela P0-012 em 2026-09-12.`
- Arquitetura: `APPROVED — task inteira autorizada em 2026-09-11.`
- Triagem automática: `Material — interface, endpoints e autorização.`
- Segurança: `Aplicável — tenant, RBAC e enumeração de dados.`
- Implementação: workspace tenant-scoped por configuração, criação de ficha independente ou a partir de revisão autorizada e ações de continuar/refresh via sessão. UI isolada adicionada à navegação sem substituir primitives; `latest` é temporal e `recommended`/`primary` permanecem explícitos como indisponíveis.
- Arquivos alterados: `services/api/db/repository.ts`, `services/api/index.ts`, `apps/web/src/VehicleWorkspace.tsx`, `apps/web/src/App.tsx` e esta task.
- Verificação: `npm run typecheck` e `git diff --check` passaram. Build permanece indisponível pela ausência preexistente de `vite.config.ts`; não houve provider real.
- Próximo passo: P1-036 — expor pesquisa direcionada na interface.

## Reconciliação P0-012 — 2026-09-12

O endpoint tenant-scoped e um componente inicial existem, mas a auditoria confirmou que o workspace exige UUID manual, não usa a ação de criar ficha, não mostra qualidade/alertas, retorna `recommended`/`primary` indisponíveis e omite fichas sem revisão pelo join atual. Portanto a jornada e o ciclo de vida declarados não estão integralmente entregues. O remanescente está separado entre `P0-013` (jornada canônica), `P1-045` (impacto/qualidade) e `P1-047` (tags, primary e ciclo); esta reabertura preserva o corte inicial e não autoriza alteração de UI/API sem seus gates.
