# Relatorio de situacao — pesquisa de fichas tecnicas do BlindSpot

Data da consolidacao: 2026-09-11  
Escopo: fluxo de geracao por IA, descoberta web, evidencia, autoridade de fonte, leitura documental e cobertura.  
Limite: este documento usa apenas telemetria agregada, assets versionados e resultados informados/observados; nao reproduz prompts, respostas de LLM, URLs, identificadores de requisicao, chaves ou logs brutos.

## Resumo executivo

O BlindSpot ja possui uma base de pesquisa mais segura do que uma busca web generica: identidade do veiculo e versionada, fontes passam por aderencia, ha uma barreira server-owned de autoridade, documentos podem ser lidos de modo limitado e campos sem evidencia sao rebaixados. Isso impede que agregadores ou fontes de outro ano sustentem silenciosamente uma ficha.

O problema atual e de **aquisicao de primeira parte**, nao de schema ou de quantidade maxima de campos. Para uma marca sem dominio oficial previamente cadastrado, o pipeline encontra candidatos institucionais, mas nao conseguiu promover nenhum como primeira parte na execucao real. Sem esse host, a descoberta documental oficial, o leitor e o fetch de pagina do veiculo ficam sem entrada elegivel. A geracao termina apoiada em poucos resultados de busca e, quando permitido, em parceiro de imprensa aderente.

O ultimo experimento aumentou a cobertura de 10/195 para 26/194 variaveis preenchidas, mas manteve somente uma fonte final de imprensa automotiva. Portanto, houve melhora de quantidade, nao de confiabilidade nem de independencia da fonte oficial.

**Decisao atual:** manter as barreiras de evidencia e autoridade; nao aumentar orcamento nem liberar agregadores. O proximo incremento deve tornar observavel e corrigivel o bootstrap de dominio institucional antes de uma nova rodada de ajustes de pesquisa.

## O que o produto faz hoje

### Fluxo efetivo

```text
entrada de marca/modelo/versao/ano/mercado
  -> descoberta institucional quando nao ha dominio oficial cadastrado
  -> descoberta de documentos oficiais quando existe dominio de primeira parte
  -> aquisicao e leitura documental oportunista
  -> quick com busca web
  -> auditoria de evidencia, aderencia e autoridade
  -> refine orientado por lacunas/capacidades
  -> merge por campo, validacao de schema e persistencia
```

O servidor e dono das decisoes de aderencia, autoridade, conflitos, status e completude. O modelo pode propor fontes e valores, mas nao pode transformar a si proprio uma pagina em oficial ou publicar uma fonte sem referencia observada.

### Contratos que protegem a ficha

- A identidade tem marca, modelo, versao, ano-modelo e mercado como referencia obrigatoria.
- Uma fonte precisa ser HTTPS e aderente ao alvo; fonte de ano, mercado, versao ou motorizacao divergente e isolada.
- A barreira de autoridade aceita primeira parte em dominio configurado ou validado na execucao, e parceiros explicitamente aprovados para seu tipo de fonte.
- `fonte_ref` e status de campo sao rebaixados quando a fonte e removida.
- Conflitos nao devem escolher vencedor automaticamente.
- PDF ou pagina inacessivel nao bloqueia a ficha inteira; apenas nao pode sustentar variavel.

## Politicas e orcamentos ativos

| Camada | Estado atual | Consequencia |
| --- | --- | --- |
| Politica local de dominios oficiais | Ha somente Ford/Brasil cadastrado | Marcas diferentes dependem de bootstrap dinamico seguro. |
| Descoberta de presenca da marca | Habilitada; ate 3 hosts candidatos | Descobre rotas, mas nao concede autoridade. |
| Descoberta documental oficial | Habilitada; ate 2 chamadas e 12 resultados | So executa quando existe dominio de primeira parte. |
| Cacador documental candidato | Desabilitado | Evita busca ampla em dominios ainda nao validados. |
| Fetch de paginas | Habilitado; ate 2 URLs, 2 usos e 2 tool calls | So deve trabalhar em URLs observadas e hosts elegiveis. |
| Bootstrap institucional | Habilitado; no maximo 1 URL candidata | Deve promover host somente se conteudo concluido confirmar marca e mercado. |
| Leitor documental | Habilitado; ate 2 documentos | Exige URL elegivel e limites de DNS, HTTPS, tamanho, MIME, redirects e timeout. |

Os valores representam limites de controle, nao garantia de que o provider usara todas as chamadas.

## Historico observado de execucoes

Entre 2026-09-10 e 2026-09-11, a telemetria registrou 18 execucoes reais:

| Resultado | Quantidade | Observacao |
| --- | ---: | --- |
| Sucesso | 12 | Inclui fichas parciais; sucesso de HTTP nao equivale a cobertura ou qualidade suficiente. |
| Erro | 6 | Dois ocorreram com o modelo alternativo testado; quatro com o modelo principal. A telemetria sanitizada nao permite atribuir uma unica causa a todos. |
| Modelo principal | 16 | Modelo da familia Gemini Flash usado nas execucoes recentes. |
| Modelo alternativo | 2 | Ambas as execucoes registradas terminaram em erro. |

### Baseline e ultimo experimento

| Execucao | Cobertura reportada | Evidencia/pipeline | Leitura |
| --- | --- | --- | --- |
| Baseline | 10/195 (5,1%) | 5 observacoes institucionais, 2 candidatos; nenhuma descoberta documental oficial; leitor/fetch do veiculo pulados | Sem ancora de primeira parte, a ficha quase nao teve evidencia elegivel. |
| Ultimo experimento | 26/194 (13,4%) | 5 observacoes institucionais, 3 candidatos; descoberta documental oficial, leitor e fetch do veiculo pulados; F2 de imprensa foi a unica fonte final | Mais valores, mas sem fonte oficial final. O total de variaveis divergiu, portanto a comparacao e indicativa. |

Nos dois casos, o passe rapido observou somente tres fontes. O refinamento observou seis no baseline e sete no ultimo experimento. Na ultima execucao, a auditoria de aderencia isolou duas fontes em cada passe; a barreira de autoridade nao registrou remocoes. Isso indica que fontes insuficientemente aderentes foram eliminadas antes da publicacao, enquanto a fonte de imprensa parceira permaneceu elegivel.

## Diagnostico por estagio

### 1. Identidade e schema — saudavel

Nao ha evidencia de que o baixo preenchimento seja causado por quebra do schema ou perda da identidade de entrada. O fluxo persiste fichas validas e manteve os campos ausentes em estados apropriados, em vez de preencher por inferencia livre.

**Confianca:** alta.

### 2. Descoberta institucional — parcial

O mecanismo encontra de dois a tres candidatos institucionais quando nao existe dominio cadastrado. Isso prova que a busca de rota existe; nao prova que alguma rota foi confirmada como dominio da montadora no mercado correto.

**Confianca:** alta para a descoberta; baixa para a natureza oficial dos candidatos, por desenho.

### 3. Bootstrap de dominio — nao demonstrado

O bootstrap foi implementado para fazer fetch de uma pagina candidata e promover o host somente com conteudo concluido que confirme marca e mercado. Na ultima execucao, porem, a descoberta documental oficial continuou pulada e o leitor/fetch do veiculo tambem. Isso e evidencia forte de que nenhum host foi promovido.

A telemetria atual nao registra, de modo agregado, `bootstrap_requested`, `bootstrap_completed`, `bootstrap_observed_content` e `bootstrap_promoted`. Portanto, nao e possivel diferenciar com certeza entre: chamada nao emitida pelo provider, retorno sem conteudo rastreavel, conteudo sem os sinais exigidos ou URL candidata sem condicao de selecao.

**Confianca:** alta de que a promocao foi zero; media sobre a causa exata.

### 4. Descoberta e leitura de documentos oficiais — bloqueadas por dependencia

Sem dominio de primeira parte, a descoberta documental oficial nao recebe dominio permitido. Sem documento elegivel, leitor PDF/HTML, parser de documento e fetch de pagina do veiculo nao sao chamados. Isso nao e falha isolada do PDF: e uma consequencia do bootstrap nao concluido.

**Confianca:** alta.

### 5. Quick/refine e parceiros — funcionamento defensivo, alcance baixo

Os passes estao retornando JSON valido e observando algumas fontes. A auditoria remove fontes sem aderencia, o que protege contra outro ano ou versao. Quando uma fonte parceira de imprensa e especifica e aderente, ela pode sobreviver e preencher campos, como ocorreu com F2.

Isso e comportamento coerente com a politica, mas nao substitui fonte de montadora. A presenca de uma unica fonte final tambem reduz a capacidade de cobrir variaveis que exigem configurador, manual, cores ou documentacao comercial.

**Confianca:** alta.

## Mudancas realizadas nesta sessao

| Mudanca | Objetivo | Estado/evidencia |
| --- | --- | --- |
| Limites reais de web search | Enviar `max_uses` e `max_tool_calls`, alem de limite de resultados | Implementado e validado por typecheck/verificadores. |
| `document_hunter=false` | Fazer a flag realmente pular a busca candidata | Implementado; evita busca ampla involuntaria. |
| PDF ilegivel nao bloqueante | Continuar a ficha quando documento oficial nao pode ser lido | Mantido pela politica; leitura vira degradacao. |
| Resolucao de conflito | Impedir escolha automatica de vencedor | Prompt alinhado a `conflitante` ate prova oficial suficiente. |
| Fetch controlado | Ler pagina apenas de URL observada, HTTPS, host permitido e dentro de teto | Implementado com fixture de retorno concluido e URL fora do inventario. |
| Evidencia com nivel | Distinguir resultado de busca de conteudo obtido | Implementado no contrato de evidencia. |
| Refinamento por capacidade | Dar termos de pesquisa para especificacao, visual, conectividade e seguranca | Implementado no prompt de refine. |
| Bootstrap institucional | Validar pagina candidata antes de liberar dominio temporario | Implementado e testado offline; ainda nao comprovado na telemetria de execucao real. |
| Linha de evolucao | Comparar cada tentativa sem guardar dados brutos | Criada em `docs/operations/technical-sheet-research-evolution.md`. |

## Verificacoes executadas

Passaram no estado atual do worktree:

- typecheck TypeScript;
- verificacao de evidencia de fontes;
- verificacao de politica de fontes;
- verificacao de capacidades de pesquisa;
- verificacao do leitor documental;
- verificacao de espacos no diff.

O build de frontend ficou bloqueado por configuracao/arquivo Vite nao resoluvel no ambiente local. Esse bloqueio nao foi alterado porque nao pertence ao fluxo de pesquisa; por isso nao se declara aprovacao integral de build.

Nenhuma chamada adicional ao provider foi feita para validar estas mudancas. As execucoes reais mencionadas foram geradas manualmente pelo operador.

## Riscos e limites atuais

- A marca sem politica cadastrada ainda pode permanecer sem primeira parte se o bootstrap falhar.
- `web_fetch` e um recurso de provider; seu formato de retorno precisa ser observado em telemetria agregada para diferenciar indisponibilidade de falha de validacao.
- A cobertura numerica nao mede qualidade sozinha. Uma ficha com 26 campos de uma unica imprensa nao e equivalente a uma ficha com menos campos apoiados em documentacao oficial.
- O caminho Claude nao possui a mesma paridade do orquestrador documental/autoridade do OpenRouter.
- O catalogo de fichas persistidas e a busca por filtros tecnicos sao outro fluxo; este relatorio nao declara que uma variavel esteja pesquisavel no catalogo apenas porque foi gerada.

## Plano recomendado, em ordem

1. **Instrumentar o bootstrap, sem ampliar pesquisa.** Registrar contagens sanitizadas de solicitado, concluido, conteudo observado e host promovido; incluir motivo enumerado de nao promocao. Criterio de sucesso: proxima execucao permite classificar a falha sem log bruto.
2. **Corrigir a causa revelada pelo instrumento.** Se o provider nao expuser corpo rastreavel, adaptar o contrato ou degradar o fetch de forma explicita. Se os sinais de marca/mercado forem insuficientes, revisar a regra com fixtures de paginas institucionais reais sanitizadas.
3. **Testar uma marca sem dominio cadastrado com alvo identico ao baseline.** Manter modelo, mercado, ano e orcamento. Sucesso minimo: pelo menos um host promovido e descoberta documental oficial executada; nao usar cobertura como unico criterio.
4. **Somente depois, medir cobertura por grupo.** Comparar motor, cores, seguranca, conectividade e dimensoes com fontes oficiais e `fonte_ref`, verificando se cada melhoria sobrevive a aderencia/autoridade.
5. **Adicionar dominios estaveis a politica somente por governanca.** O bootstrap nao substitui a politica local para marcas recorrentes; entradas persistentes exigem revisao humana e evidencia de primeira parte.

## Go/no-go

| Decisao | Estado | Justificativa |
| --- | --- | --- |
| Aumentar chamadas, tokens ou resultados | **No-go** | O gargalo atual ocorre antes da busca por lacunas: nao ha primeira parte promovida. |
| Liberar agregadores para aumentar cobertura | **No-go** | Violaria a direcao de qualidade e reduziria confiabilidade. |
| Tratar imprensa parceira como fonte primaria | **No-go** | Pode complementar, mas nao prova ser fonte oficial. |
| Instrumentar bootstrap sanitizado | **Go, com Architecture Gate** | Mudanca pequena que isola a hipotese e melhora a tomada de decisao. |
| Corrigir bootstrap apos telemetria | **Go condicional** | Depende do motivo observado na proxima execucao controlada. |

## Referencias internas

- [Arquitetura de pesquisa tolerante e orientada por lacunas](../architecture/agent-core/TOLERANT_DOCUMENT_AND_FIELD_RESEARCH.md)
- [Revisao de seguranca da arquitetura](../architecture/agent-core/TOLERANT_DOCUMENT_AND_FIELD_RESEARCH_SECURITY_REVIEW.md)
- [Registro de evolucao das execucoes](technical-sheet-research-evolution.md)
- [Skill de auditoria](../../.codex/skills/technical-sheet-search-auditor/SKILL.md)
