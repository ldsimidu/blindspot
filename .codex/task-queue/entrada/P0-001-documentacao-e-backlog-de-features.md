# ✅ Concluída — Consolidar documentação e backlog de features

> Prioridade: P0
>
> Área afetada: documentação de produto, arquitetura e planejamento técnico
>
> Origem ou referência: acervo acadêmico BlindSpot e baseline migrado do `ex_prompt`
>
> Arquitetura: `APPROVED — Lucas autorizou a execução em 2026-09-06`

## Pedido original preservado

> O conteúdo do BlindSpot está consolidado em `knowledge/01-fiap/corventures/blindspot`. A versão principal do backlog é `planejamento/backlog-requisitos-e-roadmap-blindspot.md`, com épicos, RF01–RF13, regras de negócio e roadmap conceitual. Complementos: roadmap consolidado, insumos de backlog técnico e entregas das Sprints 3 e 4. Trazer para `docs/` o conteúdo que ainda não estiver neste repositório e destacar cada feature seguindo Épico, Story, Task e Subtask.

## Decisão e escopo arquitetural

Criar uma camada documental versionada em `docs/product/` que explique o produto e mantenha um backlog navegável por feature. Ela será complementar à documentação técnica existente em `docs/architecture/agent-core/`; não altera o runtime, que continua tendo como fontes canônicas `packages/agent-runtime/assets/base-agent-prompt.txt`, `schema.json` e `mock-response.json`.

O trabalho começa por um inventário rastreável das fontes disponibilizadas e dos documentos já migrados. Cada afirmação importada deve apontar para seu arquivo de origem, data de consulta e status (`confirmado`, `a revisar` ou `fora do escopo`). Não copiar credenciais, logs, snapshots brutos de LLM ou dependências geradas. Não tratar material de pitch ou requisito acadêmico como contrato de API sem validação no código.

### Fluxo da pessoa operadora

1. A equipe abre `docs/product/README.md` e encontra o catálogo de features e seu estado.
2. Seleciona uma feature e lê o Épico (resultado de negócio), as Stories (resultado observável), Tasks e Subtasks (trabalho verificável).
3. Usa links para contrato técnico, schema, evidências e task da fila correspondente.
4. Antes de iniciar uma task material, aplica o Architecture Gate e atualiza somente o estado da própria task.

### Features confirmadas no checkout atual

| Feature | Evidência atual | Limite desta task |
|---|---|---|
| Geração de ficha técnica | `POST /api/ficha-tecnica`, `services/api/index.ts` | Documentar entrada, saída e falhas; não alterar endpoint. |
| Qualidade e rastreabilidade | AJV, `fonte_ref` e `fontes_utilizadas` em `services/api/validator.ts` | Explicar status, completude e vínculos de fonte. |
| Coleta assistida por LLM | providers simulated, Claude e OpenRouter | Documentar limites, modo simulado e proibição de expor segredos. |
| Consulta de última ficha e histórico | rotas `latest` e `history`; armazenamento local em `var/` | Registrar estado transitório atual e dependência da task de banco. |
| Experiência de leitura da ficha | `apps/web/src/App.tsx` | Mapear estados de carregamento, sucesso, vazio e erro sem redesenhar a UI. |

Funcionalidades citadas somente no acervo externo — por exemplo RF01–RF13, requisitos de sprint, monetização ou roadmap — entram primeiro como `a revisar` até que os arquivos de origem estejam acessíveis neste checkout ou sejam fornecidos por Lucas.

### Backlog a materializar no documento de produto

- Épico E01 — Gerar ficha técnica automotiva rastreável.
  - Story E01-S01 — Como operador, informo marca, modelo, versão, ano e mercado para solicitar uma ficha validada.
    - Task: documentar payload plano e aninhado, respostas 400/422/500 e limite de 1 MB.
    - Subtasks: vincular `VEHICLE_INPUT_SPEC.md`; registrar exemplo seguro; listar estados de entrada inválida.
  - Story E01-S02 — Como operador, leio grupos técnicos, status e fontes da ficha.
    - Task: documentar a apresentação de seções e rastreabilidade.
    - Subtasks: mapear `fonte_ref`; explicar confirmado, parcial, conflitante, não encontrado, não aplicável e inferido minimamente.
- Épico E02 — Assegurar qualidade, cobertura e proveniência.
  - Story E02-S01 — Como equipe, rejeito uma saída que não cumpra o schema ou referencie fonte inexistente.
    - Task: registrar validação AJV e consistência de fontes.
    - Subtasks: relacionar schema versionado, fixture segura e erros 422.
  - Story E02-S02 — Como equipe, identifico a completude de uma ficha sem esconder lacunas.
    - Task: documentar os cinco contadores de `resumo_completude`.
    - Subtasks: definir leitura de pendências e relação com o futuro baseline de qualidade.
- Épico E03 — Executar coleta por IA com controle operacional.
  - Story E03-S01 — Como operador autorizado, uso o modo simulado sem realizar tráfego externo.
    - Task: documentar provider, fallback e assets de mock.
    - Subtasks: diferenciar comportamento simulated, Claude e OpenRouter; proibir valores de `.env` em documentação.
  - Story E03-S02 — Como equipe, rastreio a execução sem publicar conteúdo bruto do prompt ou da resposta.
    - Task: registrar o limite entre observabilidade e dados restritos.
    - Subtasks: apontar política de logs; conectar à futura retenção em banco.
- Épico E04 — Preservar e consultar fichas validadas.
  - Story E04-S01 — Como operador, recupero a ficha mais recente e um histórico limitado.
    - Task: documentar as rotas de leitura e o comportamento 404.
    - Subtasks: registrar a persistência local atual e a dependência da task P1 de banco.

## Impacto técnico, dados e confiabilidade

- Novos documentos propostos: `docs/product/README.md`, `docs/product/features/` e `docs/product/source-inventory.md`.
- Documentos técnicos em `docs/architecture/agent-core/` continuam descrevendo o contrato já implementado; divergências devem ser corrigidas no documento, nunca presumidas como mudança de runtime.
- O inventário deve separar fatos confirmados no código, material importado e decisões pendentes. Cada feature deve apontar para o contrato ou arquivo real que a sustenta.
- Não há mudança de schema, provider, prompt, API, UI, persistência ou automação nesta task documental.

## Segurança e riscos

- O acervo pode conter dados não publicáveis. A triagem exclui `.env`, tokens, logs e snapshots brutos antes de copiar qualquer conteúdo.
- A documentação não reproduz configurações de provider nem URLs com credenciais.
- A origem externa ainda não está presente neste checkout; importar conteúdo sem acesso verificável seria criar documentação sem procedência.

## Plano incremental e verificações

1. Confirmar o caminho/permite de leitura do acervo `knowledge` e listar fontes elegíveis.
2. Criar inventário de origem e lacunas, depois o índice de features e arquivos por Épico.
3. Migrar conteúdo factual por domínio, incluindo links para contratos reais e marcadores de revisão.
4. Revisar por uma pessoa operadora: navegar de feature para Story, task, contrato e evidência.
5. Rodar `npm run typecheck` e `npm run build` somente se houver alteração no produto de código; para esta entrega documental, verificar links relativos, ausência de segredos e `git diff --check`.

## Double-check da arquitetura

- Confirmado: `docs/architecture/agent-core/` descreve o pipeline existente; assets de runtime ficam em `packages/agent-runtime/assets/`.
- Confirmado: a UI oferece geração, última ficha e histórico; a API valida antes de responder.
- Confirmado: o caminho `knowledge/01-fiap/corventures/blindspot` citado no pedido não existe neste checkout, portanto seu conteúdo não foi usado como fato.
- Estados de ausência previstos: fonte externa indisponível, documento sem evidência, link quebrado e feature ainda não implementada.
- Risco residual: o catálogo inicial pode ficar parcial até a leitura autorizada do acervo externo. Responsável por aceitar essa priorização: Lucas.

## Critérios de aceite

- [x] Há um índice de features destacado em `docs/product/`, organizado por Épico, Story, Task e Subtask.
- [x] Cada feature confirmada aponta para contratos, schema ou código real; conteúdo externo preserva origem e estado de revisão.
- [x] A documentação diferencia explicitamente comportamento atual, proposta e pendência.
- [x] Nenhum segredo, log ou snapshot bruto é incorporado.
- [x] Links relativos e formatação Markdown foram revisados; o resultado da verificação está registrado abaixo.

## Restrições e fora do escopo

- Não altera assets em `packages/agent-runtime/assets/`, endpoints, schema, prompt, provider, UI ou persistência.
- Não inventa RF01–RF13 nem requisitos de sprint que não possam ser lidos na origem.
- Não inicia a task de banco: ela permanece a próxima dependência P1.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou a execução em 2026-09-06`
- Implementação: criado o catálogo de produto, features, roadmap e inventário de fontes em `docs/product/`. O acervo `knowledge` indicado no pedido foi localizado e sintetizado, preservando o estado de cada afirmação.
- Arquivos alterados: este arquivo; `docs/product/README.md`; `docs/product/features/README.md`; `docs/product/roadmap.md`; `docs/product/source-inventory.md`.
- Verificação: `git diff --check` passou; varredura documental de padrões de segredo sem ocorrências; todos os links relativos de `docs/product/` existem.
- Verificações bloqueadas: nenhuma. `npm run typecheck` e `npm run build` não foram executados porque a entrega não alterou código, contrato, dependência ou runtime.
- Limitações: metas quantitativas, decisões de stack, requisitos acadêmicos e capacidades sem código permanecem explicitamente como proposta, planejadas ou em validação.
- Próximo passo: a P1 permanece `❌ Pendente`; ela só pode iniciar após `APPROVED` e definição de ambiente Neon, retenção e estratégia de migração.
