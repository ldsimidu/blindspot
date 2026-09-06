# Baseline Claude - Melhor Resposta (2026-05-16)

## Objetivo
Congelar o estado exato que gerou a melhor cobertura ate agora no fluxo de ficha tecnica com web search, para reproduzir/retornar rapidamente.

## Snapshot de Referencia
- Log principal: `logs/claude-responses/2026-05-16T01-26-36-068Z-ford-ranger-2025.json`
- `executionId`: `claude-mp7nt42r-kwe9a1fb`
- Provider: `claude`
- Modelo configurado: `claude-sonnet-4-5`
- Modelo retornado pela API: `claude-sonnet-4-5-20250929`
- `promptSha256`: `4622e47ea6679b0560cf0dfdbdf4a3c3a6c4081b31fac40d8542c4cdddedad83`
- Duracao: `374.8s`
- Input alvo:
  - `marca=Ford`
  - `modelo=Ranger`
  - `versao=Raptor`
  - `ano_modelo=2025`
  - `mercado=Brasil`

## ENV Congelado (estado que voce informou)
```env
CLAUDE_MAX_TOKENS=12000
CLAUDE_WEB_SEARCH_MAX_USES=2
CLAUDE_MAX_TURNS=2
CLAUDE_REQUIRE_WEB_SEARCH=true
CLAUDE_ENFORCE_REAL_SOURCES=true
CLAUDE_REQUIRE_OBSERVED_SOURCE_MATCH=false
CLAUDE_SOURCE_PROBE_TIMEOUT_MS=8000
CLAUDE_REFINE_ENABLED=true
CLAUDE_COVERAGE_TARGET=0.70
CLAUDE_UNRESOLVED_TARGET=60
CLAUDE_UNRESOLVED_LIST_LIMIT=50

# QUICK: aqui estava a causa raiz (turnos insuficientes)
CLAUDE_QUICK_MAX_TOKENS=10000
CLAUDE_QUICK_WEB_SEARCH_MAX_USES=2
CLAUDE_QUICK_MAX_TURNS=2

CLAUDE_ROUTER_ENABLED=true
CLAUDE_ROUTER_MIN_COVERAGE=0.70
CLAUDE_ROUTER_MAX_UNRESOLVED=60
CLAUDE_ROUTER_MAX_NAO_ENCONTRADAS=60
CLAUDE_ROUTER_MAX_CONFLITANTES=2
CLAUDE_ROUTER_MAX_REFINE_PASSES=1
CLAUDE_ROUTER_MAX_CONFLICT_PASSES=0
CLAUDE_FOLLOWUP_MAX_TEXT_CHARS=2200
CLAUDE_ROUTER_UNRESOLVED_LIST_LIMIT=50

# Optional model override
CLAUDE_MODEL=claude-sonnet-4-5

# Optional tool version/type for web research
CLAUDE_WEB_SEARCH_TOOL_TYPE=web_search_20250305

# Domain control
CLAUDE_ALLOWED_DOMAINS=ford.com.br,fordservicecontent.com,www.guia360ford.com.br
CLAUDE_BLOCKED_DOMAINS=

# If true and Claude fails, use mock-response.json fallback
LLM_FALLBACK_TO_MOCK=false
```

## Comportamento do Pipeline nesta Execucao
- Sequencia de passes: `quick -> quick -> router -> refine -> router`
- Router final:
  - `done=true`
  - `reason=thresholds_atingidos`
  - `coverageRate=0.7035`
  - `unresolvedCount=53`

## Metricas Capturadas
- Tokens totais (somando respostas dos passes):
  - `input_tokens=215404`
  - `output_tokens=28963`
- Web search efetivo:
  - `web_search_requests=6` (2 em cada passe ativo: quick/quick/refine)
- Ocorrencias de limite de busca:
  - `max_uses_exceeded=11`

### Resumo final no `result.resumo_completude`
- `total_variaveis=213`
- `preenchidas=147`
- `nao_encontradas=62`
- `nao_aplicaveis=4`
- `conflitantes=0`

### Resumo de roteamento (interno)
- `total=199`
- `preenchidas=140`
- `naoEncontradas=53`
- `naoAplicaveis=6`
- `conflitantes=0`

Observacao: existe divergencia entre contagem do router e contagem final do `resumo_completude`. Esse baseline registra as duas visoes como referencia.

## Fontes usadas no resultado final
1. `https://www.ford.com.br/picapes/ranger-raptor/`
2. `https://www.ford.com.br/picapes/ranger-raptor/performance/`
3. `https://www.ford.com.br/content/dam/Ford/website-assets/latam/br/nameplate/2025/ranger-raptor/pdf/fbr-ranger-raptor-ficha-tecnica.pdf`
4. `https://www.ford.com.br/picapes/ranger-raptor/capacidade-off-road/`
5. `https://www.ford.com.br/picapes/ranger-raptor/raptor-4wd-at/`

## Queries emitidas durante a execucao
1. Ford Ranger Raptor 2025 Brasil ficha tecnica especificacoes
2. Ford Ranger Raptor 2025 Brasil dimensoes peso capacidade tanque consumo preco
3. Ford Ranger Raptor 2025 Brasil especificacoes
4. Ranger Raptor 2025 ficha tecnica motor potencia torque
5. Ford Ranger Raptor 2025 dimensoes peso capacidade
6. Ranger Raptor 2025 equipamentos tecnologia SYNC
7. Ford Ranger Raptor 2025 preco garantia Brasil
8. Ford Ranger Raptor 2025 Brasil especificacoes tecnicas potencia rpm torque
9. Ranger Raptor 2025 consumo combustivel cidade estrada
10. Ford Ranger Raptor 2025 cores externas disponiveis Brasil
11. Ranger Raptor 2025 farois retrovisores aquecidos eletricos
12. Ford Ranger Raptor 2025 interior bancos aquecimento tomadas USB
13. Ranger Raptor 2025 Brasil airbags quantidade equipamentos seguranca
14. Ford Ranger Raptor 2025 cores disponiveis catalogo Brasil
15. Ranger Raptor bancos aquecidos tomadas USB tipo quantidade
16. Ford Ranger Raptor sensor chuva retrovisores aquecidos eletrocromico
17. Ranger Raptor 2025 FordPass conectividade recursos aplicativo

Observacao: apesar de 17 tentativas de busca aparecerem no log, apenas 6 foram executadas com sucesso; as demais bateram no limite `max_uses_exceeded`.

## Fingerprint de Arquivos (SHA256)
Arquivos de runtime que precisam permanecer iguais para reproducao alta:

- `prompt-assets/base-agent-prompt.txt`  
  `89a9efbb423cee715c2cf8e0e095214f48f8805e7a127adaf244f13b141ea1e3`
- `prompt-assets/schema.json`  
  `d92401952c5c2515db2f69b68d983d1aca05f38492843072c5943ad6417f6043`
- `prompt-assets/mock-response.json`  
  `97e81a940be717c432392dc16e308c2401f853101e4776331d418032f08ee509`
- `server/llm.ts`  
  `81d141c4e093ba3bea409ec449c9027bdeadbdb327125b184b4ac67d86074f1f`
- `server/prompt-builder.ts`  
  `210f7e221b29855d84e5dec5219bd8bdcad6bbc119a3617051c40cdf9e496003`
- `server/validator.ts`  
  `940ceb04bdf54fc00c2a152a3ae491b8d544e31717af4c0a006f148b9063e58f`
- `agent-core/source/base-agent-prompt.txt`  
  `89a9efbb423cee715c2cf8e0e095214f48f8805e7a127adaf244f13b141ea1e3`
- `agent-core/source/schema.json`  
  `d92401952c5c2515db2f69b68d983d1aca05f38492843072c5943ad6417f6043`
- `agent-core/source/mock-response.json`  
  `97e81a940be717c432392dc16e308c2401f853101e4776331d418032f08ee509`

## Como Reproduzir este Baseline
1. Garantir que os hashes acima batem.
2. Aplicar o bloco de `.env` exatamente como nesta pagina.
3. Reiniciar backend para recarregar variaveis de ambiente.
4. Executar o mesmo input de veiculo:
   - Ford Ranger Raptor 2025 Brasil.
5. Validar o novo log em `logs/claude-responses/`.
6. Comparar com este baseline:
   - Cobertura alvo minima do router: `>= 0.70`
   - `nao_encontradas` perto de `<= 60`
   - `conflitantes = 0`

## Condicoes de Volta Rapida
Se regressar cobertura ou voltar erro de schema/API:
1. Reaplicar exatamente este `.env`.
2. Confirmar `CLAUDE_QUICK_MAX_TURNS=2` e `CLAUDE_QUICK_WEB_SEARCH_MAX_USES=2`.
3. Confirmar domínios permitidos:
   - `ford.com.br`
   - `fordservicecontent.com`
   - `www.guia360ford.com.br`
4. Validar que `LLM_FALLBACK_TO_MOCK=false`.
5. Reexecutar e comparar com o log baseline.

## Limites Conhecidos deste Baseline
1. Ainda ha muitas variaveis `nao_encontrado`.
2. O limite de buscas gera `max_uses_exceeded` (11 ocorrencias nesta execucao).
3. Contagem do router e contagem final nao sao identicas (199 vs 213 no total).
4. Resultado bom para custo/estabilidade, mas nao maximiza cobertura absoluta.

## Por que esta tentativa foi superior as anteriores
Esta execucao foi melhor porque combinou, ao mesmo tempo, estabilidade de fluxo e profundidade minima suficiente de busca:

1. `CLAUDE_QUICK_MAX_TURNS=2` removeu o gargalo mais critico observado antes (turno curto demais no quick).
   - Antes, o modelo frequentemente ficava sem tempo para fechar coleta + normalizacao.
   - Aqui, houve tempo para completar melhor o primeiro bloco util.

2. `CLAUDE_QUICK_MAX_TOKENS=10000` + `CLAUDE_MAX_TOKENS=12000` deram espaco para JSON grande sem truncar raciocinio.
   - Isso ajudou a manter qualidade na montagem do payload final.

3. Router com alvo realista (`CLAUDE_ROUTER_MIN_COVERAGE=0.70`) evitou looping excessivo.
   - O sistema parou quando bateu criterio util de cobertura, evitando degradar resposta por over-iteration.

4. `CLAUDE_REFINE_ENABLED=true` com `CLAUDE_ROUTER_MAX_REFINE_PASSES=1` trouxe um passe adicional focado.
   - Melhorou variaveis importantes sem explodir custo de iteracoes.

5. Foco em dominios oficiais (`CLAUDE_ALLOWED_DOMAINS`) melhorou confiabilidade das fontes.
   - Reduziu risco de URL inventada e priorizou evidencias oficiais.

6. Exigencia de pesquisa real (`CLAUDE_REQUIRE_WEB_SEARCH=true`) e de fontes reais (`CLAUDE_ENFORCE_REAL_SOURCES=true`) forcaram coleta concreta.
   - Evitou resposta baseada so em memoria.

7. Limites de unresolved mais amplos (`UNRESOLVED_TARGET=60`) reduziram falhas por overconstraint.
   - Em cenarios anteriores, limites agressivos faziam o fluxo quebrar ou encerrar com erro.

Resumo: o ganho veio do equilibrio entre profundidade suficiente, parada inteligente e restricao de fonte confiavel.

## O que alterar para ficar mais proximo do perfeito
Perfeito aqui significa aumentar cobertura sem perder confiabilidade e sem custo descontrolado.

### P0 (maior impacto imediato)
1. Aumentar capacidade de busca do passe de refinamento sem liberar geral:
   - manter `CLAUDE_WEB_SEARCH_MAX_USES=2` no quick inicial;
   - elevar apenas o budget do refine no codigo para permitir mais 1-2 buscas focadas em lacunas (interior/exterior/multimidia).
   - motivo: neste baseline houve `max_uses_exceeded=11`.

2. Forcar exploração do manual oficial quando houver lacunas de conforto/itens finos:
   - priorizar `fordservicecontent.com` em queries de interior e comandos.
   - motivo: grupos com mais faltas foram `interior_e_conforto` e `exterior`.

3. Corrigir divergencia de contagem `router` vs `resumo_completude`.
   - alinhar uma unica regra de contagem para metrica oficial do produto.
   - motivo: hoje existem duas "verdades" (199 vs 213).

### P1 (ganho incremental com custo controlado)
1. Melhorar prompt de refine para buscas por categoria de lacuna:
   - interior/conforto, exterior, multimidia, seguranca.
2. Aumentar levemente `CLAUDE_FOLLOWUP_MAX_TEXT_CHARS` (ex.: 2200 -> 3200) para reduzir perda de contexto no follow-up.
3. Manter `CLAUDE_REQUIRE_OBSERVED_SOURCE_MATCH=false` ate estabilizar cobertura; depois testar `true` em experimento separado.

### P2 (otimizacao de longo prazo)
1. Implementar cache por URL/conteudo para reduzir tokens repetidos.
2. Criar score de ganho marginal por passe para evitar refine sem retorno.
3. Adicionar auditoria automatica por log (skill `llm-execution-auditor`) como gate de release.

## Meta pratica para considerar estado excelente
1. Cobertura final >= `0.80`.
2. `nao_encontradas <= 35`.
3. `conflitantes = 0`.
4. `max_uses_exceeded` proximo de `0` (idealmente sem ocorrer no refine).
5. Sem erro de schema ou erro de API.

## Recomendacao de Uso
Usar este baseline como referencia de estabilidade/custo. Qualquer tuning novo deve ser comparado contra este documento antes de promover alteracao para "padrao".
