# Revisão de segurança — telemetria agregada de resultado LLM

Data: `2026-09-11`

## Escopo e gatilhos

- Mudança: incluir um resumo agregado e sanitizado do resultado no evento local `llm_execution`.
- Gatilhos: IA, auditoria e retenção local de logs.
- Não aplicável: não há novo endpoint, mudança de autorização, provider, dependência, banco, schema público ou chamada de rede.

## Fronteiras e riscos

- Dados, segredos e integrações envolvidos: saída não confiável do provider e arquivos locais de log já existentes. Nenhuma chave, header, prompt, URL, título, trecho de evidência, valor de variável ou resposta bruta é enviado ou persistido pelo novo resumo.
- Cenário de abuso ou falha principal: uma resposta controlada pelo provider poderia injetar texto, identificadores ou URLs em uma linha de telemetria, ou uma contagem sem limite poderia ampliar o log.
- Controles e critérios de aceite: o resumo aceita somente enums fechados para status e aderência, chaves de grupo com regex fechada, inteiros não negativos e árvores/coleções com limites. A telemetria registra somente contagens.

## Verificação planejada ou executada

- `npm run typecheck`: aprovado localmente.
- `npm run verify:telemetry-sanitization`: aprovado localmente; fixture confirma que valores, URLs, títulos, IDs de fonte e chaves não permitidas não aparecem no resumo.
- `npm run build`: aprovado localmente, sem usar provider real.

## Achados, exceções e risco residual

- Achado: o histórico de auditoria dependia de snapshots de resposta, que podem não existir em todos os modos de persistência. O `result_summary` reduz essa lacuna sem criar nova persistência de conteúdo bruto.
- Risco residual: métricas derivadas de uma resposta malformada podem estar ausentes, mas nunca substituem a validação da ficha nem provocam falha da geração. Responsável pela aceitação do risco residual: Lucas.

## Bloqueios e próximo passo

- Nenhum bloqueio de implementação. Uma geração manual futura, se autorizada pelo operador, deve confirmar a presença do resumo no evento local; esta revisão não realiza chamada real ao provider.

## Complemento P1-027 — classe de fonte por vínculo (2026-09-11)

- Mudança: acrescentar contagens por `official`, `partner` e `other` ao `result_summary.source_usage`, incluindo somente fontes publicadas/referenciadas e campos com vínculo ou vínculo resolvido.
- Controle principal: `official` não é um rótulo aceito do provider. Ele exige simultaneamente `avaliacao_politica.na_lista_aprovada` produzida pelo servidor e um tipo presente na política de fontes carregada pelo runtime. A lista serve somente em memória durante a sanitização e não é serializada.
- Segurança e dados: classes e números são allowlisted; tipos, IDs, URLs, títulos, valores, chaves arbitrárias e conteúdo externo continuam ausentes do evento. Configuração/payload ausente ou malformado degrada para `other`, sem falhar a geração.
- Verificação: `npm run verify:telemetry-sanitization` e `npm run typecheck` aprovados localmente; o teste cobre fonte oficial aprovada, parceira aprovada, tipo não classificado e injeção de texto/ID. Build e uma geração manual comparável permanecem como próximos checks.
- Risco residual: a métrica mostra uso de classe de proveniência, não autenticidade factual de um campo. Lucas aceita esse risco residual para fins de auditoria.

## Correção de estágio — resumo validado (2026-09-11)

- Achado: `llm_execution` era gravado antes de `validateResponse`; por isso, a telemetria de classe não podia refletir a avaliação de política server-owned aplicada à ficha persistida.
- Decisão: manter `llm_execution` limitado a métricas do provider e adicionar `validated_technical_sheet_result` após validação, com `request_id` existente e o mesmo resumo agregado/sanitizado.
- Controle: a chamada ocorre em `try/catch` não bloqueante antes da persistência. Falha de arquivo de log não modifica a ficha, resposta, política, busca ou disponibilidade. Nenhum conteúdo do provider, ID de fonte, URL, título ou tipo declarado é emitido.
- Verificação: teste de sanitização, typecheck e build precisam confirmar o contrato; uma geração manual equivalente deve confirmar a ordem observável dos dois eventos. Risco residual e responsável permanecem os mesmos.
