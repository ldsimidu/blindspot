# ❌ Pendente — Multisearch e seleção explícita para comparar fichas

> Prioridade: P1
>
> Área afetada: Catálogo, Comparar e interface de descoberta
>
> Origem ou referência: P1-017, P1-024 e P1-025; E03-02/E03-03
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 2026-09-09.`
>
> Triagem automática: `Material — altera a jornada de seleção e navegação na interface; não altera contrato de API, schema, IA ou persistência.`
>
> Segurança: `Não aplicável — usa os mesmos dados globais autenticados e o mesmo RBAC de P1-017; não cria rota, permissão, armazenamento, telemetria ou dado pessoal.`

## Problema confirmado

- `FichaDiscovery` recebe uma única ação `onSelect`. No Catálogo, ela abre a ficha; em Comparar, ela alterna uma seleção interna.
- A tela de Comparar mostra apenas o contador `0/2`; não apresenta slots de **Ficha A** e **Ficha B**, nem um botão explícito para adicionar/remover cada candidata.
- No Catálogo, a pessoa não consegue manter duas candidatas selecionadas e só então ir para comparação: o CTA atual existe apenas depois de abrir uma ficha ou nas relacionadas.

## Decisão proposta

Criar uma seleção múltipla local, compartilhada entre Catálogo e Comparar, com capacidade fixa de **duas fichas**.

1. Cada resultado de descoberta terá ações distintas e acessíveis:
   - **Ver ficha** abre a ficha por identidade exata;
   - **Adicionar à comparação** adiciona a candidata retornada pelo servidor, apenas para `analyst|admin`;
   - quando já selecionada, a ação vira **Remover da comparação**.
2. Um painel persistente em memória, **Seleção para comparação**, mostra slots `Ficha A` e `Ficha B`, suas tags de identidade, botão individual de remover e a contagem `0/2`, `1/2` ou `2/2`.
3. O painel aparece no Catálogo e em Comparar para `analyst|admin`. Com duas fichas, **Ir para comparar** navega à tela Comparar sem criar nem salvar análise.
4. Em Comparar, a seleção compartilhada é a fonte de verdade. A pessoa pode continuar usando o multisearch para trocar A/B, e só **Comparar e salvar análise** chama P1-017.
5. Tentar adicionar uma terceira ficha não descarta silenciosamente A/B: desabilita a ação e informa que as duas vagas estão preenchidas. Itens sem `latestTechnicalSheetVersionId` nunca são selecionáveis.

## Critérios de aceite

- [ ] Catálogo oferece **Ver ficha** e **Adicionar/Remover da comparação** como ações separadas para cada resultado elegível.
- [ ] A pessoa pode selecionar A e B em qualquer ordem, visualizá-las nos slots e navegar para Comparar.
- [ ] Comparar mostra a mesma seleção e permite remover/substituir fichas antes de executar a comparação.
- [ ] Não há comparação, persistência ou análise salva antes do clique explícito em **Comparar e salvar análise**.
- [ ] `viewer` continua sem controles de seleção/comparação; o servidor mantém validação de papel e compatibilidade.
- [ ] Recente, filtros, paginação, abertura exata e relacionadas continuam disponíveis; nenhuma seleção é guardada após reload/logout.
- [ ] Backlog e fluxograma registram o fluxo A/B após a implementação verificada.

## Segurança e limites

- A seleção é estado transitório de memória contendo somente `CatalogCandidate` retornada pelo servidor e seu identificador de versão; não aceita tenant, resultado, payload técnico, campo livre ou IDs inventados.
- A UI não garante permissão: P1-017 ainda revalida duas versões, papel, mercado, motorização e tenant no servidor.
- Sem novo contrato, banco, telemetria, perfil ou dado pessoal. Reabrir revisão se a seleção passar a persistir, compartilhar ou produzir recomendação.

## Plano incremental

1. Elevar `selectedCandidates` para `App` e expor operações puras de adicionar/remover, máximo dois e troca explícita.
2. Evoluir `FichaDiscovery` para receber ações separadas de abrir e selecionar, estados de item e CTA desabilitada quando a seleção estiver cheia.
3. Criar painel de slots A/B reutilizado no Catálogo e em Comparar; integrar navegação **Ir para comparar**.
4. Manter `ComparisonPanel` como consumidor da seleção compartilhada e preservar a chamada exclusiva de P1-017 no botão final.
5. Verificar typecheck, build, contrato de catálogo e smoke manual A/B, remover, terceira ficha, viewer, incompatível e reload/logout; então atualizar documentação.

## Double-check da arquitetura

- A correção não depende de mudar a API: P1-024 já entrega candidatos com UUID da versão mais recente, e P1-017 já exige exatamente dois UUIDs no servidor.
- Separar “ver” de “adicionar” resolve a ambiguidade que hoje impede o fluxo esperado; slots visíveis dão confirmação antes de navegar.
- O limite de duas fichas respeita o contrato de comparação atual; trocar o limite exigiria outra task e revisão do contrato.
- Estado: `READY`. A implementação só inicia após aprovação explícita de Lucas.

## Resultado do agente

- Estado: `❌ Pendente — postergada por Lucas em 2026-09-10 para avançar a próxima prioridade.`
- Entregue parcialmente e ainda sem commit: catálogo com escopo de última versão ou todas as versões, comparação com avisos de mercado/motorização e bloqueio de identidade inconsistente.
- Pendente para concluir: seleção A/B compartilhada entre Catálogo e Comparar, ações separadas de abrir/adicionar no Catálogo, documentação de produto e verificações integrais.

## Adendo de arquitetura — comparação ampla e histórico integral — 2026-09-10

### Fatos confirmados

- O bloqueio atual é calculado no servidor: `market_mismatch`, `motorization_mismatch` e `motorization_not_confirmed` já são retornados como códigos em `details.codes`; `version_identity_inconsistent` indica divergência entre a identidade persistida e o veículo declarado no payload.
- O catálogo retorna somente a versão mais recente por configuração. No banco atual há 3 configurações e 10 versões técnicas; portanto “todas as fichas geradas” exige descobrir versões históricas, não repetir as três configurações.

### Decisão proposta

1. Transformar mercado diferente, motorização diferente e motorização não confirmada em **avisos de comparação**, sem impedir a criação ou o salvamento. A tela mostra a origem de cada lado e os avisos no resultado salvo.
2. Manter como bloqueios: versão inexistente, a mesma versão escolhida duas vezes e `version_identity_inconsistent`. Esse último caso pode associar conteúdo técnico ao veículo errado e não é uma divergência comparativa legítima.
3. Não normalizar `Brasil` e `BR` neste corte. Eles permanecem mercados distintos, visíveis no cabeçalho e no aviso, sem reescrever a identidade ou os dados históricos.
4. Estender a descoberta autenticada com escopo explícito `latest|all_versions`, cujo padrão é `latest`. Em `all_versions`, cada cartão representa uma versão imutável e mostra número, data de geração e indicação de ser ou não a mais recente. Paginação, filtros e seleção A/B operam sobre a versão retornada, nunca sobre uma substituição silenciosa pela mais recente.
5. A abertura de uma versão histórica valida que ela pertence à configuração apresentada; a comparação recebe os dois UUIDs de versão já mostrados à pessoa.

### Impacto técnico e segurança

- Altera o contrato autenticado de catálogo e de resultado de comparação, sem migration, provider, prompt, retenção ou dado pessoal novo. A versão do contrato de comparação passa a distinguir resultados com avisos dos resultados legados.
- A fronteira continua sendo a sessão corporativa ativa. O servidor continua validando papel `analyst|admin`, UUIDs, pertencimento da versão à configuração e bloqueios de integridade; a UI apenas apresenta avisos retornados ou derivados de dados já selecionados.
- A exposição continua global autenticada, decisão já aceita no P1-024. O histórico adicional não pode expor organização, conta, prompt, token, evento de auditoria ou payload fora da abertura exata autorizada.
- Revisão de segurança: aplicável por ampliar resposta autenticada e leitura de versões persistidas. Controles: parâmetros allowlist, paginação limitada, SQL parametrizado, identidade exata e resposta mínima. Sem integração externa ou dados pessoais adicionais. Risco residual: versões históricas globais já são dados técnicos e a decisão de catálogo global permanece sob responsabilidade de Lucas.

### Verificações planejadas

- `scope=latest` preserva os resultados atuais; `scope=all_versions` retorna versões distintas, ordenadas por geração e paginadas.
- Abertura de versão histórica usa o UUID exibido; UUID incompatível com a configuração recebe resposta neutra.
- Mercado/motorização divergentes salvam comparação com avisos; identidade inconsistente e IDs inválidos continuam bloqueados no servidor.
- Validar `viewer`, ausência de atributos de tenant/sessão, typecheck, build, `git diff --check` e smoke manual de seleção A/B em ambos os escopos.

### Double-check da arquitetura

- Liberar mercado/motorização não altera ou apaga os valores; o resultado preserva os dois contextos e comunica a limitação antes e depois de salvar.
- Liberar identidade inconsistente seria diferente: ela compromete a confiança de que cada lado representa o veículo exibido. Por isso permanece bloqueada.
- O modo histórico deve selecionar a versão exata, pois usar a versão mais recente no momento da comparação violaria a expectativa de “todas as fichas geradas”.
- Estado do adendo: `APPROVED — Lucas autorizou a implementação em 2026-09-10.`
