# Analise profunda: `ex_prompt` e a lacuna de pesquisa do BlindSpot

**Data:** 2026-09-11  
**Escopo:** leitura estatica integral das superficies relevantes de `C:\Users\lucas\Documents\GitHub\ex_prompt`, mais auditoria agregada de duas execucoes historicas fornecidas. Nenhuma chamada a provider, nenhuma alteracao no `ex_prompt` e nenhuma alteracao de runtime do BlindSpot foi feita nesta analise.

**Limite verificavel:** o historico Git do `ex_prompt` nao foi consultado porque a instalacao em que a auditoria ocorreu marcou aquele checkout como de outro proprietario; liberar isso exigiria alterar a confianca global do Git. Essa alteracao nao era necessaria para explicar o runtime e nao foi feita.

## Resposta curta

O `ex_prompt` nao encontra mais dados por possuir uma tecnica melhor de verificacao de fontes. Ele encontra mais dados porque foi desenhado para maximizar **cobertura declarada**: permite fontes externas variadas, aceita o rotulo de tipo de fonte que o proprio modelo devolve, escolhe a melhor tentativa por preenchimento e valida uma URL por observacao no retorno do provider e por acessibilidade HTTP. Isso e suficiente para o modelo produzir fichas mais cheias, inclusive encontrar ocasionalmente uma pagina oficial, mas nao prova que cada valor venha daquela pagina, nem que a pagina seja aderente a versao, ano e mercado.

O BlindSpot atual esta no extremo oposto: captura e qualifica a evidencia observada, avalia aderencia ao veiculo e rebaixa campos sem fonte aderente. Essa direcao e correta para um produto confiavel, mas a aquisicao de fontes de primeira parte ainda nao esta conseguindo alimentar esse gateway para marcas fora da politica configurada. O resultado e cobertura muito baixa. A resposta nao e voltar ao validador legado; e separar **descoberta ampla** de **publicacao confirmada**, medindo ambas.

## Pergunta que esta analise responde

Por que duas fichas legadas, executadas com Gemini 2.5 Flash via OpenRouter em maio, apresentam entre 49,3% e 55,4% de preenchimento e uma delas traz fonte oficial, enquanto as execucoes recentes do BlindSpot chegam a poucas dezenas de variaveis e fontes pouco confiaveis?

O diagnostico abaixo usa codigo e registros locais como fontes primarias. Os snapshots e logs brutos nao sao reproduzidos neste documento; sao apresentados somente contagens, categorias e conclusoes verificaveis.

## 1. Mapa completo do `ex_prompt`

### 1.1 Estrutura e papel de cada area

| Area | Papel real | Participa do runtime? | Observacao |
| --- | --- | --- | --- |
| `prompt-assets/` | Prompt base, schema e resposta simulada | Sim | E a fonte canonica do runtime legado. |
| `server/` | API Express, composicao de prompt, providers, validacao e logs | Sim | Contem todo o pipeline de geracao. |
| `src/` | Dashboard React/Vite | Sim | Formulario, ultima ficha, historico e exibicao de fontes. |
| `data/llm-responses/` | Snapshots ja validados | Sim para `latest` e historico | Persistencia baseada em arquivos, sem banco. |
| `logs/llm-responses/` | Registro de execucao, turnos e erro | Nao para gerar | E a melhor evidencia do comportamento historico. |
| `agent-core/` | Espelho, documentacao e pacotes de repasse | Nao | Explica o contrato, mas pode divergir do runtime. |
| `docs/` | Baselines e notas de integracao | Nao | Registro historico, nao configuracao ativa. |
| `.codex/skills/` | Auditoria e governanca locais | Nao | Ajuda a investigar, nao e chamada pelo servidor. |
| `dist/`, `node_modules/` | Artefatos de build e dependencias | Nao como fonte | Nao foram tratados como fonte de logica. |

Essa separacao importa: alterar uma copia em `agent-core/` nao teria mudado o comportamento das fichas de maio. O proprio `AGENTS.md`, `agent-core/README.md` e `agent-core/SYNC.md` registram que o servidor le somente `prompt-assets/`.

### 1.2 Superficies de produto

O app oferece quatro capacidades principais:

1. **Gerar ficha:** recebe marca, modelo, versao, ano-modelo e mercado; aceita corpo plano ou aninhado em `vehicle`.
2. **Consultar ultima ficha:** le o snapshot mais recente em disco e o revalida com o schema atual.
3. **Consultar historico:** lista execucoes recentes a partir dos logs, tentando revalidar cada resultado antes de exibi-lo.
4. **Visualizar rastreabilidade:** mostra fontes, cobertura e estados dos campos; a tela inicial mostra a ultima ficha e a tela de historico permite abrir outra resposta.

Nao ha crawler proprio, banco de documentos, cache de paginas, catalogo de marcas, governanca de fontes por fabricante ou verificacao semantica por campo. A pesquisa web e delegada inteiramente a ferramenta server-side do provider.

## 2. Fluxo de ponta a ponta no legado

```text
Formulario React
  -> POST /api/ficha-tecnica
  -> valida entrada do veiculo
  -> le prompt-assets/base-agent-prompt.txt + schema.json
  -> monta prompt completo
  -> OpenRouter/Claude + ferramenta web do provider
       -> quick
       -> router por cobertura
       -> refine opcional / resolver conflito opcional
  -> valida fontes declaradas (opcionalmente vistas no retorno + probe HTTP)
  -> normaliza estados e recalcula completude
  -> AJV + consistencia de fonte_ref
  -> salva snapshot e retorna JSON
```

### 2.1 Entrada e composicao

`server/index.ts` exige os cinco campos do veiculo e limita o JSON HTTP a 1 MB. Depois le, a cada requisicao, o prompt base e o schema de `prompt-assets/`. `server/prompt-builder.ts` compoe cinco blocos, nesta ordem:

1. instrucao do agente;
2. schema JSON inteiro;
3. payload do veiculo;
4. lista de caminhos-alvo derivada dos campos obrigatorios de primeiro nivel dos grupos da ficha;
5. regras finais de execucao.

O efeito pratico e uma forte pressao para preencher a ficha inteira. O modelo recebe tanto a estrutura detalhada quanto uma lista explicita dos grupos/campos requeridos. Em contrapartida, essa lista nao cria uma estrategia de busca por capacidade: ela apenas informa tudo o que esta pendente.

### 2.2 Prompt base

O prompt base posiciona o modelo como pesquisador automotivo, ordena busca web, pede o veiculo exato e define prioridades declaradas: montadora, ficha/catalogo, manual, configurador, servico, reguladores e imprensa automotiva. Tambem exige status por campo e `fonte_ref` para os valores preenchidos.

Ha duas limitacoes importantes:

- A hierarquia de fontes e uma **instrucao**, nao uma regra servidora que determine quem pode confirmar um campo.
- O campo `fontes_utilizadas[].tipo` no schema e apenas `string` nao vazia. Portanto, o modelo pode devolver um rotulo como “imprensa reconhecida” sem passar por enumeracao, score ou classificacao independente.

### 2.3 Execucao OpenRouter/Gemini

Para OpenRouter, `server/llm.ts` implementa:

- um passe `quick` com orcamento proprio;
- um router que calcula cobertura, pendencias, nao-encontradas e conflitos;
- ate os passes de refinamento/conflito configurados;
- selecao da melhor resposta por um score de cobertura e contagem de pendencias;
- `temperature: 0`, formato JSON opcional e ferramenta `openrouter:web_search`;
- uso forcado da ferramenta somente enquanto nenhuma URL tiver sido observada no retorno estruturado;
- guarda especifica para Gemini quando ele entra em sequencia de turnos apenas de ferramenta.

O refinamento recebe a resposta/prompt anterior e uma lista, truncada por configuracao, de caminhos ainda pendentes. Ele pede ao modelo para preservar o que ja confirmou e pesquisar as lacunas. Isto explica o comportamento de duas etapas visto nos dois logs analisados.

Ha uma sutileza relevante de custo e comportamento: o legado limita resultados totais da ferramenta, mas nao envia um limite explicito de usos/chamadas equivalente ao que o fluxo atual do BlindSpot passou a controlar. Assim, o limite efetivo depende mais do provider e dos turnos do que de uma cota uniforme do aplicativo.

### 2.4 Validacao depois do modelo

O legado aplica quatro camadas diferentes, que nao devem ser confundidas com verificacao de evidencia:

| Camada | O que comprova | O que nao comprova |
| --- | --- | --- |
| Parse/JSON | A saida e parseavel | Que o conteudo e verdadeiro. |
| Normalizacao | Estados seguem a forma do schema | Que o status escolhido e adequado. |
| AJV | Estrutura, tipos e combinacoes permitidas | Que a fonte sustenta o valor. |
| `fonte_ref` | O ID citado existe em `fontes_utilizadas` | Que a pagina foi lida ou diz aquilo. |
| Fonte “real” | URL valida, politica de dominio opcional, URL observada opcionalmente e pagina alcancavel | Aderencia a versao/ano/mercado e evidencia textual por campo. |

`enforceAuthenticSources` percorre as fontes devolvidas, opcionalmente exige que a URL apareca em algum bloco estruturado da resposta do provider e faz `HEAD`, depois `GET` se necessario. Considera acessivel inclusive resposta 401, 403 ou 429. Isso e um teste de existencia/acesso, nao de conteudo. A funcao aceita `http` ou `https`, segue redirecionamentos e nao aplica a defesa de destino de rede que seria necessaria em um fetch generico dirigido por modelo. Esse componente **nao deve ser migrado** para o BlindSpot.

### 2.5 Persistencia e observabilidade

Cada execucao recebe `x-request-id`, gera log HTTP e, para LLM, grava:

- snapshot validado em `data/llm-responses/<provider>/<model>/`;
- log detalhado em `logs/llm-responses/<provider>/<model>/<categoria>/`;
- hash do prompt, preview, turnos, resultado ou erro.

Isso e muito valioso para auditoria retrospectiva, mas possui duas fragilidades: os dados sensiveis e respostas cruas residem em arquivo local, e a classificacao `sem-web-search` pode estar errada para OpenRouter. O contador historico procura uma forma especifica de citacao (`url_citation` com URL no mesmo nivel), enquanto os registros analisados contêm URLs em estrutura aninhada. Logo, “sem web search” naquela pasta nao e prova de que nenhuma busca aconteceu.

## 3. Auditoria dos dois casos que motivaram a investigacao

### 3.1 Resultado agregado

| Caso | Fontes finais | Preenchidas | Total | Cobertura | Nao encontradas | Nao aplicaveis | Conflitos |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Volkswagen Tiguan R-Line 2.0 TSI 2026 | 4 | 113 | 204 | 55,4% | 86 | 5 | 0 |
| BYD King GL 1.5 2025 | 6 | 98 | 199 | 49,3% | 78 | 23 | 0 |

Portanto, a ficha Volkswagen e efetivamente melhor em cobertura; a BYD e muito melhor que as execucoes recentes do BlindSpot, mas ainda deixa 78 variaveis sem resposta. Nenhuma delas atinge uma ficha tecnicamente completa.

### 3.2 Volkswagen: por que encontrou fonte oficial

O resultado final trouxe uma fonte classificada como oficial, duas de imprensa e uma parceira. A fonte oficial recebeu 63 referencias de campo, mais da metade das 113 referencias preenchidas. Isso prova duas coisas limitadas, mas importantes:

1. A descoberta organica do web search do OpenRouter conseguiu apresentar ao modelo uma pagina da montadora brasileira para esse veiculo.
2. O modelo aproveitou essa fonte em larga escala no JSON final.

Nao prova que as 63 afirmacoes foram extraidas ou verificadas contra o texto da pagina. O servidor apenas confirmou que a URL declarada apareceu em algum bloco estruturado do provider e que a pagina era alcancavel.

O log detalhado mostra um `quick`, um router e dois turnos de `refine`. A cobertura antes do refine era 23,0%; depois ficou em 55,4%. O primeiro turno de refine teve saida extremamente curta e o segundo apresentou a resposta completa. O router encerrou porque o limite de passes foi atingido, nao porque a meta de cobertura foi satisfeita.

As lacunas permaneceram concentradas em exterior (21), interior/conforto (15), multimidia/conectividade (11), seguranca (9), tecnologia dinamica (8), conectividade por aplicativo (8) e comercial/garantia (6). Isso mostra que a pagina oficial encontrou o veiculo, mas nao substituiu uma ficha tecnica formal, catalogo ou configurador completo.

### 3.3 BYD: por que preencheu muito sem fonte oficial

As seis fontes finais foram declaradas como imprensa automotiva; nao houve fonte classificada como oficial. A referencia F3, de uma ficha externa, sustentou 83 campos; as demais fontes dividiram o restante. A diversidade de URLs nao equivale a independencia de evidencia: uma unica fonte externa concentrando a maior parte dos campos cria risco de propagacao de erro.

O primeiro passe ja produziu aproximadamente 49,8% de cobertura; o refine terminou com 49,3%, mas reduziu a lista de pendencias pela mudanca entre `nao_encontrado` e `nao_aplicavel`. O router reteve o resultado final pelo seu score, nao por uma medida de confiabilidade. Havia um `quick`, um router e um `refine`; tambem aqui a parada foi por limite de passes.

O caso BYD demonstra a vantagem que hoje falta ao BlindSpot: a capacidade de usar resultados externos para cobrir motor, dimensoes, seguranca e equipamentos quando a fonte oficial nao aparece. Tambem demonstra por que esta capacidade nao pode, sozinha, alimentar campos “confirmados” de produto: ela nao distingue uma ficha original de uma pagina que republica ou infere dados.

### 3.4 Evidencia de busca: a classificacao historica esta enganosa

Os dois logs detalhados estao sob `sem-web-search`, mas a extracao recursiva de URLs do proprio retorno mostra que as URLs finais aparecem nos turnos da execucao: quatro de quatro no Tiguan e seis de seis no BYD. O problema esta no contador usado pelo logger legado, nao necessariamente na ausencia de ferramenta web. Essa classificacao nao deve ser usada como metrica de custo, efetividade ou regressao.

## 4. Diferenca real para o BlindSpot atual

| Dimensao | `ex_prompt` historico | BlindSpot atual | Consequencia |
| --- | --- | --- | --- |
| Objetivo do router | Cobertura e pendencias | Evidencia, aderencia e governanca alem da cobertura | O legado parece melhor mesmo quando sua evidencia e fraca. |
| Classificacao de fonte | Texto livre devolvido pelo LLM | Politica e avaliacao independente | BlindSpot evita que o LLM se autoatribua autoridade. |
| Aderencia ao veiculo | Nao avaliada | Marca/modelo, versao/motorizacao, ano e mercado avaliados | BlindSpot impede mistura de variantes; pode rebaixar mais campos. |
| Fonte observada | Opcional e baseada na estrutura do retorno | Coleta de evidencia observada e metadados sanitizados | O BlindSpot tem base para provar proveniencia. |
| Conteudo de pagina | Nao lido pelo validador | `web fetch` restrito permite evidencia de conteudo quando elegivel | BlindSpot pode evoluir para fundamentacao real. |
| Documento oficial | Sem etapa dedicada | Politica de documentos, descoberta e leitor controlado | O caminho e mais seguro, mas hoje depende de ancoragem de marca. |
| Descoberta externa | Aberta por padrao | Atualmente nao se converte de modo confiavel em ancora de primeira parte fora da politica | Explica cobertura muito baixa nas marcas recentes. |
| Seguranca do probe | Fetch de URL modelada, redirecionamentos e protocolos amplos | Politica/restricao de fetch planejada no runtime | Copiar o probe legado criaria risco desnecessario. |
| Telemetria | Log bruto rico, categoria imprecisa | Log sanitizado, mas ainda sem explicar integralmente o bootstrap | Cada um resolve metade do problema observacional. |

O registro de evolucao do BlindSpot confirma duas execucoes recentes com 10/195 e 26/194 variaveis. Nessas amostras, a descoberta viu candidatos de marca, mas a descoberta documental/leitor/fetch nao foi executada por inexistirem dominios oficiais configurados; fontes acabaram isoladas por aderencia. Isso nao e a mesma situacao que “o Gemini esqueceu como pesquisar”. E uma falha de transicao entre descoberta e evidencia publicavel.

## 5. O que vale recuperar do legado

### Recuperar, adaptando

1. **Pesquisa em duas fases, com refine orientado a lacunas.** O ganho do Tiguan ocorreu no refine. No BlindSpot, o refine deve receber uma pequena cesta de capacidades (por exemplo: dimensoes, seguranca, conectividade), nao dezenas de caminhos soltos.
2. **Descoberta multifuente ampla.** Fontes externas podem gerar candidatos, termos, nomes de versao, documentos e pistas de URL oficial. Elas devem ser classificadas como descoberta, nao confirmacao automatica.
3. **Comparacao de passes.** Preservar a melhor tentativa pode ser util, desde que o score seja multiobjetivo: cobertura fundamentada, campos criticos, autoridade, aderencia e custo; nunca cobertura bruta isolada.
4. **Registro de experimentos.** A combinacao de snapshot, log de turnos, contagem por grupo e decisao do router torna possivel comparar mudancas. O BlindSpot deve manter essa riqueza em forma sanitizada e correlacionavel por request ID.
5. **Guarda para loop de ferramenta.** O mecanismo que transforma repetidos turnos somente de ferramenta em um pedido explicito de JSON final resolve um problema real de Gemini e pode ser aproveitado se ainda nao existir equivalente no runtime atual.

### Nao recuperar

1. **Probe HTTP generico de URL escolhida pelo modelo.** Ele nao verifica alegacao, pode seguir redirecionamentos para destinos indevidos e aceita respostas de bloqueio como “fonte valida”.
2. **`tipo` de fonte livre.** Autoridade deve ser classificada no servidor a partir de politica e host, com rastreabilidade da decisao.
3. **Cobertura bruta como criterio de vitoria.** Isso incentiva preencher mais campos a partir de uma pagina secundaria ou de variante errada.
4. **Confirmacao somente por `fonte_ref`.** O ID resolve a integridade interna do JSON, nao a fundamentacao do dado.
5. **Categoria `sem-web-search` como metrica.** Ela precisa ser corrigida/abandonada, pois falhou nos dois registros analisados.

## 6. Arquitetura recomendada: descoberta ampla, publicacao estrita

O desenho abaixo preserva a ambicao de cobertura do `ex_prompt` sem sacrificar a garantia que o BlindSpot ja comecou a construir.

```text
1. Planejador por capacidades pendentes
   -> define 2-4 temas de maior ganho (ex.: ficha, dimensoes, seguranca, cores)

2. Descoberta ampla via web search
   -> fontes oficiais, parceiros e imprensa permitida como candidatos
   -> coleta URL, titulo, trecho, data e caminho de descoberta

3. Classificador servidor
   -> identifica host oficial/provavel/parceiro/externo
   -> avalia marca, veiculo, versao, ano e mercado
   -> cria fila somente de URLs elegiveis para fetch/documento

4. Aquisição controlada
   -> web fetch somente HTTPS, allowlist de destinos, tamanho/tempo/tipo limitados
   -> leitor de PDF/catalogo quando elegivel e legivel

5. Extracao pelo LLM com pacote de evidencia
   -> cada campo deve apontar para evidencia observada e seu nivel

6. Gateway de publicacao
   -> oficial aderente: pode confirmar
   -> parceiro/external aderente: pode preencher como evidencia secundaria ou sugestao, conforme politica
   -> ambiguo/divergente: nao confirma; vai para pendencia/aviso

7. Router multiobjetivo e ledger
   -> escolhe por cobertura fundamentada, campos criticos, autoridade, aderencia e custo
   -> grava metricas por passe e por grupo
```

O ponto decisivo e o passo 3: o sistema nao precisa conhecer de antemao todos os dominios da Honda, BYD, Ford ou Volkswagen. Ele pode descobrir candidatos, mas so promove um host para aquisicao/peso de primeira parte depois de evidencias de marca, mercado e veiculo. Uma pagina externa pode ser usada para orientar a proxima busca oficial sem virar, por acidente, a fonte que confirma o dado final.

## 7. Como medir se a proxima mudanca realmente melhora

Uma mudanca de pesquisa deve comparar o mesmo veiculo, versao, mercado, modelo e orcamento. Uma cobertura maior so e ganho se nao vier acompanhada de queda na qualidade da evidencia.

### Metricas obrigatorias por execucao

| Eixo | Medida |
| --- | --- |
| Cobertura | total, preenchidas, nao encontradas, nao aplicaveis e conflitos; tambem por grupo. |
| Fundamentacao | campos preenchidos com evidencia observada; campos criticos com fonte oficial aderente; campos rebaixados. |
| Fontes | candidatas, elegiveis para fetch, lidas, oficiais, parceiras, externas e divergentes. |
| Aquisição | busca emitida/executada, resultados, fetch por status/tipo, documentos candidatos/legiveis/ilegiveis. |
| Custo | passes, turnos, tokens de entrada/saida, chamadas de busca e tempo. |
| Decisao | motivo de parada e score dos candidatos; melhoria marginal do refine. |

### Bateria minima antes de promover uma mudanca

1. Um veiculo com pagina oficial conhecida e ficha PDF legivel.
2. Um veiculo com pagina oficial, mas sem PDF facil.
3. Um veiculo cuja melhor cobertura publica venha inicialmente de imprensa.
4. Reexecucao de um caso anterior para verificar regressao e variabilidade.

Para cada caso, publicar duas leituras: **cobertura descoberta** (o que a pesquisa encontrou) e **cobertura publicavel** (o que passou pelo gateway). Isso transforma a diferenca entre BYD e Tiguan em um sinal diagnostico, nao em uma escolha binaria entre “ficha vazia” e “ficha confiavel”.

## 8. Prioridades propostas (sem implementacao nesta analise)

### P0 — tornar a aquisicao observavel e destravar primeira parte

- Registrar, de forma sanitizada, o resultado de cada candidato de bootstrap: host, classe, motivo de aceite/rejeicao, aderencia, tentativas de fetch e motivo de nao execucao.
- Corrigir a passagem de descoberta de marca para URL elegivel de fetch/documento; hoje essa transicao e o principal gargalo fora das marcas preconfiguradas.
- Corrigir a metrica de uso de web search para a estrutura efetivamente retornada pelo provider.

**Criterio de sucesso:** em marcas nao preconfiguradas, cada execucao explica por que nao houve fonte oficial e registra ao menos um resultado verificavel de descoberta/eligibilidade, sem reduzir a protecao de aderencia.

### P1 — introduzir descoberta externa controlada

- Permitir fontes externas como candidatos de descoberta com nivel de evidencia explicito.
- Usar esses candidatos apenas para derivar novas consultas, nomes de documentos e URLs oficiais; nao confirmar automaticamente campo critico.
- Se a politica de produto permitir exibir dados secundarios, marcar visualmente a qualidade e mantê-los fora das facetas/pesquisa que exigem confirmado oficial.

**Criterio de sucesso:** aumentar cobertura descoberta sem elevar campos confirmados sustentados apenas por fonte externa ambigua.

### P2 — refine por capacidades e score de qualidade

- Agrupar lacunas por capacidade documental em vez de enviar uma lista extensa de caminhos.
- Fazer o router otimizar cobertura fundamentada e campos criticos, com teto de custo e interrupcao quando o ganho marginal for baixo.
- Manter o ledger de evolucao por experimento para evitar tuning cego de ambiente/modelo.

**Criterio de sucesso:** o refine melhora grupos-alvo e qualidade de fonte, ou deixa de ser chamado quando nao houver ganho esperado.

## 9. Veredito

Faz sentido usar o `ex_prompt` como fonte de aprendizado, mas nao como runtime a ser copiado. Ele prova que o provider/modelo consegue descobrir fontes oficiais e diversificar resultados quando a busca e aberta; nao prova que sua resposta final tenha evidencia suficiente para um BlindSpot confiavel.

O caminho recomendado e manter o gateway de evidencia do BlindSpot, reparar a aquisicao de primeira parte e adicionar uma camada de descoberta externa controlada antes dele. Isso permite recuperar a cobertura do legado sem voltar a tratar “URL acessivel” como “variavel comprovada”. Qualquer implementacao desse desenho altera fluxo de IA, evidencia e possivelmente contrato/persistencia, portanto exige Architecture Gate aprovado antes de codigo.

## Fontes primarias locais consultadas

- `C:\Users\lucas\Documents\GitHub\ex_prompt\AGENTS.md`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\README.md`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\package.json`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\prompt-assets\base-agent-prompt.txt`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\prompt-assets\schema.json`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\server\index.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\server\prompt-builder.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\server\llm.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\server\validator.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\server\logger.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\src\api.ts`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\src\App.tsx`
- `C:\Users\lucas\Documents\GitHub\ex_prompt\agent-core\README.md`, `SYNC.md` e `docs\*.md`
- Snapshots fornecidos pelo solicitante: `data\llm-responses\openrouter\google-gemini-2.5-flash\2026-05-19T21-19-27-936BRT--openrouter--google-gemini-2.5-flash--volkswagen-tiguan-2026.json` e `2026-05-19T21-04-17-238BRT--openrouter--google-gemini-2.5-flash--byd-king-2025.json`
- Logs correlatos por timestamp e veiculo em `C:\Users\lucas\Documents\GitHub\ex_prompt\logs\llm-responses\openrouter\google-gemini-2.5-flash\sem-web-search\` (consultados apenas para agregados de passes, uso e roteamento).
- `C:\Users\lucas\Documents\FIAP\CORVERNTURES\blindspot\services\api\source-evidence.ts`
- `C:\Users\lucas\Documents\FIAP\CORVERNTURES\blindspot\services\api\source-trust.ts`
- `C:\Users\lucas\Documents\FIAP\CORVERNTURES\blindspot\docs\operations\technical-sheet-research-evolution.md`
