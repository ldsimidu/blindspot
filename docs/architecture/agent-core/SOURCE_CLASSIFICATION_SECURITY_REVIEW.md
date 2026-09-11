# Revisão de segurança — classificação de fontes sem bloqueio

Data: `2026-09-08`

## Escopo e gatilhos

- Mudança: substituir a rejeição de host/tipo fora da lista local por classificação server-side por fonte, persistida com a ficha e exibida à pessoa analista.
- Gatilhos: API pública autenticada, resposta de IA com busca web, contrato/schema, persistência de JSON e links externos na interface.
- Não aplicável: não há dependência nova, provider novo, chamada adicional de rede, alteração de autenticação ou mudança de infraestrutura.

## Fronteiras e riscos

- Dados, segredos e integrações envolvidos: entrada de veículo e resposta de LLM são não confiáveis; a política local e o cálculo server-side são confiáveis. Logs, snapshots brutos, tokens e `.env` não são expostos nem incluídos nesta alteração.
- Cenário de abuso ou falha principal: o modelo declara uma fonte como oficial, devolve um host não listado ou inclui uma URL insegura para induzir a pessoa usuária a confiar ou abrir o link.
- Controles e critérios de aceite: o servidor remove qualquer `avaliacao_politica` vinda do modelo e a recalcula; o estado usa enum do schema e versão da política; links só são clicáveis com HTTPS; uma fonte fora da lista recebe sinalização, não selo de aprovação; identidade, schema e `fonte_ref` continuam bloqueantes.

## Verificação planejada ou executada

- `npm run verify:source-policy`: passou. Cobre fonte local simulada, host oficial fora da lista, tipo não classificado em provider remoto e URL HTTP classificada como não rastreável.
- `npm run typecheck`: passou.
- `npm run build`: passou em ambiente local fora do sandbox; o sandbox bloqueia a leitura de diretórios ancestrais exigida pelo Vite.
- Provider real: não executado; não é necessário para validar a classificação determinística e não houve autorização para chamada externa.

## Achados, exceções e risco residual

- Achado corrigido: host/tipo fora da allowlist interrompia uma ficha estruturalmente válida; agora é uma classificação visível ao analista.
- Risco residual: uma URL HTTPS rastreável pode apontar para conteúdo incorreto ou mudar após a coleta. A classificação não é verificação factual nem selo de confiabilidade; a pessoa usuária mantém a decisão de uso.
- Responsável por aceitar o risco residual: Lucas.

## Bloqueios e próximo passo

- Sem bloqueio local. O smoke com provider real permanece fora do escopo até existir autorização e ambiente configurado.
