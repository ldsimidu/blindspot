# ✅ Concluída — E02-01 Governar fontes e identidade do veículo

> Prioridade: P1
>
> Área afetada: domínio, schema, validação, agente e documentação de dados
>
> Origem ou referência: `docs/product/backlog.md` E02-01; fluxos 1, 2 e 7
>
> Arquitetura: `APPROVED — Lucas aprovou P1-002 em 2026-09-08`
>
> Triagem automática: `Material — altera regras de qualidade e contratos de dados.`
>
> Segurança: `Aplicável — revisão proporcional registrada abaixo.`

## Pedido

Definir e implementar a governança de fontes e a identidade inequívoca de veículo: marca, modelo, versão, ano-modelo, mercado e, quando aplicável, motorização. Tornar a política de fonte verificável sem alegar cobertura não comprovada.

## Critérios de aceite

- [x] Cada ficha aceita identidade exata e referências de fonte verificáveis.
- [x] Fontes não aprovadas seguem política explícita de rejeição.
- [x] Fixtures/verificação local cobrem identidade divergente, host não aprovado e uso indevido de fonte simulated.

## Restrições ou contexto

- Preservar `schema.json` como contrato canônico até Gate aprovado.
- Não contratar fontes, consultar conteúdo externo ou definir score definitivo por inferência.

## Arquitetura proposta

### Decisão e escopo

**Fatos confirmados:** o contrato atual já exige `veiculo_alvo` com marca, modelo, versão, ano-modelo e mercado; exige URL e tipo para cada fonte; e valida que todo `fonte_ref` existe em `fontes_utilizadas`. Contudo, ele ainda não comprova que a ficha retornada é do veículo solicitado nem classifica/rejeita uma URL fora da política. O mock local declara `example.com` como fonte oficial, evidenciando que não pode servir de referência de produção.

**Decisão proposta:** introduzir `packages/agent-runtime/assets/source-policy.json` como política versionada e canônica de governança. O runtime a carrega junto com prompt/schema, injeta sua versão e regras relevantes na composição do prompt e valida a resposta final contra ela antes de persistir/devolver a ficha.

O primeiro recorte de política será deliberadamente restrito ao caso Ford/Brasil já presente nos assets/configurações locais: domínios oficiais explicitamente aprovados e a lista de fontes parceiras já declarada no prompt canônico. Para marca/mercado sem política aprovada, a resposta falha com erro de validação controlado; não há aproximação por domínio parecido, fonte genérica ou fallback silencioso.

**Fora de escopo:** consulta externa, scraping, contratação de JATO/NHTSA, score numérico definitivo, catálogo/aliases, fila de QA, normalização de unidades, persistência adicional, multi-tenant e provider novo. Motorização não entra no contrato de entrada atual; sua inclusão é decisão de contrato posterior, não inferência desta task.

### Fluxo de pessoa usuária e agente

1. Analista informa marca, modelo, versão, ano-modelo e mercado.
2. API normaliza apenas forma segura (trim, normalização Unicode e comparação sem diferença de maiúsculas/minúsculas), sem aplicar alias ou trocar identidade.
3. O agente recebe identidade e política de fontes da combinação autorizada e pesquisa apenas sob as regras configuradas.
4. A resposta declara `veiculo_alvo`, fontes e `fonte_ref`.
5. Antes de responder, o servidor valida: schema; identidade retornada igual à solicitada; IDs de fonte existentes; URL HTTPS; tipo conhecido; host permitido para o bucket/tipo e marca/mercado; e restrições de fonte simulada apenas no provider `simulated`.
6. Uma violação devolve 422 com código seguro, sem URL completa, host interno, segredo ou tentativa de consulta. A ficha não é salva/publicada.
7. A ficha aprovada preserva as fontes declaradas e prossegue para P1-003/P1-004; conflito de conteúdo e revisão humana continuam fora deste recorte.

### Informação, contrato e impacto técnico

- Novo asset versionado: política com versão, tipos permitidos, domínios por marca/mercado, domínios parceiros e exceção exclusiva de fixture local.
- Novo resolvedor em `runtime-assets.ts`: leitura tipada da política, sem buscar rede.
- `prompt-builder.ts`: inclui a política relevante de forma explícita no prompt, para reduzir divergência entre instrução e validação.
- `validator.ts`: recebe contexto de validação (`vehicle` solicitado, provider e política), compara os cinco identificadores e aplica a política de fonte após AJV/`fonte_ref`.
- `index.ts`: passa contexto conhecido do request e do provider ao validador. Rotas e forma pública de sucesso permanecem inalteradas; novas falhas são `422` de validação.
- `mock-response.json`: deixa de declarar `example.com` como fonte oficial; fixture simulated só é aceita pela exceção local explícita e não pode ser usada por Claude/OpenRouter.

### Segurança e risco proporcional

**Gatilhos:** IA com web search, API pública, URLs não confiáveis em payload e dados de proveniência. A revisão é aplicável, mas não autoriza chamadas de provider ou consultas de URL.

- Fronteiras: entrada de veículo e resposta de LLM → validação local → API/persistência. A política é arquivo versionado local; `.env`, tokens, logs brutos e resultados de provider ficam fora do escopo.
- Ameaças: modelo inventar URL/tipo; mistura de versão/mercado; domínio parecido ou URL com hostname enganoso; usar exceção simulated em provider real; detalhes de erro revelarem conteúdo sensível.
- Controles: comparação fail-closed dos cinco campos; `URL` parseada com HTTPS obrigatório e hostname normalizado; comparação por limite de subdomínio, nunca substring; tipo/bucket permitido; exceção de mock condicionada ao provider; mensagens públicas genéricas com códigos, detalhes diagnósticos sanitizados; nenhuma requisição HTTP na validação.
- Verificações planejadas: fixture válida Ford/BR; veículo com ano/mercado/versão divergente; `fonte_ref` inexistente; host não permitido, HTTP, URL malformada e domínio parecido; exceção mock recusada fora de `simulated`; `npm run typecheck`; smoke simulated; revisão de ausência de URL/token em erro público. Provider real permanece bloqueado sem ambiente e autorização.
- Risco residual: uma allowlist valida procedência declarada, não prova que a página contém o dado correto. P1-003/P1-004 tratarão normalização, conteúdo e conflito. Lucas é responsável pela aceitação do risco residual.

### Plano incremental e reversível

1. Definir política v1 Ford/Brasil e fixture local, com decisão de domínios/tipos explicitamente registrada.
2. Criar leitura canônica e contexto de validação; atualizar prompt e validator sem alterar o contrato de sucesso.
3. Atualizar o mock seguro e adicionar fixtures de identidade/fonte inválida.
4. Rodar typecheck e smokes locais no provider simulated; não chamar OpenRouter, Gemini ou Claude.
5. Atualizar `docs/product` e contratos técnicos apenas para refletir comportamento comprovado.
6. Reversão: remover a política/validação nova e restaurar os imports anteriores em um único commit; não há migração, dado remoto ou provider para desfazer.

## Decisões pendentes antes da implementação

- Confirmar os domínios oficiais Ford/Brasil que entram na política v1. Proposta inicial, extraída das configurações locais existentes: `ford.com.br`, `fordservicecontent.com` e `www.guia360ford.com.br`.
- Confirmar se a lista de parceiros já presente no prompt canônico é aprovada para validação server-side ou deve começar vazia/fail-closed. Proposta: usar a lista atual, preservando que ela nunca se apresenta como fonte oficial.
- Confirmar que, nesta fase, motorização permanece evidência na ficha e não filtro de identidade de entrada; qualquer campo novo no request será task/contrato próprio.

## Double-check da arquitetura

- Confirmado: schema canônico requer os cinco campos de identidade e pelo menos uma fonte com `id`, `url`, `titulo` e `tipo`.
- Confirmado: validator atual só valida AJV e existência de `fonte_ref`; não compara `veiculo_alvo` com o request nem permite/rejeita host/tipo.
- Confirmado: prompt atual já declara prioridades, buckets, parceiros e regra de não misturar identidade, mas não é uma política server-side executável.
- Confirmado: o mock usa `example.com` com tipo oficial; ele deve mudar para uma fonte explicitamente local e só ser aceito no fluxo simulated.
- Confirmado: P1-001 pode continuar em paralelo; esta task valida antes de qualquer escrita e não depende dos seus testes pendentes.
- Estados revistos: entrada inválida (400), identidade/fonte inválida (422), asset ausente/JSON inválido (erro controlado), provider indisponível (sem fallback não autorizado) e fonte de mercado não governado (422).
- Conclusão arquitetural: as três decisões foram aprovadas por Lucas em 2026-09-08; a implementação e verificações registradas abaixo concluíram o recorte.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas aprovou P1-002 em 2026-09-08`.
- Segurança: `Aplicável — revisão proporcional registrada nesta task.`
- Implementação: criada a política canônica versionada `source-policy.json`; runtime passa a carregá-la e incluí-la no prompt; API passa contexto de request/provider ao validador; validator compara os cinco identificadores e valida HTTPS, tipo e host de fonte sem fazer requisição de rede. O mock agora se declara `mock_local`, permitido somente no provider simulated.
- Arquivos alterados: `packages/agent-runtime/assets/source-policy.json`, `mock-response.json`, `services/api/runtime-assets.ts`, `prompt-builder.ts`, `index.ts`, `validator.ts`, `scripts/verify-source-policy.ts`, `package.json`, `docs/architecture/agent-core/VALIDATION_AND_TYPES.md`, `docs/product/fluxograma-desenvolvimento-agente.md` e este arquivo.
- Verificação: `npm run typecheck` passou; `npm run verify:source-policy` passou; smoke HTTP local com `LLM_PROVIDER=simulated` e `PERSISTENCE_MODE=file` aceitou Ford/Ranger/Raptor/2025/Brasil com `mock_local` e recusou mercado não governado com 422; `git diff --check` passou. Nenhuma chamada OpenRouter, Gemini, Claude ou URL externa ocorreu.
- Verificação de build atualizada (2026-09-08): `npm run build` passou fora do sandbox em 867 ms. A falha anterior era limitação de permissão do ambiente de validação ao ler diretório ancestral, não ausência de `vite.config.ts` no projeto.
- Segurança: revisão proporcional aplicada. A validação é fail-closed, não consulta URLs, não expõe URL em erro público e não aceita fonte mock em provider remoto. O risco residual é que allowlist comprova a procedência declarada, não o conteúdo factual da página; normalização/conflito seguem em P1-003/P1-004.
- Decisões aprovadas: política v1 Ford/Brasil com `ford.com.br`, `fordservicecontent.com` e `www.guia360ford.com.br`; parceiros existentes somente como apoio, nunca como fonte oficial; motorização permanece evidência da ficha, não filtro de entrada.
- Próximo passo: iniciar P1-003 para normalização com proveniência quando Lucas solicitar; política de novas marcas/mercados deve ser adicionada explicitamente, nunca por alias ou inferência.
