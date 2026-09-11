# ✅ Concluída — Corrigir pesquisa, aderência e rastreabilidade das fontes da ficha técnica

> Prioridade: P0 — urgente
>
> Área afetada: runtime de IA, pesquisa web, roteamento multipasse, validação, schema, API, logs, interface e documentação técnica
>
> Origem ou referência: investigação solicitada por Lucas em 09/09/2026 sobre a Ranger Raptor 2025; comparação com três execuções OpenRouter do `ex_prompt` e com a última execução do BlindSpot
>
> Arquitetura: `APPROVED — Lucas autorizou a implementação em 09/09/2026`
>
> Triagem automática: `Material — altera IA com ferramenta web, prompt, schema, validação, API, observabilidade e interface`
>
> Segurança: `Aplicável — pesquisa externa, conteúdo não confiável, URLs arbitrárias, redirects, SSRF, logs de provider e risco de confirmação indevida`

## Pedido

Corrigir com urgência o fluxo de pesquisa e validação das fichas técnicas para que o BlindSpot possa consultar e utilizar fontes externas rastreáveis sem bloquear a ficha apenas porque o domínio não consta em uma lista local, mas sem confundir fonte observada ou oficial com evidência correta para o veículo solicitado.

A mudança deve impedir que uma página de outro ano-modelo, mercado, versão ou motorização sustente campos como `confirmado`. A ficha deve continuar sendo entregue quando houver fontes externas, ambíguas ou divergentes, com sinalização clara e rebaixamento proporcional dos campos afetados.

A implementação deve absorver os aprendizados comprovados nas execuções do `ex_prompt`, principalmente o refinamento orientado a pendências, a pesquisa aberta e rastreável, a observação real de `url_citation` e a auditoria por métricas. Não copiar logs brutos, snapshots de LLM, `.env`, credenciais ou artefatos gerados.

## Evidências que motivam a urgência

### Execuções do ex_prompt usadas como baseline

| Veículo | Execução | Cobertura quick → final | Citações únicas | Fontes finais | Resultado relevante |
|---|---|---:|---:|---:|---|
| Ford Ranger Raptor 2025 Brasil | 20/05/2026 21:23:46 BRT, 4 turnos | 36,18% → 71,36% | 7 | 5 | Refinamento ampliou a pesquisa; 1 fonte Ford e 4 externas |
| Volkswagen Tiguan R-Line 2.0 TSI 2026 Brasil | 19/05/2026 21:19:26 BRT, 5 turnos | 23,00% → 55,39% | 9 | 4 | Pesquisa aberta; 1 fonte oficial e 3 externas |
| BYD King GL 1.5 2025 Brasil | 19/05/2026 21:04:16 BRT, 4 turnos | 49,75% → 49,25% | 7 | 6 | Nenhuma fonte oficial; refinamento não melhorou a cobertura bruta |

Os arquivos permanecem somente como evidência local no checkout de origem, em `C:\Users\lucas\Documents\GitHub\ex_prompt\logs\llm-responses\`. Esta task registra apenas métricas derivadas e não deve incorporar o conteúdo bruto dos logs.

### Execução problemática do BlindSpot

A execução de 08/09/2026 23:02 BRT para Ford Ranger Raptor 2025 Brasil:

- encerrou após o primeiro passe com cobertura de 78,89%;
- teve somente três citações e não executou refinamento;
- associou 126 campos confirmados à página Ford intitulada como versão 2024;
- recebeu do OpenRouter conteúdo observado com referência a 2024 e sem referência a 2025;
- tratou URL observada e alcançável como se isso comprovasse aderência ao veículo alvo.

A URL da versão é dinâmica: na verificação de 09/09/2026, manteve título de 2024 e passou a apresentar no corpo a versão 2026. O PDF oficial hospedado em caminho MY2025 continuava acessível e continha especificações técnicas relevantes.

### Conclusões confirmadas

1. `OPENROUTER_ALLOWED_DOMAINS` não deve ser restaurada como requisito padrão. Pesquisa externa é necessária para marcas e mercados sem documentação oficial completa.
2. As fontes finais das três execuções selecionadas foram URLs efetivamente observadas pelo OpenRouter; o problema principal não foi invenção de URL.
3. O refinamento no `ex_prompt` ocorreu porque a cobertura quick ficou abaixo do limite. A diversidade de fontes foi consequência incidental, não uma decisão de qualidade do roteador.
4. O BlindSpot encerrou cedo porque o roteador considera cobertura, pendências e conflitos, mas ignora aderência ao veículo, qualidade da evidência e dependência excessiva de uma fonte.
5. O validador atual verifica domínio, observação e alcançabilidade, mas não compara título/conteúdo com marca, modelo, versão, ano-modelo e mercado.
6. O probe HTTP segue redirects, mas descarta URL final e conteúdo; com pesquisa aberta, isso também cria uma fronteira de SSRF que precisa ser removida ou protegida.
7. O logger classifica execuções OpenRouter com citações como `sem-web-search` porque não reconhece corretamente a estrutura aninhada `url_citation.url`.
8. O `agent-core` do `ex_prompt` é documentação e pacote de repasse. A implementação atual de OpenRouter está em `server/llm.ts` e já foi migrada quase integralmente para `services/api/llm.ts`; não existe um segundo motor superior dentro de `agent-core` a ser copiado.

## Decisão arquitetural

Manter a pesquisa aberta por padrão e separar explicitamente três dimensões que hoje estão misturadas:

1. **Observação/proveniência:** a URL, o título e o conteúdo foram realmente devolvidos pelo provider durante a execução?
2. **Política/classificação:** a fonte pertence à lista local aprovada, é externa rastreável, não rastreável ou não possui política cadastrada?
3. **Aderência/evidência:** a fonte sustenta o veículo, versão, ano-modelo, mercado e os campos que a referenciam?

Uma fonte poderá ser simultaneamente `externa` e `aderente_exata`. Uma fonte oficial poderá ser `na_lista_aprovada` e `divergente`. A primeira poderá confirmar dados; a segunda não poderá confirmar dados do alvo apenas por pertencer à montadora.

A política local continuará informativa e rastreável. Ela não será usada para formar automaticamente uma whitelist do provider nem para rejeitar a ficha inteira.

## Contratos propostos

### Evidência observada pelo provider

Normalizar internamente cada citação para um registro controlado pelo servidor:

```text
ObservedCitationEvidence
  url
  titulo_observado
  trecho_limitado_e_sanitizado
  conteudo_sha256
  provider
  modelo
  passe
  observada_em
```

Regras:

- extrair a estrutura aninhada `annotation.url_citation` do OpenRouter;
- nunca aceitar do modelo avaliações que deveriam ser calculadas pelo servidor;
- não persistir página completa nem copiar resposta bruta para fixtures ou documentação;
- preservar título observado, instante e fingerprint para explicar links dinâmicos que mudem depois da geração;
- limitar e sanitizar qualquer trecho apresentado à pessoa usuária.

### Avaliação de aderência da fonte

Adicionar avaliação calculada pelo servidor em `fontes_utilizadas[]`:

```text
avaliacao_aderencia.status:
  exata
  compativel
  ambigua
  divergente
  nao_verificada

avaliacao_aderencia.criterios:
  marca_modelo
  versao_motorizacao
  ano_modelo
  mercado

avaliacao_aderencia.motivos[]
avaliacao_aderencia.avaliada_em
```

Definições:

- `exata`: sinais positivos suficientes para marca, modelo, versão, ano-modelo e mercado, sem contradição explícita;
- `compativel`: fonte específica para o veículo, sem contradição, mas com uma dimensão contextual implícita;
- `ambigua`: conteúdo insuficiente para concluir aderência ou aplicabilidade temporal;
- `divergente`: existe sinal explícito incompatível, como 2024 ou 2026 para alvo 2025, outro mercado, versão ou motorização;
- `nao_verificada`: não houve evidência observada suficiente ou o formato não pôde ser analisado com segurança.

Campos críticos — identificação, motorização, transmissão/tração, potência, torque, dimensões, capacidades, consumo e segurança — somente poderão permanecer `confirmado` quando houver ao menos uma fonte aderente conforme a política definida para a categoria. Fonte explicitamente divergente nunca poderá sustentar confirmação.

### Relação campo → fonte

Preservar `fonte_ref`, mas auditar cada campo após a resposta do provider:

- campo apoiado por ao menos uma fonte adequada mantém o status produzido, sujeito às demais validações;
- campo apoiado apenas por fonte divergente deve ser convertido para `parcial` ou `nao_encontrado`, com observação padronizada;
- campo apoiado apenas por fonte ambígua ou não verificada não pode ficar `confirmado` quando for crítico;
- conflito real entre duas fontes adequadas permanece `conflitante`; não escolher vencedor silenciosamente;
- a correção de status deve recalcular `resumo_completude` antes da validação final.

## Fluxo de pesquisa e roteamento

```text
Pedido do veículo exato
        ↓
Passe quick com pesquisa web aberta
        ↓
Normalização das url_citation observadas
        ↓
Classificação de política + aderência
        ↓
Auditoria dos fonte_ref e campos críticos
        ↓
Métricas de cobertura comprovada e qualidade
        ↓
Refine direcionado se houver lacuna, ambiguidade ou divergência
        ↓
Reavaliação e escolha do melhor passe
        ↓
Ficha entregue com alertas e proveniência
```

O prompt quick deve orientar a pesquisa nesta ordem, sem restringir a web:

1. veículo, versão, ano-modelo e mercado exatos;
2. site e documentos oficiais da montadora, incluindo fichas, catálogos, manuais, mídia e PDFs;
3. documentos regulatórios ou homologatórios aplicáveis;
4. imprensa automotiva e bases externas específicas para o alvo;
5. outras fontes rastreáveis quando necessárias para completar lacunas.

O refine deve receber, além dos caminhos pendentes:

- fontes divergentes ou ambíguas;
- dimensões de identidade ausentes;
- campos críticos sem sustentação adequada;
- consulta sugerida com marca, modelo, versão, ano, mercado e categoria;
- orientação para procurar documentos oficiais específicos, sem proibir fontes externas.

## Métricas e decisão do roteador

Substituir a decisão baseada apenas em cobertura bruta por métricas que incluam:

- `rawCoverageRate`: cobertura estrutural atual;
- `groundedCoverageRate`: campos sustentados por fonte compatível;
- `criticalGroundedCoverageRate`: campos críticos sustentados;
- `exactSourceCount`: fontes com aderência exata;
- `ambiguousSourceCount` e `divergentSourceCount`;
- `confirmedOnlyByDivergentSourceCount`;
- pendências, não encontradas e conflitos;
- ganho marginal de qualidade e cobertura por passe.

O roteador deve forçar refinamento quando:

- houver campo confirmado apoiado exclusivamente por fonte divergente;
- campos críticos não possuírem evidência adequada;
- nenhuma fonte observada for suficientemente aderente ao alvo;
- o passe quick tiver somente resultados genéricos ou temporalmente incompatíveis.

Não exigir quantidade artificial de fontes. Um PDF oficial exato pode ser melhor que muitas páginas genéricas. Também não exigir fonte oficial para concluir a ficha quando fontes externas exatas e rastreáveis sustentarem os dados.

Se o orçamento de passes terminar, entregar o melhor resultado disponível com rebaixamentos e alertas; nunca retornar erro apenas porque a fonte é externa, ambígua ou divergente.

## Experiência da pessoa usuária

A interface deve apresentar dimensões separadas por fonte:

- política: aprovada, externa, não catalogada ou não rastreável;
- aderência: exata, compatível, ambígua, divergente ou não verificada;
- título observado durante a geração;
- instante da observação;
- aviso de que páginas dinâmicas podem mudar após a geração;
- link HTTPS seguro quando permitido.

A mensagem principal deve explicar que:

- fonte externa não torna automaticamente o dado incorreto;
- fonte oficial não torna automaticamente o dado aplicável ao veículo solicitado;
- cabe ao usuário revisar a proveniência, enquanto o BlindSpot sinaliza riscos e evita confirmações incompatíveis.

Alertas de fonte não devem substituir toda a ficha por uma tela de erro.

## Impacto técnico previsto

### Runtime e pesquisa

- `services/api/llm.ts`: normalização das citações, métricas de qualidade, decisão multipasse e refine orientado à aderência.
- Preferir novos módulos isolados, como `source-evidence.ts` e `source-adherence.ts`, em vez de ampliar indefinidamente `llm.ts`.
- `packages/agent-runtime/assets/base-agent-prompt.txt`: regras de pesquisa aberta, prioridade e aderência.

### Contratos e validação

- `packages/agent-runtime/assets/schema.json`: avaliação de aderência calculada pelo servidor e metadados públicos mínimos de observação.
- `services/api/types.ts` e `apps/web/src/types.ts`: tipos compartilhados equivalentes.
- `services/api/validator.ts`: auditoria não bloqueante, rebaixamento de campos e recálculo de completude.
- `packages/agent-runtime/assets/source-policy.json`: continuar como catálogo de classificação, nunca como bloqueio implícito de pesquisa.

### Observabilidade

- `services/api/logger.ts`: reconhecer `url_citation.url`, corrigir `sem-web-search` e registrar configuração efetiva sanitizada.
- Registrar budgets, tool choice, contexto de busca, modo de domínios aberto/restrito, contagem de resultados e decisões do roteador sem segredos.

### Interface

- `apps/web/src/App.tsx` e `styles.css`: badges independentes de política e aderência, alertas de link dinâmico e revisão de campos rebaixados.

### Documentação e testes

- atualizar `docs/architecture/agent-core/` somente após o runtime canônico;
- ampliar `scripts/verify-source-policy.ts` ou separar verificadores por responsabilidade;
- criar fixtures mínimas e sanitizadas, sem copiar os logs originais.

## Revisão de segurança proporcional

Data: `2026-09-09`

### Escopo e gatilhos

- Mudança: pesquisa web aberta, ingestão de conteúdo externo, classificação de evidência, logs de provider, schema e UI.
- Gatilhos: IA com ferramenta externa, URL arbitrária, API, prompt, schema, auditoria e retenção local de logs.
- Compliance: não há mudança planejada de dados pessoais, autenticação ou finalidade de tratamento; reavaliar se a persistência de evidências passar a conter dados pessoais incidentais.

### Fronteiras e riscos

- Conteúdo da web e respostas do provider são dados não confiáveis.
- URLs retornadas podem apontar ou redirecionar para redes privadas, endpoints locais, arquivos grandes ou conteúdo malicioso.
- Página dinâmica pode mudar depois da geração e invalidar a identidade registrada.
- Prompt injection presente em conteúdo pesquisado não pode alterar instruções, schema, política ou ações do servidor.
- Logs podem conter conteúdo externo extenso, dados incidentais e detalhes de configuração.

### Controles obrigatórios

1. Preferir a evidência já observada nas `url_citation`; não executar fetch arbitrário no servidor por padrão.
2. Se revalidação HTTP for mantida ou adicionada: somente HTTPS, DNS/IP público, bloqueio de loopback/private/link-local/reservado, validação de cada redirect, timeout, limite de bytes, tipos de conteúdo permitidos, sem cookies, auth ou headers sensíveis.
3. Nunca renderizar HTML externo; exibir somente texto sanitizado e limitado.
4. Tratar conteúdo externo como evidência, nunca como instrução.
5. Não registrar tokens, headers, prompt completo, `.env` ou segredo.
6. Manter logs e snapshots fora do Git; fixtures devem ser sintéticas ou minimizadas.
7. Abrir links com proteções adequadas e sem transmitir contexto sensível.
8. Falha de segurança em uma URL deve isolar a fonte e rebaixar seus campos, não bloquear toda a ficha.

### Risco residual e responsável

- Aderência semântica perfeita não pode ser garantida apenas por regras determinísticas; resultados ambíguos devem permanecer revisáveis.
- Conteúdo e URLs externas podem mudar após a geração; título observado, instante e fingerprint reduzem, mas não eliminam, esse risco.
- Lucas é o responsável por aceitar risco residual e autorizar eventual verificação com provider real.

## Plano incremental e reversibilidade

### Etapa 1 — Evidência e observabilidade

- corrigir extração das citações aninhadas;
- criar representação interna de evidência;
- corrigir categoria dos logs;
- registrar configuração não sensível;
- adicionar testes unitários com estruturas OpenRouter mínimas.

### Etapa 2 — Aderência ao veículo

- implementar avaliação server-owned;
- detectar contradições explícitas de ano, mercado, versão e motorização;
- integrar avaliação às fontes sem bloquear externas;
- cobrir página Ford 2024/2026 e PDF MY2025 com fixtures sanitizadas.

### Etapa 3 — Auditoria de campos e roteador

- auditar `fonte_ref` de campos confirmados;
- recalcular cobertura comprovada;
- alterar decisão e score do roteador;
- produzir refine dirigido a fontes/campos problemáticos;
- escolher o melhor passe por qualidade, não apenas quantidade.

### Etapa 4 — Contrato e interface

- atualizar schema e tipos;
- apresentar política e aderência separadamente;
- manter ficha disponível com avisos;
- documentar compatibilidade e eventual impacto em histórico.

### Etapa 5 — Verificação e experimento controlado

- executar toda a bateria offline;
- executar typecheck, build e smoke simulated;
- preparar comparação derivada com Ranger, Tiguan e BYD;
- somente com autorização e ambiente configurado, executar pequena bateria real de 2 a 5 chamadas e registrar métricas agregadas.

Cada etapa deve manter commits e diffs separados quando houver pedido de commit. A reversão deve permitir desligar a nova decisão de roteamento por feature flag temporária, sem restaurar bloqueio por whitelist como comportamento padrão.

## Critérios de aceite

### Pesquisa e fontes

- [x] Pesquisa web permanece aberta quando `OPENROUTER_ALLOWED_DOMAINS` estiver ausente ou vazia.
- [x] Fonte externa observada e rastreável não bloqueia a ficha apenas por estar fora da lista local.
- [x] Todas as fontes finais de provider real correspondem a URLs efetivamente observadas na execução.
- [x] Título, instante e fingerprint mínimos da evidência observada são preservados sem armazenar página completa no contrato público.
- [x] O PDF MY2025 é classificado como aderente quando for retornado pelo provider.

### Aderência e campos

- [x] A página Ford com referência explícita a 2024 ou 2026 é divergente para alvo 2025.
- [x] Nenhum campo crítico permanece `confirmado` quando suas únicas fontes forem divergentes.
- [x] Fonte externa exata pode sustentar campo confirmado.
- [x] Rebaixamentos atualizam observação, `fonte_ref` e resumo de completude de forma consistente.
- [x] Links dinâmicos exibem o título observado na geração e aviso de possível mudança.

### Roteamento

- [x] O cenário problemático da Ranger força refine mesmo quando a cobertura bruta ultrapassa 70%.
- [x] O roteador considera cobertura comprovada, campos críticos e fontes divergentes.
- [x] O refine recebe pendências de qualidade e identidade, não somente caminhos `nao_encontrado`.
- [x] Encerramento por limite entrega a ficha parcial com alertas, sem erro de política de fonte.
- [x] Um refine que reduza qualidade não substitui o melhor passe apenas por diminuir pendências.

### Segurança e observabilidade

- [x] `url_citation.url` e `url_citation.content` são reconhecidos corretamente.
- [x] Execução com citações não é arquivada como `sem-web-search`.
- [x] Configuração efetiva não sensível fica auditável; segredos e `.env` nunca entram no log.
- [x] Não ocorre fetch arbitrário de URL externa por padrão.
- [x] Se existir fetch, testes cobrem IP privado, redirect para IP privado, timeout, limite de bytes e tipo de conteúdo. — Não aplicável: o probe/fetch de fontes foi removido.
- [x] Falha ou URL insegura isola a fonte e preserva a entrega da ficha.

### Verificação

- [x] Testes unitários e de contrato usam fixtures mínimas, sintéticas ou sanitizadas.
- [x] `npm run verify:source-policy` passa ou é substituído por comandos equivalentes documentados.
- [x] `npm run typecheck` passa.
- [x] `npm run build` passa.
- [ ] Smoke de `GET /api/health`, `POST /api/ficha-tecnica` simulated e leitura da última ficha passa.
- [x] Validação real com provider fica separada da aprovação offline e só ocorre com autorização explícita.

## Fora do escopo

- Criar lista universal de sites confiáveis ou declarar confiabilidade absoluta.
- Bloquear pesquisa em toda fonte não catalogada.
- Garantir que uma URL externa permanecerá imutável após a geração.
- Introduzir autenticação, banco, comparação de fichas ou exportação.
- Migrar ou versionar logs e snapshots brutos do `ex_prompt`.
- Trocar modelo/provider ou aumentar indiscriminadamente tokens antes de medir o novo fluxo.
- Instalar scanners, plugins, skills ou serviços externos.

## Dependências e decisões pendentes

- Confirmar durante a implementação se a evidência pública mínima ficará dentro de `fontes_utilizadas[]` ou em metadados separados, preservando compatibilidade e limite de tamanho.
- Definir lista canônica de campos críticos em asset versionado, sem duplicá-la entre prompt e código.
- Definir feature flag temporária para reversibilidade do roteador de qualidade.
- Chamadas reais do OpenRouter dependem de autorização explícita, credencial local e orçamento aceito.

## Double-check da arquitetura

- [x] Runtime canônico confirmado em `packages/agent-runtime/assets/` e `services/api/`.
- [x] As três execuções indicadas foram analisadas por métricas derivadas, sem copiar logs brutos.
- [x] Foi confirmada uma execução anterior em que o PDF MY2025 apareceu nas citações reais do OpenRouter.
- [x] Foi confirmado que a execução atual do BlindSpot encerrou no quick por cobertura numérica.
- [x] Foi confirmado que `ex_prompt/server/llm.ts` e `blindspot/services/api/llm.ts` compartilham a mesma orquestração OpenRouter.
- [x] Estados de fonte externa, ambígua, divergente, URL insegura, limite de passes e link mutável foram cobertos.
- [x] A arquitetura não transforma lista aprovada em bloqueio.
- [x] A arquitetura preserva a entrega da ficha e torna a confirmação mais rigorosa por campo.
- [x] Segurança foi considerada antes da implementação, com preferência por não buscar URLs arbitrárias no servidor.
- [x] Implementação autorizada por Lucas em 09/09/2026; provider real, commit e publicação permanecem não autorizados.

## Resultado do agente

_Preenchido durante a execução. Não apague o pedido, as evidências ou a arquitetura._

### Complemento arquitetural aprovado — proveniência de entrada e pesquisa por capacidade

`APPROVED — Lucas autorizou a implementação direta em 09/09/2026.`

- Os cinco identificadores do pedido (`marca`, `modelo`, `versao`, `ano_modelo`, `mercado`) deixam de ser tratados como evidência web. O servidor os fixa na ficha como `informado_na_entrada`, sem `fonte_ref`, e a interface comunica essa proveniência sem chamá-los de confirmados.
- A pesquisa não recebe regra específica de marca, modelo, ano ou mercado. Um novo plano canônico agrupa apenas capacidades universais derivadas do schema — especificação técnica, configuração visual, experiência/conectividade e serviço/garantia — com tipos de evidência possíveis.
- O refine agrupa lacunas por capacidade e indica o tipo de material a procurar. Catálogo/configurador é uma alternativa para configuração visual, não uma regra para Ford, Ranger ou cores; documentos externos rastreáveis continuam permitidos.
- A cobertura de entrada não infla a cobertura pesquisada. Os testes verificam a identidade server-owned e a seleção neutra de capacidades para mais de um grupo de schema.

#### Double-check do complemento

- A última execução local continha 118/199 campos preenchidos, 53,89% de cobertura comprovada e 75 lacunas depois do refine; `cores_externas` é evidência de uma lacuna, não uma regra de produto.
- A fonte oficial usada pelos identificadores, exceto ano-modelo, foi classificada como ambígua por não comprovar o ano; o rebaixamento atual é explicado pelo auditor, mas mistura proveniência de entrada com evidência de pesquisa.
- As três execuções históricas do `ex_prompt` são baseline de avaliação heterogêneo. Não serão copiadas como logs ou transformadas em condicionais de runtime.

### Complemento arquitetural aprovado — descoberta de presença da marca

`APPROVED — Lucas autorizou a implementação em 09/09/2026.`

- Antes da síntese, OpenRouter executa uma descoberta curta para a marca, mercado e veículo do payload. Ela procura presença digital da marca, página do veículo, ficha ou catálogo, configurador, manual e serviços, sem domínio ou veículo codificado.
- O inventário aceita somente citações observadas. Um host que contenha a marca recebe apenas o rótulo prudente `candidato_oficial_observado`; não há afirmação automática de propriedade nem allowlist dinâmica.
- O inventário, limitado e sem conteúdo de página, é fornecido ao quick/refine como dado não confiável. Fontes externas rastreáveis continuam permitidas.
- Se a descoberta falhar, a geração degrada para o fluxo anterior e registra o estado sanitizado; nunca faz fetch direto de URL.

- Estado anterior: `✅ Concluída — correção de regressão de normalização verificada offline`
- Estado atual: `✅ Concluída — complemento de proveniência de entrada e refine por capacidades verificado offline`
- Implementação do complemento: `research-capability-policy.json` define capacidades neutras por grupo do schema; o prompt e os refines OpenRouter/Claude usam o asset para orientar lacunas por tipo de evidência, sem condicionais por marca, modelo, ano ou mercado.
- Proveniência: o validador fixa os cinco identificadores fornecidos no pedido como `informado_na_entrada` / `entrada_usuario`, proíbe esse status fora desses caminhos e calcula `informadas_na_entrada` e `total_pesquisaveis`.
- Interface: o badge de identidade comunica `Informado no pedido`; a métrica separa cobertura pesquisada dos identificadores já fornecidos.
- Verificação adicional: `verify:research-capabilities`, `verify:source-policy`, `verify:source-evidence`, `verify:normalization`, `verify:technical-sheet-catalog`, `verify:field-policy`, `verify:quality-policy`, `verify:catalog-contract`, `typecheck`, `build` e `git diff --check` passaram. Provider real não foi chamado.
- Arquitetura: `APPROVED — Lucas autorizou a implementação em 09/09/2026`
- Triagem automática: `Material — IA com ferramenta web, prompt, schema, validação, API, logs e UI`
- Segurança: `Aplicável — revisão proporcional registrada nesta task`
- Implementação: criada a política canônica de evidência, normalização server-owned de citações OpenRouter/Claude, avaliação de aderência, auditoria de campos, cobertura comprovada, refine por qualidade, score comparativo, isolamento de URLs, correção do logger e UI com badges separados.
- Arquivos alterados no escopo: `services/api/source-evidence.ts`, `services/api/llm.ts`, `services/api/logger.ts`, `services/api/runtime-assets.ts`, `services/api/prompt-builder.ts`, `services/api/index.ts`, `services/api/types.ts`, `packages/agent-runtime/assets/source-evidence-policy.json`, `schema.json`, `base-agent-prompt.txt`, tipos/UI web, documentação `agent-core`, `scripts/verify-source-evidence.ts` e `package.json`.
- Verificação: `verify:source-policy`, `verify:source-evidence`, `verify:normalization`, `verify:technical-sheet-catalog`, `verify:field-policy`, `verify:quality-policy`, `verify:catalog-contract`, `typecheck`, `build` e `git diff --check` passaram. `GET /api/health` retornou 200. O pipeline simulated completo passou no verificador.
- Verificação não executada: o smoke HTTP autenticado de geração/leitura permanece desmarcado porque o ambiente não possui `DATABASE_URL`, segredo de sessão ou sessão válida; as rotas responderam 401 corretamente. Nenhum bypass foi criado. Provider real não foi chamado, conforme limite de autorização.
- Bloqueios: nenhum para a implementação offline aprovada.
- Próximo passo opcional: com ambiente autenticado e autorização explícita para custo externo, executar bateria real pequena e comparar métricas agregadas de Ranger, Tiguan e BYD.
- Correção posterior (09/09/2026): uma resposta OpenRouter retornou `motorizacao.consumo_valor` como duas medidas no mesmo campo (`6.7 km/l 7.4 km/l`). A rota de geração agora usa o modo `downgrade` da normalização: erro de medida do provider rebaixa somente o campo para `nao_encontrado`/`NF1`, remove valor e referências incompatíveis, registra aviso sanitizado e preserva a ficha. Importações e validações sem esse modo continuam estritas e retornam 422.
- Verificação da correção: regressão adicionada a `scripts/verify-normalization.ts`; `verify:normalization`, `verify:source-evidence`, `verify:source-policy`, `typecheck`, `build`, `git diff --check` e revalidação offline do log que falhou passaram. Não houve nova chamada ao provider.
- Descoberta de marca implementada: OpenRouter agora tenta um passe curto anterior ao quick, com busca explícita de presença digital da marca, página do veículo, ficha/catálogo, configurador, manual e serviços para o payload exato. O inventário contém somente citações observadas, classifica host com nome da marca como `candidato_oficial_observado` e orienta quick/refine sem criar allowlist dinâmica. Falhas degradam para o fluxo anterior.
- Verificação final do complemento: `verify:research-capabilities`, `typecheck`, `verify:source-evidence`, `verify:normalization`, `verify:technical-sheet-catalog`, `verify:field-policy`, `verify:quality-policy`, `verify:catalog-contract`, `build` e `git diff --check` passaram. Não houve chamada real ao provider, commit ou publicação.

### Complemento implementado — roteiro explícito e isolamento público de divergências

`APPROVED — Lucas autorizou a implementação direta em 09/09/2026.`

- A descoberta OpenRouter agora instrui o provider em estágios: presença da marca no mercado, ficha técnica do veículo exato, catálogo/brochura equivalente e depois configurador, manual e serviços. O roteiro é formado a partir do payload, sem marca, veículo, ano ou domínio codificado.
- O quick e o Claude recebem o mesmo roteiro: localizar ficha técnica aderente antes de preencher; usar fontes externas exatas apenas para lacunas; páginas genéricas são pistas, não confirmação anual.
- URL ou título com ano-modelo explicitamente diferente não é encaminhado pelo inventário. Após a extração, fonte ambígua, divergente ou não verificada é removida de `fontes_utilizadas`; referências que restarem sem fonte aderente são limpas e o campo torna-se `nao_encontrado`.
- A rastreabilidade pública passa a representar somente evidência que pode sustentar a ficha. O runtime mantém somente uma observação sanitizada de que fontes não aderentes foram isoladas; não publica a URL divergente.
- Verificação: `verify:source-evidence`, `verify:research-capabilities`, `verify:source-policy`, `verify:normalization`, `verify:technical-sheet-catalog`, `verify:field-policy`, `verify:quality-policy`, `verify:catalog-contract`, `typecheck`, `build` e `git diff --check` passaram. Provider real não foi chamado.

### Complemento implementado — aquisição documental e merge de passes

`APPROVED — Lucas autorizou a implementação direta em 09/09/2026.`

- O OpenRouter agora separa descoberta institucional e aquisição documental. A nova aquisição pesquisa explicitamente ficha técnica, catálogo/brochura, manual/documento técnico e configurador do alvo exato; somente citações `exata`/`compativel` entram no inventário enviado ao quick.
- As variáveis `OPENROUTER_ACQUISITION_*` controlam orçamento próprio e a falha desse passe degrada para o fluxo parcial, sem permitir fonte inelegível.
- Quick/refine e Claude passam a fazer merge por campo e evidência: valor com fonte melhor não é apagado por resposta posterior pior; fontes são unificadas com remapeamento de IDs.
- Após a auditoria, o log recebe contagens sanitizadas de fontes exatas/compatíveis e fontes ambíguas/divergentes/não verificadas isoladas. O roteador mantém esse diagnóstico interno, sem publicar URL inadequada.
- Verificação offline: regressões de aquisição, isolamento, merge e remapeamento foram adicionadas aos verificadores existentes. Provider real permanece não chamado.
