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
