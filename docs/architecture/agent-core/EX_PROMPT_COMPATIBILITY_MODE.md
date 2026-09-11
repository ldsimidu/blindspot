# Modo de pesquisa compatível com o `ex_prompt`

**Architecture Gate: APPROVED — Lucas autorizou a implementação em 2026-09-11.**

## Decisão proposta

Transformar o fluxo padrão de pesquisa OpenRouter do BlindSpot em um **modo de compatibilidade comportamental com o `ex_prompt`**. O objetivo é recuperar a descoberta web aberta, a diversidade de fontes e o refinamento orientado a pendências que elevaram a cobertura das fichas históricas, sem reintroduzir os dois comportamentos inseguros do legado: probe HTTP arbitrário de URL e aceitação de URL não observada pelo provider.

Isto não é uma cópia literal do `ex_prompt`. Cópia literal reproduziria também a confirmação de campos a partir de uma página de ano-modelo incompatível, a classificação de autoridade declarada pelo próprio LLM e uma fronteira de SSRF. O modo proposto é compatível naquilo que gerava cobertura:

- busca web aberta e multi-fonte;
- `quick -> router por cobertura bruta -> refine`;
- refine com os caminhos pendentes, sem obrigar documentação oficial prévia;
- resultado inteiro escolhido pela melhor cobertura, e não por uma barreira de autoridade;
- fontes externas observadas mantidas na ficha.

Ele preserva os limites mínimos que tornam a reversão segura e auditável:

- somente URLs HTTPS efetivamente observadas na execução do provider;
- validação de schema, estados e integridade de `fonte_ref`;
- sem `HEAD`/`GET` server-side para URL devolvida pelo modelo;
- telemetria sanitizada e logs brutos fora do Git;
- fonte explicitamente divergente de ano, mercado, versão ou motorização continua sem poder confirmar campo para o veículo alvo.

Essa última regra é a diferença intencional entre “compatível” e “idêntico”. Fonte externa, ambígua ou ainda não catalogada é válida como evidência rastreável; fonte comprovadamente de outro veículo não é válida para confirmar o alvo.

## Contexto confirmado

1. O checkpoint versionado atual é `42c1d46` (`feat(research): checkpoint evidence-aware search pipeline`).
2. O worktree contém alterações não commitadas relacionadas a pesquisa, documentação e skills. Ele não pode ser transformado em um commit único sem uma revisão de manifesto, pois o repositório pode conter alterações de autoria/escopo distintos.
3. No runtime atual, `services/api/llm.ts` executa descoberta institucional, descoberta/aquisição documental, leitura/fetch opcional, `quick`, auditoria de autoridade, auditoria de aderência e refine/merge.
4. No pós-processamento atual, `retainOnlyTrustedSourceAuthorities` remove fontes externas fora da política/parceiros; em seguida `applySourceEvidenceAssessment` isola fontes cujo status de aderência não esteja em `acceptedAdherenceStatuses`. Essas duas remoções explicam a diferença de cobertura observada em marcas sem âncora de primeira parte.
5. O `ex_prompt` histórico usava OpenRouter com quick/refine e router por cobertura; mantinha fontes por URL observada e acessibilidade, sem política server-owned de autoridade ou aderência por campo. Os casos Tiguan e BYD mostram que o modelo consegue descobrir fonte oficial quando ela aparece organicamente, mas também preenche muitos campos a partir de fontes externas.

## Pessoa operadora e resultado esperado

A equipe BlindSpot gera uma ficha para uma versão e mercado específicos e precisa de uma resposta útil mesmo quando a montadora não é encontrada de imediato. Em vez de terminar com poucas variáveis por não possuir domínio pré-cadastrado, o produto deve:

1. pesquisar a web aberta para o veículo exato;
2. preservar fontes externas observadas e suas referências;
3. preencher o máximo de variáveis que a evidência permitir;
4. mostrar separadamente a política, a aderência e a origem observada de cada fonte;
5. impedir somente a confirmação que tenha contradição explícita com o próprio veículo solicitado.

O resultado não é um selo de confiabilidade absoluta. É uma ficha com cobertura ampla, rastreável e revisável, em que o usuário consegue ver se um dado vem de fonte oficial, parceira, externa, ambígua ou incompatível.

## Fluxo proposto

```text
entrada validada
  -> prompt/schema canônicos
  -> quick OpenRouter com web search aberto
       -> URLs/títulos/trechos observados
  -> validação segura de origem
       -> HTTPS + URL observada + domínio bloqueado quando configurado
  -> classificação não bloqueante
       -> política / aderência / título e instante observados
  -> auditoria apenas de divergência explícita
       -> fonte divergente não confirma campo do alvo
       -> fonte externa, ambígua ou não catalogada permanece
  -> router compatível por cobertura bruta
  -> refine com caminhos não resolvidos
  -> compara respostas inteiras por score legado de cobertura
  -> schema + fonte_ref + persistência normal
```

O modo compatível não executa como requisito os estágios de bootstrap de marca, aquisição documental, leitor de PDF ou `web_fetch`. Esses caminhos continuam disponíveis no código e serão preservados atrás do modo estrito para a segunda arquitetura. A busca aberta ainda pode devolver uma ficha técnica PDF, catálogo ou página oficial; a diferença é que a síntese não depende de o servidor conseguir ler/prevalidar o documento antes de pesquisar os campos.

## Modos explícitos e reversibilidade

Adicionar uma seleção server-owned de estratégia, lida apenas no backend:

| Modo | Objetivo | Autoridade | Aderência | Router | Estágios prévios |
| --- | --- | --- | --- | --- | --- |
| `ex_prompt_compat` | Cobertura rastreável, equivalente comportamental ao legado | Não remove fonte externa observada | Aceita `exata`, `compativel`, `ambigua` e `nao_verificada`; bloqueia apenas `divergente` como suporte de campo | Cobertura bruta e pendências, score legado | Não obrigatórios; desligados para esse percurso |
| `strict_evidence` | Fluxo atual, para a evolução posterior | Mantém barreira de primeira parte/parceiro | Mantém política atual de aceitação | Cobertura fundamentada + campos críticos | Mantém descoberta, aquisição, leitor e fetch controlado |

O default após este incremento será `ex_prompt_compat`, pois esse é o pedido de produto atual. `strict_evidence` permanece implementado e testado; não será removido. A reversão do comportamento é uma variável de ambiente e um restart, não uma migração de banco nem alteração de schema.

O modo efetivo deve entrar na telemetria sanitizada da execução. A UI pode apresentar um badge de “pesquisa ampla” sem expor configuração, prompt, chave ou log bruto.

## Mudanças técnicas por superfície

### Runtime e orquestração

**Arquivos principais:** `services/api/llm.ts`, `services/api/source-evidence.ts`, `services/api/runtime-assets.ts`.

1. Criar `ResearchExecutionMode` e um resolvedor único para `OPENROUTER_RESEARCH_MODE`, com valores fechados e fallback determinístico.
2. Roteirizar o OpenRouter para um caminho compacto de compatibilidade:
   - usar o prompt final canônico;
   - executar `quick` com `openrouter:web_search` aberto;
   - manter o guard de loop Gemini e a finalização sem ferramenta;
   - usar `tool_choice: required` até surgir fonte observada, depois `auto`;
   - se abaixo da meta, executar `refine` com os paths estruturais pendentes;
   - não executar descoberta institucional, document hunter, leitor, parser de PDF ou fetch nesse caminho.
3. Usar o score histórico para comparar **o payload inteiro** quick/refine: cobertura, preenchidas, não encontradas e conflitos. Não usar merge por evidência neste modo, pois ele altera a semântica do resultado do `ex_prompt`.
4. Preservar os budgets rígidos já corrigidos no BlindSpot (`max_uses`, resultados totais e tool calls quando suportado). Equivalência de comportamento não significa remover teto de custo.

### Fontes, aderência e campos

**Arquivos principais:** `services/api/source-evidence.ts`, `services/api/validator.ts`, `packages/agent-runtime/assets/source-evidence-policy.json`.

1. Manter `retainOnlyObservedAndPermittedSources`: fonte final precisa ter sido observada pelo provider e usar HTTPS. Quando não houver allowlist configurada, o domínio externo não é descartado.
2. Não chamar `retainOnlyTrustedSourceAuthorities` em `ex_prompt_compat`. A classificação de política continua calculada e exibida, mas deixa de ser bloqueio.
3. Calcular `avaliacao_aderencia` e `evidencia_busca` exatamente como hoje; não confiar no `tipo` declarado pelo modelo para conferir autoridade.
4. Aplicar uma política compatível de campo:
   - `exata`, `compativel`, `ambigua` e `nao_verificada` podem continuar referenciáveis;
   - `divergente` não pode ser a única fonte de campo preenchido;
   - se houver mistura de fonte adequada e divergente, remover apenas a referência divergente;
   - manter a fonte divergente visível como consultada, com aviso inequívoco, mas sem permitir que ela infle confirmação.
5. Preservar o schema atual, os nomes de variáveis e o contrato de `fonte_ref`. Não criar nova persistência nem abrir endpoint público.

### Prompt e refinamento

**Arquivos principais:** `packages/agent-runtime/assets/base-agent-prompt.txt`, `services/api/prompt-builder.ts` e builders de refine em `services/api/llm.ts`.

O modo compatível adiciona um overlay gerado pelo servidor, em vez de duplicar o prompt canônico. O overlay orienta:

- primeiro buscar página/ficha/catálogo oficial do veículo exato;
- depois usar documentos regulatórios, parceiros e fontes externas rastreáveis para lacunas;
- nunca inventar URL e nunca declarar oficialidade por conta própria;
- citar todas as fontes usadas;
- retornar a ficha inteira novamente no refine;
- pesquisar os caminhos pendentes de forma direta, como no legado.

O prompt não recebe URLs arbitrárias do conteúdo externo como instruções e não permite que texto de busca modifique schema, política ou limites.

### Observabilidade, interface e documentação

**Arquivos principais:** `services/api/logger.ts`, `services/api/types.ts`, `apps/web/src/App.tsx`, `apps/web/src/types.ts`, `docs/operations/technical-sheet-research-evolution.md`.

Adicionar apenas dados derivados e sanitizados:

- modo efetivo;
- quick/refine executados, motivo do router e melhoria marginal;
- fontes observadas, mantidas, externas, ambíguas e divergentes;
- campos rebaixados exclusivamente por divergência explícita;
- cobertura bruta e cobertura fundamentada, sem tratá-las como a mesma métrica.

A interface mantém os badges já existentes de política e aderência. No modo compatível, uma fonte externa deve aparecer como externa rastreável, não como oficial. A cobertura exibida deve informar o modo de pesquisa para que uma execução ampla não seja comparada indevidamente a uma execução estrita.

## Plano de commits e rollback

### Commit 0 — checkpoint do trabalho atual

Antes de qualquer comportamento novo:

1. executar `git status`, `git diff --name-status` e `git diff --check`;
2. construir um manifesto de arquivos do escopo de pesquisa atual;
3. revisar esse manifesto contra as mudanças preexistentes; arquivo sem vínculo demonstrável com pesquisa, documentação aprovada ou skill criada para ela fica fora;
4. executar os verificadores offline existentes, `npm run typecheck` e `npm run build`;
5. criar um commit de checkpoint somente com o manifesto aprovado.

O commit não incluirá `.env`, logs, snapshots, credenciais, `node_modules` ou artefatos gerados. Nenhum `reset --hard`, `checkout --` ou limpeza de worktree é autorizado. O commit `42c1d46` continua intacto como referência anterior.

### Commit 1 — modo compatível

Após os testes unitários e de contrato da nova estratégia, criar um único commit funcional, por exemplo:

```text
feat(research): add ex-prompt-compatible broad search mode
```

Ele contém somente runtime, assets, tipos, testes/verificadores, UI/telemetria e documentação diretamente necessários. Esse hash é o marco seguro para o próximo ciclo arquitetural.

### Rollback posterior

Quando a segunda arquitetura for implementada em commits posteriores, há dois caminhos recuperáveis:

1. **Voltar ao modo de alta cobertura:** configurar `OPENROUTER_RESEARCH_MODE=ex_prompt_compat` e reiniciar o serviço; não há migração para desfazer.
2. **Reverter código posterior:** usar `git revert` apenas dos commits posteriores ao marco compatível, em ordem reversa, preservando o histórico. Nunca usar reset destrutivo em um worktree compartilhado.

Assim, o usuário pode experimentar a evolução futura e voltar ao comportamento que encontra mais fontes sem tentar recuperar arquivos históricos do `ex_prompt` nem restaurar seu código inseguro.

## Revisão de segurança proporcional

### Escopo e gatilhos

- **Mudança:** IA com ferramenta web, comportamento de provider, prompt, auditoria de fonte, logs e interface.
- **Dados/integracões:** identificadores públicos do veículo, resultados web não confiáveis e credenciais já existentes do provider; nenhuma nova credencial, dependência, endpoint ou banco.
- **Responsável pelo risco residual:** Lucas.

### Fronteiras e controles obrigatórios

| Risco | Controle proposto | Critério de aceite |
| --- | --- | --- |
| URL inventada pelo modelo | Aceitar apenas citação observada do provider | Fixture com URL declarada e não observada a remove. |
| SSRF/redirecionamento | Não importar o probe HTTP legado; modo compatível não faz fetch server-side | Nenhuma chamada `fetch` para URL de fonte no caminho compatível. |
| Fonte externa parecer oficial | Classificação server-owned, badge separado e sem confiar em `tipo` do LLM | Fonte externa não recebe selo oficial. |
| Página de outro ano/versão sustentar dado | Aderência continua calculada; divergência explícita rebaixa apenas o campo afetado | Fixture de ano incompatível não permanece como única `fonte_ref` confirmada. |
| Conteúdo web injetar instruções | Conteúdo é evidência; prompt/schema/limites são server-owned | Teste de conteúdo com instrução não altera parâmetros ou saída estrutural. |
| Vazamento em logs | Telemetria agregada; sem prompt, chave, headers, texto integral ou snapshot no Git | Verificador de sanitização continua passando. |
| Regressão de custo | Budgets do provider continuam explícitos e o router limita passes | Testes conferem o request de ferramenta e máximo de passes. |

### Risco residual

Uma fonte ambígua ou externa pode sustentar um campo no modo compatível. Isso é uma decisão de produto consciente para elevar cobertura, não uma prova de verdade. A interface e as métricas tornam essa condição visível. Evidência semântica perfeita continua exigindo a segunda arquitetura de aquisição e prova por campo.

## Verificação incremental

### Offline obrigatória

1. Fixture BYD: seis fontes externas observadas permanecem; pelo menos uma pode preencher campo sem entrar em política pré-cadastrada.
2. Fixture Tiguan: página oficial observada e fontes externas coexistem; a página oficial não é exigida para a ficha existir.
3. Fixture de URL inventada/não observada: fonte e referências são removidas.
4. Fixture de ano explicitamente divergente: a fonte continua exibível como consultada, mas não sustenta sozinha campo confirmado.
5. Fixture quick/refine: resultado de cobertura maior vence; resultado de refine inferior não substitui quick.
6. Fixture de loop Gemini: após turnos somente de ferramenta, o runtime pede finalização JSON sem ferramenta.
7. Regressões atuais de schema, normalização, catálogo, facetas e sanitização continuam verdes.
8. `npm run typecheck`, `npm run build` e `git diff --check` passam.
9. Smoke no modo simulated para health, geração e leitura da última ficha, no ambiente autenticado quando disponível.

### Validação real posterior, somente com autorização separada

Executar no máximo três fichas equivalentes (Ranger, Tiguan e BYD), uma por vez, com provider e orçamento já aprovados. Registrar no ledger somente métricas agregadas:

- cobertura bruta/fundamentada;
- fontes observadas/mantidas/divergentes;
- passes, buscas, tokens e duração;
- motivo de parada;
- grupos que melhoraram ou regrediram.

O sucesso inicial é cobertura maior que o baseline estrito sem URL inventada, sem fetch arbitrário e sem confirmação sustentada apenas por fonte explicitamente divergente. Não há promessa de reproduzir percentuais históricos exatamente: modelo, índice web e provider são variáveis externas.

## Fora do escopo deste incremento

- copiar código, prompts, logs ou snapshots brutos do `ex_prompt`;
- remover validação de schema, `fonte_ref`, HTTPS ou observação real;
- restaurar `HEAD`/`GET` irrestrito de fonte;
- trocar modelo/provider, aumentar custos sem experimento ou contratar serviço novo;
- mudar banco, autenticação, exportação ou API pública;
- criar uma lista global de marcas confiáveis;
- implementar a arquitetura de aquisição documental, fetch controlado, prova textual por campo ou ranking de autoridade avançado. Esses itens pertencem à segunda arquitetura solicitada.

## Double-check da arquitetura

- [x] O runtime canônico foi confirmado em `services/api/` e `packages/agent-runtime/assets/`; documentos não foram tratados como runtime.
- [x] O checkpoint `42c1d46` e o worktree pendente foram verificados antes de propor commits.
- [x] As fontes de baixa cobertura foram rastreadas até as remoções de autoridade e aderência do runtime atual, não atribuídas apenas ao modelo.
- [x] O fluxo legado foi conferido em `ex_prompt/server/llm.ts`, `validator.ts`, `logger.ts` e seus dois logs correlatos, sem copiar conteúdo bruto.
- [x] Estados de URL não observada, fonte externa, fonte ambígua, fonte divergente, refine pior, limite de turnos e falha de provider foram previstos.
- [x] A proposta mantém limites de busca e elimina o probe HTTP arbitrário, portanto não amplia a fronteira de rede do BlindSpot.
- [x] A reversibilidade não depende de apagar dados, resetar Git ou restaurar código externo.
- [x] Nenhuma chamada real de provider, commit ou mudança de runtime foi realizada durante esta arquitetura.

## Aprovação requerida

Após `APPROVED` ou “pode seguir”, ficam autorizados somente: o checkpoint por manifesto revisado, o modo `ex_prompt_compat`, seus testes/verificadores, telemetria/UI mínima e os commits descritos.

Não ficam autorizados: chamadas reais ao OpenRouter, mudança de provider/modelo, cópia de segredos/logs do `ex_prompt`, fetch arbitrário, migração de banco ou a segunda arquitetura de pesquisa avançada.
