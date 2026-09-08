# ❌ Bloqueada — E02-05a Catálogo e busca exata de fichas

> Prioridade: P1
>
> Área afetada: persistência, API, catálogo e interface
>
> Origem ou referência: `docs/product/backlog.md` E02-05; fluxos de catálogo e consulta
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação da P1-005A em 08/09/2026`
>
> Triagem automática: `Material — cria consultas, índices e comportamento de produto.`
>
> Segurança: `A avaliar — API, persistência e acesso futuro a dados corporativos.`

## Pedido

Criar catálogo consultável por identidade canônica, aliases e slug legível, retornando estados explícitos de carregando, encontrado, não cadastrado, incompatível e erro.

## Critérios de aceite

- [ ] Busca não devolve veículo aproximado silenciosamente.
- [ ] Catálogo preserva versão e proveniência da ficha retornada.
- [ ] Paginação, índices e contratos de ausência/erro são definidos e verificados.

## Restrições ou contexto

- Consome a fundação da P1-001 quando ela for a fonte de leitura aprovada.
- Não usar slug como chave global nem introduzir fallback silencioso ao arquivo.

## Preflight — 2026-09-08

### Pedido e recorte

- **Resultado esperado:** disponibilizar um catálogo de leitura em PostgreSQL para localizar candidatas por identidade ou alias e abrir somente uma ficha cuja identidade canônica tenha sido confirmada pela pessoa usuária.
- **Paths e contratos consultados:** `services/api/index.ts`, `services/api/db/client.ts`, `services/api/db/repository.ts`, `services/api/db/schema.ts`, `apps/web/src/App.tsx`, `apps/web/src/api.ts`, `apps/web/src/types.ts`, `docs/product/backlog.md`, `docs/product/fluxograma-desenvolvimento-agente.md`, P1-001 e a estratégia de verificação.
- **Fatos confirmados:** P1-001 já possui `vehicle_configurations` com chave única de cinco partes, versões imutáveis e leitura PostgreSQL; o modo `file` ainda lê snapshots locais; `latest/history` atuais não filtram por veículo; a UI só exibe requisição e histórico; não existem aliases nem slug persistidos.
- **Hipóteses e lacunas:** não há política aprovada para alias editorial/manual, nem autenticação/tenant. Portanto, este corte aceita somente aliases determinísticos derivados da identidade canônica e não promete sinônimos comerciais arbitrários, busca global corporativa ou isolamento por organização.

### Impacto e risco

- **Afetados:** schema/migration Drizzle, repositório PostgreSQL, endpoints públicos de leitura, contrato TypeScript e interface de catálogo.
- **Riscos:** seleção silenciosa de veículo parecido; colisão de slug; enumeração/carga excessiva do catálogo; volta implícita a snapshots locais; exposição de erro de banco.
- **Reversibilidade e condição de abortar:** migration é aditiva; endpoints novos não substituem `latest/history`; abortar a entrega se a query não puder distinguir identidade completa, se aliases exigirem curadoria não aprovada, se o modo PostgreSQL não estiver explícito ou se houver necessidade de autorização/tenant fora do escopo.

### Verificação prevista

- Fixtures/repositório: identidade exata, candidatos múltiplos por alias, ausência, incompatibilidade, slug repetido e paginação/limites.
- API/UI: carregando, encontrado, não cadastrado, incompatível, erro sanitizado e nenhuma seleção automática.
- Gate local: `npm run typecheck`, verificações de contrato existentes, teste dedicado do catálogo, `npm run build` e smoke simulated com PostgreSQL somente em ambiente já autorizado.

### Próximo passo

`Architecture Gate`

## Revisão de segurança — catálogo e busca exata

### Escopo e gatilhos

- **Mudança:** consulta pública local à API, persistência de identificadores de catálogo e interface de busca.
- **Gatilhos:** API pública, persistência e dados de produto. Autenticação, autorização, segredo, provider, exportação e retenção não mudam neste corte.

### Fronteiras e riscos

- **Dados, segredos e integrações:** identidade pública de veículo, versão/data e proveniência já persistida; conexão PostgreSQL existente via ambiente. Nenhuma credencial, prompt, snapshot bruto ou URL de conexão entra na resposta.
- **Cenário de abuso ou falha principal:** uma busca ampla revela ficha errada, permite enumeração ilimitada ou devolve detalhe do banco; um slug ambíguo é tratado como chave e abre configuração alheia.
- **Controles e critérios de aceite:** parâmetros com tamanho/limite allowlisted; paginação limitada e ordenação estável; alias retorna lista de candidatas, nunca ficha escolhida; detalhe exige chave interna e identidade canônica completa; slug é apenas apresentação; erros 4xx/5xx sanitizados com correlação; sem fallback para `file` quando a leitura de catálogo pede PostgreSQL.

### Verificação planejada

- Testar entrada inválida, alias ambíguo, ausência, paginação fora do limite, indisponibilidade de persistência e ausência de segredo no corpo de erro.
- Usar apenas fixture/mode simulated e ambiente PostgreSQL já autorizado; não chamar provider real nem registrar payload bruto.

### Achados, exceções e risco residual

- **Sem RBAC/tenant:** até P1-011/P1-013, o catálogo continua de escopo técnico local e não é declarado como isolamento corporativo. Lucas é responsável por aceitar esse risco residual no Architecture Gate.
- **Alias manual:** fica fora deste corte até existir origem, curadoria e auditoria de alterações.

### Bloqueios e próximo passo

- Prosseguir somente após aprovação explícita da arquitetura abaixo; identidade/RBAC serão Gates próprios para expor o catálogo a clientes corporativos.

## Arquitetura proposta

### Decisão e escopo

Implementar a **P1-005A**, catálogo de leitura exata sobre PostgreSQL, sem lote, importação, merge automático ou aliases editoriais. A fundação da P1-001 é a única fonte de leitura para os novos endpoints: se `PERSISTENCE_MODE` não for `postgres`, o catálogo responde estado de indisponibilidade controlado; ele nunca consulta `var/data` como fallback.

O catálogo terá dois atos distintos:

1. **Descoberta:** consulta por texto/alias normalizado devolve uma página de candidatas mínimas. Um alias pode devolver zero, uma ou várias candidatas; a API não infere vencedora.
2. **Abertura:** somente a identidade canônica completa (`marca`, `modelo`, `versao`, `ano_modelo`, `mercado`) junto do identificador estável da configuração retorna a versão atual da ficha. Divergência entre id e identidade devolve `incompatível`, nunca a ficha de outro veículo.

O slug legível é derivado de marca/modelo/versão/ano/mercado e exposto como metadado ou rota estética, mas não é chave global, não é usado para autorização e não resolve colisões. O identificador UUID da configuração é a chave técnica; uma rota com slug, caso seja criada, exige também o UUID e confirma a identidade.

### Fluxo de pessoa usuária

1. A pessoa abre Catálogo; a UI apresenta estado `carregando` e faz descoberta paginada.
2. Ao informar texto, a API normaliza caixa, espaços e diacríticos apenas para comparação. Ela consulta aliases determinísticos gerados da identidade canônica e devolve candidatas, com identidade, slug, versão atual/data e fontes resumidas.
3. Sem candidatas, a UI mostra `não cadastrado` e oferece voltar à solicitação de coleta — sem iniciar nova coleta automaticamente.
4. Com mais de uma candidata ou filtro incompatível, a UI mostra `incompatível` e exige seleção explícita da configuração.
5. Após seleção, a UI requisita detalhe com UUID e os cinco campos canônicos. O repositório lê a versão atual imutável e suas fontes; id/identidade divergentes devolvem `incompatível`.
6. Falhas previsíveis de entrada devolvem 400; ausência após identidade completa devolve 404/estado `não cadastrado`; persistência indisponível devolve erro sanitizado e a UI mostra `erro`. Nenhuma dessas situações abre histórico de arquivo ou veículo aproximado.

### Dados, contratos e impacto técnico

- Criar migration aditiva com `catalog_slug` não exclusivo em `vehicle_configurations`, índice de ordenação para versão atual e tabela `vehicle_configuration_aliases` (`vehicle_configuration_id`, `alias_normalized`, `alias_display`, `kind`, timestamps). A unicidade será escopada ao par configuração/alias; um alias pode referir várias configurações, pois ambiguidade deve permanecer visível.
- Ao persistir uma ficha, criar aliases determinísticos somente da própria identidade canônica (formas normalizadas de marca, modelo, versão, combinação e slug). Não importar listas externas nem inventar apelidos de mercado. Backfill da migration gera somente slug/normalização determinística para registros existentes; se um registro histórico não puder ser normalizado, ele continua legível por identidade exata e fica fora da descoberta até nova persistência.
- Separar no repositório `searchCatalog`, `readCatalogEntryExact` e mapeadores de resposta. Consultas usam limites estritos (página >= 1; tamanho máximo pequeno e constante), ordenação determinística e selecionam metadados mínimos; o payload completo só aparece no detalhe.
- Adicionar contratos de resposta discriminados: `found`, `not_registered`, `incompatible` e `error` para a interface; erros HTTP preservam `{ message, details }` sanitizado. `loading` é estado exclusivo da UI, não resposta persistida.
- Adicionar endpoints de catálogo sem alterar `POST /api/ficha-tecnica` nem substituir `latest/history`; as rotas atuais permanecem compatíveis. A UI ganha visão Catálogo, busca, lista de candidatas e detalhe reutilizando a visualização rastreável já existente.
- P1-006 preserva o escopo de lote, dry-run, idempotência operacional e duplicatas de importação. P1-008 preserva a experiência completa de consulta/leitura e acessibilidade avançada. Esta task só entrega o corte mínimo que os habilita.

### Segurança, confiabilidade e limites

- A leitura só usa PostgreSQL explicitamente configurado; ausência de `DATABASE_URL` ou indisponibilidade falha fechado, com erro sanitizado e `x-request-id`.
- A query não aceita ordenação/coluna dinâmica, SQL bruto ou página ilimitada. Normalização é local e limitada; texto longo ou caracteres de controle é rejeitado com 400.
- Nenhuma tabela de usuário, organização, sessão, papel, consumo, exportação ou decisão de QA é criada. Antes de acesso corporativo, P1-011/P1-013 deverão colocar autenticação/RBAC no servidor e uma revisão de segurança própria avaliará tenant e rate limit de produção.
- O risco residual aceito para ambiente local é enumeração de dados técnicos já catalogados; não há promessa de exposição pública nem autorização corporativa nesta P1-005A.

### Plano incremental e verificações

1. Adicionar tipos de catálogo e normalizador puro, com casos de caixa/espaços/acentos e slug não-chave.
2. Criar schema/migration/repositório de aliases e catálogo; testar busca ambígua, exata, ausente, identidade divergente, paginação e ordenação.
3. Expor endpoints e testar 400, 404/estado, 503 e ausência de detalhe de banco/segredo.
4. Implementar UI com os cinco estados explícitos e seleção obrigatória, reaproveitando a leitura de ficha para fonte, versão e proveniência.
5. Executar verificações locais, build e smoke simulated no PostgreSQL já autorizado; documentar o contrato técnico e atualizar o fluxo de produto somente com comportamento comprovado.

### Double-check da arquitetura

- Confirmado: a chave única atual contém exatamente marca, modelo, versão, ano e mercado, portanto suporta abertura exata sem usar slug.
- Confirmado: `latest/history` em PostgreSQL são globais e não filtram por identidade; criar catálogo separado evita mudar silenciosamente seu contrato.
- Confirmado: o modo `file` ainda usa snapshots e não pode satisfazer a exigência de fonte de leitura aprovada; ele será explicitamente recusado nas rotas novas.
- Confirmado: não há aliases nem slug no schema atual; a migration precisa ser aditiva e não pode tratar slug como único.
- Revistos: consulta vazia, alias com múltiplas configurações, alias sem resultado, id/identidade incompatíveis, página inválida, banco ausente, fonte sem versão e dados legados sem alias.
- Conclusão: arquitetura `READY`. A P1-005A é implementável sem ampliar para lote, curadoria de aliases, tenancy ou provider. Aguarda `APPROVED` explícito de Lucas antes de mudar o estado para `🚧 Em execução`.

## Resultado do agente

- Estado: `❌ Bloqueada`; Arquitetura: `APPROVED — Lucas autorizou a implementação da P1-005A em 08/09/2026`; Segurança: `Aplicável — revisão proporcional registrada acima`.
- Implementação parcial: adicionados slug legível e aliases determinísticos por configuração, migration aditiva, repositório de descoberta/abertura exata, endpoints de catálogo, contrato de interface e visão Catálogo. A abertura exige UUID e os cinco campos da identidade; alias só lista candidatas. Modo `file` retorna 503 e não lê snapshots como fallback.
- Arquivos principais: `services/api/catalog.ts`, `services/api/db/schema.ts`, `services/api/db/repository.ts`, `services/api/index.ts`, `drizzle/0001_boring_emma_frost.sql`, `apps/web/src/App.tsx`, `apps/web/src/api.ts`, `apps/web/src/types.ts`, `scripts/verify-catalog-contract.ts` e `docs/architecture/agent-core/HTTP_PIPELINE.md`.
- Verificações aprovadas: `npm run typecheck`; `npm run verify:catalog-contract`; `npm run verify:quality-policy`; `npm run verify:field-policy`; `npm run verify:normalization`; `npm run verify:source-policy`; `npm run verify:technical-sheet-catalog`; `npm run build`. Smoke em modo `file`: health 200, catálogo 503 controlado e página inválida 400.
- Verificação bloqueada: o driver Neon via `Pool` recebe erro de transporte WebSocket `Received network error or non-101 status code` neste ambiente, inclusive fora do sandbox. A consulta transacional ao PostgreSQL e a confirmação da migration não foram declaradas aprovadas. O pacote `ws`, recomendado pela documentação do Neon para fornecer o construtor WebSocket em Node, não foi instalado porque o registry não concluiu a operação local.
- Próximo passo: disponibilizar transporte WebSocket compatível para o Neon (ou autorizar/viabilizar a instalação de `ws`), repetir `db:migrate` e os smokes PostgreSQL de descoberta, seleção exata, ausência e incompatibilidade; somente então avaliar a conclusão da P1-005A.
