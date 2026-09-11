# Pesquisa tolerante a documentos e orientada por lacunas

**Architecture Gate: APPROVED — Lucas aprovou a implementação em 2026-09-10.**

> **Emenda aprovada — 2026-09-11.** Para marcas sem domínio pré-configurado, a descoberta institucional terá um bootstrap de no máximo uma página candidata: a URL precisa ter sido observada, ser HTTPS, pertencer ao host candidato e retornar conteúdo concluído pelo fetch. O servidor confirma marca e mercado no conteúdo antes de liberar o host como primeira parte apenas para a execução atual. Sem confirmação, nenhuma fonte ganha autoridade e a ficha segue parcialmente preenchida. A aprovação explícita de Lucas autoriza esta emenda e seus fixtures; não autoriza chamada live adicional fora de uma geração manual.

## Objetivo

Substituir a dependência de uma ficha técnica em PDF por uma pesquisa que use esse documento quando ele for realmente legível, mas que continue quando não for. A geração deve priorizar evidência de primeira parte observada para a marca, modelo, versão, ano-modelo e mercado solicitados e, depois da primeira coleta, pesquisar grupos de variáveis ainda pendentes de modo específico e limitado.

Não é objetivo declarar que um domínio é oficial só porque parece pertencer à marca, nem transformar uma URL não lida em evidência de campo.

## Diagnóstico

O fluxo já separa descoberta institucional, aderência, autoridade e leitura de documento. O ponto inadequado foi tratar a leitura do PDF como portão: uma URL oficial observada, mas bloqueada por CDN, MIME, limite ou parser, podia terminar a geração antes da síntese. Isso confunde dois fatos: o documento foi encontrado e pode ajudar o operador; o servidor conseguiu, ou não, extrair evidência utilizável.

Também ainda não há um planejador determinístico que converta lacunas reais da ficha em consultas por capacidade. O refine recebe orientação por capacidade, mas a descoberta inicial continua ampla demais.

## Avaliação da proposta "Prompt Mestre"

A proposta externa é coerente como **política de pesquisa**: autoridade antes de completude, identidade exata, mercado e versão preservados, proveniência por campo, segunda passagem direcionada e `null` no lugar de inferência. Esses princípios devem entrar no desenho.

Ela não deve, porém, substituir o prompt e o schema canônicos como um único bloco. O texto mistura quatro responsabilidades que o BlindSpot precisa manter separadas:

- o modelo descobre, lê e propõe dados;
- assets versionados definem ordem, capacidades, aliases e limites;
- o servidor calcula aderência, autoridade, conflitos e cobertura;
- o schema vigente define a resposta pública.

Também há uma inconsistência interna na proposta: a hierarquia manda pesquisar página oficial local antes do documento oficial, mas a preferência documental coloca o PDF exato antes da página exata. A arquitetura resolve isso sem escolher um único formato: página do veículo e documento técnico são procurados na mesma etapa oficial, e a fonte mais específica para **cada campo** prevalece na elegibilidade. Dificuldade de acesso não aumenta nem reduz autoridade.

## Decisão proposta

### Documento é acelerador, não pré-requisito

Manter descoberta documental limitada e leitura segura. Se surgir ficha, catálogo, manual ou brochura aderente:

- texto extraído: criar `DocumentEvidencePacket` para quick/refine;
- URL observada sem texto: registrar um apontador com estado `indisponivel_para_leitura` e motivo enumerado/sanitizado, e continuar;
- documento não observado ou divergente: não publicar apontador nem usar como evidência.

O apontador não entra em `fontes_utilizadas`, não recebe `fonte_ref` e não melhora cobertura. Ele aparece em metadados de coleta, separado das fontes que sustentam valores.

### Candidato de marca não equivale a oficialidade

A descoberta institucional pode produzir `candidato_de_marca_observado`, por exemplo um host HTTPS cujo resultado relaciona marca e mercado. É só uma rota transitória. Um host vira primeira parte na execução apenas quando o servidor observa evidência aderente do veículo e confirma os critérios atuais de HTTPS, marca/modelo, ano, versão quando aplicável e mercado.

Páginas externas podem ajudar a encontrar a rota, mas não sustentam a ficha sem política server-owned. CarsNaWeb pode ser pista; não é fonte final só porque o modelo o citou.

### Planejador de lacunas por grupo

Após a primeira auditoria, o servidor deriva caminhos pendentes do schema e os agrupa pela `research-capability-policy.json`. Emite no máximo uma consulta por grupo prioritário e por passe; nunca uma consulta por cada uma das centenas de propriedades.

| Grupo | Exemplos | Termos/materiais |
| --- | --- | --- |
| Especificação e desempenho | motor, potência, torque, transmissão, consumo | ficha técnica, especificações, motor |
| Dimensões e capacidades | medidas, porta-malas, tanque, carga | dimensões, capacidades, carga |
| Rodas e exterior | pneus, rodas, iluminação, cores | rodas, pneus, cores, configuração |
| Segurança e assistência | airbags, ADAS, frenagem | segurança, assistência ao motorista, ADAS |
| Interior e conectividade | multimídia, conforto, conectividade | interior, conectividade, equipamentos |
| Garantia e serviço | garantia, revisões | garantia, manutenção, serviço |

A prioridade vem de campos críticos pendentes, quantidade de lacunas e materiais preferidos. Consultas usam apenas identificadores do payload e aliases server-owned; texto da web ou do modelo não vira instrução de consulta.

Dentro de cada grupo, o planejador inclui os nomes canônicos dos campos pendentes e sinônimos técnicos versionados em português e inglês. Assim, uma consulta do grupo de dimensões pode incluir `raio de giro`/`turning radius` apenas quando esse caminho estiver pendente, sem criar uma chamada independente para cada variável.

### Hierarquia de autoridade server-owned

A ordem sugerida pelo Prompt Mestre será incorporada como política de seleção, não como classificação declarada pelo modelo:

1. fabricante oficial no mercado solicitado — página, configurador ou documento específico;
2. fabricante global, somente com compatibilidade de mercado demonstrada;
3. órgão governamental, regulatório ou homologatório aplicável;
4. parceiro técnico previamente aprovado para o tipo de dado;
5. fonte externa não aprovada, apenas como pista de descoberta.

Concessionária, marketplace, fórum, agregador, blog e base genérica não se tornam evidência final por ranking, aparência ou quantidade de dados. Ampliar a lista de parceiros continua sendo uma decisão humana de política, separada do prompt.

### Estados de evidência de uma URL

O pipeline passa a distinguir explicitamente:

- `resultado_de_busca`: URL e título servem somente para descoberta;
- `trecho_extraido_da_busca`: highlight/snippet fornecido pelo mecanismo de busca, com conteúdo limitado e sem equivaler à página inteira;
- `conteudo_obtido`: página original foi adquirida pelo leitor seguro e pode ser avaliada;
- `documento_lido`: conteúdo documental foi extraído dentro dos limites;
- `indisponivel_para_leitura`: URL aderente observada, mas sem conteúdo utilizável.

URL/título isolados nunca confirmam variável. Um trecho extraído só pode sustentar um campo quando a fonte já for elegível e o valor/unidade ou afirmação correspondente estiver presente no trecho associado à mesma URL. Conteúdo adquirido ou documento lido oferece evidência mais forte. Uma URL sem conteúdo utilizável pode ser apresentada como documento encontrado e indisponível, mas não entra em `fontes_utilizadas` nem sustenta `fonte_ref`.

O contrato atual do OpenRouter padroniza resultados de web search como URL, título e trechos/highlights; ele não comprova por si só que a página completa foi aberta. Portanto, o estado `conteudo_obtido` exige prova separada. A decisão desta arquitetura é usar `openrouter:web_fetch` como aquisição complementar de **páginas oficiais**, sob os controles abaixo. O leitor atual continua sendo a primeira opção para PDFs e HTML já elegíveis.

### Aquisição controlada com `openrouter:web_fetch`

O fetch é um estágio próprio, depois da descoberta/aderência e antes da síntese. Ele não descobre domínios, não recebe consulta aberta e não substitui o leitor de PDF.

Entrada elegível para o fetch:

1. URL HTTPS já observada na descoberta;
2. aderência `exata` ou `compativel` para o veículo alvo;
3. hostname de primeira parte configurado ou promovido durante a execução;
4. página HTML/XHTML preferencialmente; PDFs continuam no leitor documental existente.

O request dedicado contém somente `openrouter:web_fetch`, inventário pequeno de URLs elegíveis, `allowed_domains` limitado à primeira parte e `blocked_domains` aplicado, `max_uses` baixo, `max_content_tokens` limitado e `max_tool_calls` compatível. A resposta só recebe estado `conteudo_obtido` se o retorno estruturado de fetch expuser URL, título, conteúdo e estado concluído, e a URL final corresponder ao inventário permitido. Falha, redirecionamento incompatível, retorno sem conteúdo ou resposta sem rastreabilidade vira `indisponivel_para_leitura`; não bloqueia a ficha.

O fetch usa inicialmente o engine `openrouter`, listado pelo fornecedor como gratuito, mas o texto retornado ainda entra no contexto do modelo e consome tokens. Não há engine BYOK, OCR pago ou novo segredo neste desenho. Como o recurso é beta, a implementação começa com OpenRouter e só é habilitada após fixtures do formato de resposta e uma geração manual autorizada.

### Condição de parada por campo

Uma variável deixa a fila de pesquisa quando possui evidência clara de fonte elegível, aderência exata ou compatível e identidade/mercado/ano/versão suficientes para aquele dado. O encerramento de um campo não encerra os demais grupos.

A pesquisa completa termina quando todos os campos pesquisáveis estão resolvidos ou quando os orçamentos e rotas autoritativas previstas foram esgotados. Campos restantes ficam `nao_encontrado`; cobertura não força fallback fraco.

### Conflito e ranking sem falsa precisão

O score numérico sugerido no Prompt Mestre não será exposto nem calculado pelo modelo: valores como `0,85` criariam precisão artificial e poderiam disputar autoridade com o servidor. O ranking será determinístico e explicável por dimensões separadas: identidade, mercado, versão, ano, autoridade, especificidade documental e data.

Uma fonte incompatível é isolada antes de virar conflito. Se duas fontes elegíveis e aderentes continuarem divergindo, o campo permanece `conflitante`, com valor nulo e referências distintas; o sistema não escolhe silenciosamente uma vencedora apenas por tier.

## Fluxo proposto

```text
entrada -> normalização conservadora da identidade
  -> cache/política de domínios já validados
  -> descoberta institucional limitada quando necessária
  -> inventário de candidatos
  -> páginas oficiais locais e documentos oficiais do veículo
  -> tentativa documental oportunista
       -> lido: pacote de evidência
       -> não lido: apontador transparente, sem autoridade de campo
  -> síntese inicial com fontes observadas permitidas
  -> auditoria de evidência, aderência e autoridade
  -> lacunas agrupadas por capacidade
  -> pesquisas específicas e bilíngues nos hosts permitidos
  -> regulatórios/parceiros aprovados somente para lacunas restantes
  -> refine/merge por campo -> publicação
```

Se não houver primeira parte elegível, uma única consulta adicional pode buscar presença institucional da marca/mercado. Sem confirmação observada, a geração não finge oficialidade: devolve campos não encontrados e observações sanitizadas.

## Contratos e impactos previstos

1. `metadados_coleta.documentos_observados` versionado: URL, título opcional, tipo, estado de leitura e motivo enumerado. Sem texto, headers, CDN ou log bruto.
2. `fontes_utilizadas` permanece exclusivo para fontes que sustentam `fonte_ref`.
3. Novo asset `schema path -> capability -> aliases/prioridade`, validado contra schema e política de capacidades.
4. Aquisição documental e fetch de página tornam-se opcionais com telemetria agregada: encontrado, tentado, lido/obtido, indisponível e motivo enumerado.
5. Orçamento separado para fetch e lacunas: máximo de URLs/grupos, buscas, resultados, conteúdo e tokens. Sem aumento automático de quick/refine.
6. Registrar internamente o nível de observação da URL (`resultado_de_busca`, `trecho_extraido_da_busca`, `conteudo_obtido`, `documento_lido` ou `indisponivel_para_leitura`) para impedir que URL/título sejam promovidos a evidência.
7. Preservar o schema atual, seus nomes de variáveis, grupos, status e `fonte_ref`; o formato alternativo apresentado na proposta não será adotado.
8. Manter todos os campos pesquisáveis do schema como alvo. `requested_fields` não será acrescentado ao endpoint neste incremento.
9. Criar verificação de alegação por campo: para cada valor preenchido, correlacionar `fonte_ref` com evidência textual observada da mesma URL. Ausência de suporte rebaixa o campo; aderência da fonte sozinha não basta.
10. Aplicar limites reais do server tool: `max_uses`, `max_total_results` e `max_tool_calls`. O código atual limita resultados, mas não envia todos os limitadores de chamadas suportados pelo OpenRouter.
11. Fazer `document_hunter.enabled=false` significar nenhuma caça documental candidata. Atualmente o código ainda executa `landing_links` quando a flag está falsa; isso deve ser corrigido antes de evoluir a pesquisa.
12. Criar política versionada de fetch com `enabled`, `max_urls`, `max_uses`, `max_content_tokens`, `max_tool_calls`, engine, tipos de conteúdo e exigência de URL previamente observada; valores iniciais conservadores: 2 URLs, 2 usos, 6.000 tokens de conteúdo por URL e 2 tool calls.

Não há novo provedor, credencial, endpoint público, upload, persistência de arquivo ou dependência paga. Ainda assim, pesquisas adicionais consomem o orçamento cobrado pelo mecanismo web já usado no OpenRouter e tokens do modelo; por isso o planner só entra com limites e condição de parada explícitos.

## Segurança

- O leitor preserva HTTPS, host elegível, DNS público, redirects, MIME/magic bytes, tamanho, páginas e timeout limitados.
- Conteúdo web/PDF é dado não confiável; não altera prompt, schema, política ou chamadas do servidor.
- O planner é server-owned e só usa caminhos/aliases versionados.
- Telemetria guarda contagens e motivos enumerados, nunca chaves, cookies, headers, prompt, texto de PDF ou resposta bruta.
- A interface explicita “encontrado, não foi possível ler”, sem selo de fonte oficial.
- Descoberta global/local e aliases bilíngues vêm de política versionada; o modelo não pode cadastrar domínio, parceiro ou sinônimo persistente.
- Cache de domínio guarda somente hostname, marca/mercado, evidência agregada, estado, versão da política e expiração; descoberta institucional isolada não concede autoridade.
- Um domínio candidato não pode tornar-se `learned` com duas repetições do mesmo tipo de snippet. Promoção exige evidência de origem distinta ou prova de conteúdo obtido e aderente.
- Limites de busca devem existir no request enviado ao provider, não apenas em contadores e decisões locais.
- O fetch recebe somente primeira parte já elegível. URL devolvida fora do inventário ou host permitido é descartada antes de qualquer correlação de campo.
- Conteúdo retornado pelo fetch recebe o mesmo tratamento de prompt injection de PDF/HTML: é evidência externa, nunca instrução de sistema.

## Critérios de aceite

1. PDF oficial observável, mas ilegível, não retorna HTTP 424 nem impede persistir ficha válida baseada em outras fontes.
2. O PDF aparece apenas em `documentos_observados`; nenhum campo o referencia sem pacote de leitura/evidência observada.
3. PDF legível enriquece a ficha sem busca por campo individual.
4. Cores, segurança e dimensões produzem consultas de grupos distintos, limitadas e reprodutíveis.
5. Host parecido com a marca não chega a `fontes_utilizadas` sem aderência e autoridade server-owned.
6. Fontes externas não aprovadas são removidas com suas referências antes da publicação.
7. Fixtures cobrem Ford, BYD e uma marca sem domínio previamente configurado.
8. Typecheck, verificadores atuais e testes novos do planner passam; geração live depende de autorização manual.
9. URL/título sem conteúdo não confirmam campo; trecho extraído só confirma quando contém a alegação e pertence à URL elegível referenciada.
10. Quando uma fonte oficial local resolve um campo, esse campo sai da fila; os demais continuam em pesquisas direcionadas.
11. Fonte global só confirma valor quando sua compatibilidade com o mercado solicitado estiver evidenciada.
12. O mesmo conjunto de lacunas produz a mesma ordem de grupos e aliases, independentemente do modelo LLM escolhido.
13. Com `document_hunter.enabled=false`, nenhuma chamada de caça documental candidata é executada.
14. O request OpenRouter contém limites explícitos de uso total de server tools, e a telemetria prova que o teto foi respeitado.
15. Aderência `exata` da fonte não basta para confirmar um valor ausente de sua evidência textual.
16. O estágio de fetch não chama URL de parceiro ou terceiro, nem URL que não tenha sido observada antes.
17. Conteúdo de fetch sem URL final rastreável, fora do inventário ou sem estado concluído não confirma campo.
18. Falha do fetch não gera HTTP 424 e não impede que outras fontes preencham a ficha.

## Plano incremental revisado

### Incremento 1 — corrigir limites e semântica existentes

- fazer a flag do caçador realmente desligar o estágio;
- enviar `max_uses` e `max_tool_calls` ao OpenRouter;
- manter PDF ilegível como degradação não bloqueante;
- remover a orientação de escolher vencedor automático em conflito.

Esse incremento reduz risco e custo sem alterar o schema público.

### Incremento 2 — fetch controlado de páginas oficiais

- adicionar política e adaptador OpenRouter dedicado, sem web search no mesmo request;
- limitar a URLs oficiais observadas e elegíveis, hosts permitidos, usos, conteúdo e tool calls;
- extrair resposta estruturada para o ledger de evidência, sem registrar texto bruto;
- manter leitor local/provider parser para PDFs;
- provar com fixtures os retornos concluído, falho, URL fora do inventário e conteúdo sem suporte ao campo.

O fetch fica desabilitado por default até a primeira validação controlada. Se o formato de resposta do provider não permitir rastrear URL/conteúdo de forma segura, o estágio é degradado e nenhum campo depende dele.

### Incremento 3 — planner determinístico de lacunas

- derivar grupos, prioridades, campos e aliases a partir dos assets;
- executar no máximo os grupos prioritários dentro do orçamento;
- interromper pesquisa de campos já comprovados;
- manter o modelo responsável pela formulação final da consulta, mas tornar determinísticos o plano, os termos permitidos e os limites. Não prometer consultas byte a byte idênticas entre modelos.

### Incremento 4 — prova por campo e transparência documental

- classificar nível de evidência de cada URL;
- correlacionar valor/unidade ou alegação com trecho, página ou documento da mesma fonte;
- acrescentar `documentos_observados` ao contrato e à interface;
- apresentar documento indisponível sem tratá-lo como fonte utilizada.

### Incremento 5 — paridade de providers

O core de planejamento e validação será compartilhado. OpenRouter recebe primeiro o novo orquestrador por ser o provider ativo desta investigação. Claude não pode ser anunciado como equivalente: hoje ele não executa a descoberta documental, o leitor e a barreira de autoridade de primeira parte do mesmo modo. A paridade exige adaptador e fixtures próprios antes de habilitar o mesmo comportamento.

## Double-check contra o runtime atual — 2026-09-10

### Fatos confirmados

- O endpoint compõe prompt, chama provider, valida AJV/políticas e só então persiste.
- OpenRouter já possui descoberta, aquisição, leitura opcional, quick, refine e merge por campo.
- O refine já recebe caminhos pendentes agrupados por capacidade, mas não existe um planner que controle consultas por grupo; o modelo decide as pesquisas dentro de um passe único.
- O quick fica restrito a primeira parte quando disponível, ou parceiros; o refine usa primeira parte mais parceiros.
- A política oficial cadastrada contém somente Ford/Brasil. Outras marcas dependem do bootstrap dinâmico.
- O bootstrap e a aderência atuais usam URL, título e trecho de busca; isso pode promover domínio sem prova de página completa.
- `document_hunter.enabled=false` ainda resulta em uma busca `landing_links` para candidato.
- O helper do web search usa `max_total_results`, mas não envia `max_uses` nem o `max_tool_calls` de nível superior.
- OpenRouter aplica a barreira server-owned de autoridade; o caminho Claude atual não possui paridade completa dessa barreira nem do leitor documental.
- `quality-policy.json` proíbe vencedor automático, mas os prompts de conflito ainda orientam tentar escolher um valor. O padrão OpenRouter deixa esse passe desativado; Claude permite um passe por padrão.
- `metadados_coleta` rejeita propriedades extras, portanto mostrar documento indisponível exige mudança versionada de schema e interface.
- `openrouter:web_fetch` está disponível como server tool beta, possui filtros de domínio, limite de usos e de conteúdo, e retorna URL/título/conteúdo/estado ao modelo. A arquitetura passa a usá-lo somente como aquisição limitada de página oficial; a observabilidade da resposta para o servidor deve ser provada por fixture antes de habilitação.

### Conclusão do double-check

A direção permanece correta, mas a implementação deve seguir os incrementos acima. Começar diretamente pelo Prompt Mestre ou somente ampliar prompts preservaria as fragilidades atuais. O primeiro ganho deve ser tornar os limites e estados existentes verdadeiros; depois entram planner e prova por campo. Com essas correções registradas, a arquitetura foi aprovada para implementação incremental em 2026-09-10.

## Double-check

- Escopo: muda comportamento de IA e metadados; exige aprovação antes de implementação.
- Dados: públicos de veículos; sem nova categoria pessoal, upload ou retenção documental.
- Integrações: provedor/parser atuais; OCR pago continua desabilitado.
- Falha segura: leitura falha reduz cobertura, mas nunca promove autoridade, inventa valor ou bloqueia indevidamente uma ficha.
- Rollback: desativar planner e manter leitura opcional, sem relaxar políticas de evidência/autoridade.

## Aprovação requerida

Após aprovação explícita, ficam autorizados: contrato de metadados, asset/planner de lacunas, composição/passes, verificadores e documentação. Não ficam autorizados: provedor pago, coleta de credenciais, upload administrativo ou relaxamento da política de fontes.
