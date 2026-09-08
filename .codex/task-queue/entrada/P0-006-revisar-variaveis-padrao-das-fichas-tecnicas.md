# ✅ Concluída — revisar variáveis padrão das fichas técnicas

> Prioridade: P0 — urgente
>
> Área afetada: contratos de dados, runtime de IA, validação, catálogo e experiência de leitura da ficha técnica
>
> Origem ou referência: solicitação de Lucas em 08/09/2026; continuidade posterior ao P1-003
>
> Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`
>
> Triagem automática: `Material — pendente de Architecture Gate`
>
> Segurança: `Aplicável — schema, prompt e IA com fontes externas`

## Pedido

Revisar integralmente as variáveis padrão usadas nas fichas técnicas do BlindSpot antes de continuar a normalização do P1-003. O resultado deve definir, com rastreabilidade, quais variáveis são universais, quais dependem de veículo/versão/mercado/combustível/carroceria e quais não devem receber valor presumido.

A revisão deve impedir que um valor padrão, um texto de catálogo ou uma inferência do modelo seja apresentado como especificação confirmada. Deve também estabelecer como representar, por variável, `não informado`, `não aplicável`, `a confirmar`, `conflitante` e `confirmado`, preservando fonte e contexto da versão consultada.

Esta task é de diagnóstico, decisão e plano de correção. Nenhum schema, prompt, endpoint, fixture, persistência ou interface deve ser alterado antes de a arquitetura ser aprovada explicitamente.

## Critérios de aceite

- [x] Inventário completo dos 204 caminhos obrigatórios da ficha canônica, distinguindo 199 campos com status e 5 coleções de adicionais, agrupado pelas seções do schema.
- [x] Classificação explícita de cada caminho como núcleo genérico, condicional ou extensão, com discriminadores de configuração e recomendação de racionalização.
- [x] Matriz de defaults aprovada como política: ausência explícita, fonte mínima, estados permitidos e proibição de inferência/default técnico.
- [x] Política para campos condicionais, incluindo motorização, consumo, desempenho, dimensões, equipamentos e segurança, sem preencher lacunas por suposição.
- [x] Mapeamento de inconsistências entre schema/mock/prompt/validador/políticas e documentação de produto.
- [x] Proposta de contrato de estado, cobertura estrutural 204/204, cobertura resolvida 199/199 e lacuna explícita para coleções sem status.
- [x] Casos de decisão para carroceria, combustão, EV/PHEV, opcional de pacote, fonte incompatível e ficha final completa.
- [x] Arquitetura e revisão de segurança registradas; Lucas aprovou a entrega documental em 08/09/2026.
- [x] Plano incremental separado do P1-003, sem alterar seu runtime nem iniciar migração de contrato.

## Restrições ou contexto

- Ler antes de arquitetar: `AGENTS.md`, `.codex/project-delivery-kit/project-profile.md`, `.codex/project-delivery-kit/verification-strategy.md`, as instruções de domínio aplicáveis e as skills `project-architecture` e `project-security-assurance`.
- A fonte canônica de runtime é `packages/agent-runtime/assets/`; `docs/architecture/` e `docs/product/` são evidência e especificação de produto, não substitutos automáticos do contrato em execução.
- Examinar em conjunto `schema.json`, `base-agent-prompt.txt`, `mock-response.json`, a política de fontes, o construtor de prompt, o validador, os serviços de catálogo/persistência e as fixtures relevantes.
- Confrontar o inventário técnico com `docs/product/backlog.md`, `docs/product/fluxograma-desenvolvimento-agente.md`, `docs/product/coverage-matrix.md`, `docs/product/source-inventory.md` e os demais documentos de produto que mencionem ficha, comparação, exportação, qualidade ou catálogo.
- Usar somente evidências e fixtures sanitizadas. Não copiar `.env`, segredos, logs ou snapshots brutos de LLM; não chamar provider real nem realizar busca externa sem autorização e ambiente apropriado.
- Não transformar uma regra de exibição em dado técnico, nem um padrão de catálogo em confirmação da versão específica. Ausência de evidência deve permanecer explícita para a pessoa usuária e para consumidores de API.
- Fora do escopo nesta etapa: alterar o contrato, executar migração, mudar prompt, implementar normalização do P1-003, criar UI ou fazer backfill de fichas existentes. Esses itens dependem do Gate aprovado e de tasks de implementação subsequentes.

## Arquitetura proposta

### Decisão e escopo

**Fatos confirmados no checkout:** `schema.json` possui **204 caminhos obrigatórios em 14 grupos**: 199 campos com contrato de estado e 5 coleções obrigatórias em `adicionais`. Os 199 campos de status não possuem default técnico no JSON Schema; o mock canônico os contém como `nao_encontrado`, portanto é uma fixture segura de ausência — não um catálogo de especificações padrão. As cinco coleções não têm estado próprio, lacuna que esta P0 registra para decisão futura. A P1-003 introduziu normalização somente para quatro medidas allowlisted e não cria valores. A política atual de fontes vincula fonte à marca/mercado, mas não define aplicabilidade por versão, propulsão ou pacote.

**Decisão proposta:** entregar primeiro um catálogo de governança, versionado e legível, com uma entrada para cada um dos 204 caminhos. O catálogo será a referência de produto e de revisão para defaults; ele não introduzirá valores técnicos padrão e não entrará automaticamente no prompt do LLM. Cada entrada terá caminho, grupo, semântica, classe de aplicabilidade, unidade quando houver, estados permitidos, fonte mínima, tratamento de ausência e proibição de inferência.

Além do catálogo, a P0 produzirá um **dossiê de racionalização de variáveis** para decisão de Lucas. Ele separará: campos realmente genéricos, campos genéricos com valores em enumeração, campos condicionais úteis, campos excessivamente específicos que devem ser fundidos sob uma variável mais geral e campos que devem permanecer como extensões opcionais. Nenhum campo será removido, fundido ou renomeado nesta P0: as alternativas, impacto de contrato e recomendação serão apresentadas para aprovação humana.

A fonte de runtime continua `packages/agent-runtime/assets/`. Qualquer mudança futura que faça o agente consumir essa política, altere `schema.json`, inclua novo status, faça backfill ou gere um valor por default será derivada em task própria após um novo Gate. Isso evita aumentar o prompt com uma tabela de 204 linhas sem antes validar que essa é a melhor forma de controle.

### Inventário e classificação a produzir

O catálogo enumerará individualmente todos os campos dos seguintes grupos, preservando seus caminhos exatos: `identificacao` (8), `motorizacao` (15), `transmissao_e_tracao` (7), `cores_externas` (1), `exterior` (37), `interior_e_conforto` (31), `sistema_multimidia_e_conectividade` (23), `seguranca` (27), `tecnologia_dinamica` (12), `conectividade_via_aplicativo` (12), `performance_offroad` (9), `dimensoes_e_capacidade` (8), `garantia_servicos_e_comercial` (9) e `adicionais` (5).

Cada linha receberá exatamente uma classe primária:

| Classe | Regra | Exemplos de discriminador |
|---|---|---|
| `universal` | Campo deve existir na estrutura para toda ficha, mas o valor ainda precisa de evidência. | identidade exata, categoria, motor nome, dimensões publicadas. |
| `condicional` | Pode existir, mas depende de configuração identificável; ausência não é prova de inexistência. | ano-modelo, mercado, versão, motorização, transmissão, tração, combustível, carroceria ou pacote. |
| `derivada` | Só pode ser calculada por fórmula versionada e aprovada a partir de valor de fonte; jamais usada como default. | conversão de unidades da P1-003. |
| `não aplicável` | A característica é incompatível com a configuração comprovada, não meramente não encontrada. | autonomia elétrica para combustão sem eletrificação; recurso de EV em veículo sem essa capacidade. |

O catálogo terá ainda uma classificação de família para dar consistência às 204 linhas: identidade; propulsão/consumo; transmissão/tração; carroceria/exterior; conforto; conectividade/multimídia; segurança; dinâmica/off-road; dimensão/capacidade; garantia/comercial; adicional opcional. Isso permite auditar regras comuns sem substituir a decisão individual de um campo.

### Racionalização: genérico primeiro, especializado por exceção

Para cada variável, a análise responderá quatro perguntas: **qual decisão de produto ela suporta?**, **ela descreve qualquer veículo ou apenas uma subpopulação?**, **há uma variável pai que comporta seus valores sem perda relevante?** e **o detalhe especializado precisa ser pesquisado em toda consulta?**

O dossiê trará, por campo, uma recomendação entre `manter genérica`, `manter condicional`, `fundir em campo pai`, `mover para extensão por domínio` ou `retirar do contrato futuro`, acompanhada de motivo, exemplos de valores, risco de perda e impacto em comparador/exportação/histórico. Exemplos que serão analisados, sem decisão antecipada:

| Questão a decidir | Campos atuais envolvidos | Alternativas que serão comparadas |
|---|---|---|
| Estrutura/carroceria | `categoria`, `tipo_carroceria`, `cabine_tipo` | manter uma taxonomia genérica que aceite sedan, hatch, SUV, picape/caminhonete etc.; manter detalhes de cabine somente quando a carroceria permitir. |
| Propulsão | `motor_tipo`, `motor_combustivel`, `motor_eletrificacao_tipo`, `motor_eletrico_presente`, `autonomia_eletrica_km` | um campo genérico de arquitetura de propulsão com valores combustão/elétrico/híbrido/PHEV, acompanhado de detalhes condicionais apenas quando aplicáveis. |
| Serviços de veículo eletrificado | `app_conectividade_ev`, `garantia_bateria_anos`, `garantia_bateria_limite_km` | manter como extensões condicionais de propulsão eletrificada ou consolidar a leitura em uma família de garantia/conectividade com aplicabilidade explícita. |
| Uso fora de estrada/reboque | `offroad_recursos`, `ganchos_reboque_qtd`, `protecao_inferior_itens`, diferenciais blocantes e capacidade de reboque | decidir se são atributos genéricos de capacidade/tração com valores vazios ou se merecem extensão de veículo utilitário/off-road. |
| Conectividade e opcionais | recursos de app, OTA, hotspot, assistente digital, som e itens de acabamento | identificar campos universais de conectividade versus opcionais/pacotes que não devem orientar coleta prioritária de todo veículo. |

O objetivo não é reduzir artificialmente a informação, mas evitar que o núcleo exija a mesma pesquisa profunda para atributos que só existem em uma minoria de configurações. A decisão final preservará comparabilidade: um detalhe retirado do núcleo só poderá migrar para extensão com status, proveniência e versão preservados.

### Cobertura obrigatória de 100% por ficha

Uma ficha técnica terá **sempre o mesmo conjunto canônico de 204 caminhos** enquanto o schema atual estiver vigente: 199 campos de dados e 5 coleções de adicionais. A consulta não poderá entregar 100 campos em uma ficha e 115 em outra. O que varia é o resultado de pesquisa de cada campo, nunca sua presença estrutural.

O catálogo definirá dois indicadores distintos, para não confundir quantidade com qualidade:

| Indicador | Fórmula | Regra |
|---|---|---|
| `cobertura_estrutural` | caminhos presentes com forma válida ÷ 204 | Deve ser `100%` (204/204). A resposta com caminho omitido é inválida e não é publicada. |
| `cobertura_resolvida` | campos de status em estado terminal válido ÷ 199 | Deve ser `100%` (199/199) após a pesquisa. Cada variável de dados precisa receber resultado explícito e rastreável. |
| `cobertura_colecoes` | coleções `adicionais` presentes ÷ 5 | Deve ser `100%` (5/5). O schema atual não expressa pesquisa/ausência da coleção; esta lacuna exige decisão de contrato futura. |
| `cobertura_confirmada` | campos `confirmado` ÷ campos aplicáveis | É métrica de qualidade, não requisito de 100%; não pode ser inflada por default ou inferência. |

Para uma variável condicional, `nao_aplicavel` somente conta como resolução quando a regra de incompatibilidade e o contexto da configuração estiverem registrados. `nao_encontrado` somente conta após a consulta às fontes mínimas previstas para a classe do campo. O catálogo detalhará a evidência mínima por família; onde ela ainda não puder ser determinada, o campo será sinalizado como decisão pendente, e não considerado automaticamente pesquisado.

### Política de defaults e estados

1. Não haverá valor técnico, booleano, lista, texto comercial ou unidade como default de ficha. Um campo só recebe `valor` quando há evidência compatível com a configuração exata.
2. O default estrutural para um campo ainda não pesquisado é **ausência de valor**, nunca `false`, `0`, `"N/A"`, array vazia ou valor de outra versão. Ao finalizar uma coleta sem evidência suficiente, o estado é `nao_encontrado`, `valor: null` e `obs_ref: NF1`.
3. `nao_aplicavel` exige uma regra de incompatibilidade listada no catálogo e contexto de configuração comprovado; não pode ser usado para encobrir lacuna de busca. O schema atual não armazena a razão de aplicabilidade por campo, que será registrada como lacuna contratual, não corrigida nesta P0.
4. `confirmado` exige `valor` e `fonte_ref`; `parcial` e `inferido_minimamente` exigem `valor`, `fonte_ref` e observação. `conflitante` mantém `valor: null`, múltiplas fontes e observação CF1. Nenhum desses estados pode ser promovido por um default.
5. **`a confirmar` não será um sétimo status nesta P0.** A proposta é usá-lo somente como rótulo de interface/documentação para um valor `parcial` que ainda precisa de confirmação; `inferido_minimamente` permanece explicitamente inferido. Se o produto precisar distinguir esses dois conceitos em dados e API, isso exige nova task de contrato, schema, prompt, UI, persistência e migração.
6. `valor_original` continua reservado à conversão determinística já permitida pela P1-003; ele não é fonte, não é default e não autoriza equivalência entre versões.

### Fluxo da pessoa usuária, do agente e da qualidade

1. A pessoa informa marca, modelo, versão, ano-modelo e mercado; a identidade continua sendo invariante da ficha.
2. O agente consulta fontes permitidas para a configuração exata, sem copiar dado de modelo semelhante, outro ano, outro mercado ou pacote.
3. Para cada campo, aplica o catálogo: identifica a classe, os discriminadores exigidos, a fonte mínima e se há uma unidade/fórmula aprovada.
4. Com evidência: devolve valor, status adequado e `fonte_ref`. Sem evidência após a pesquisa mínima: devolve ausência explícita. Com incompatibilidade comprovada: devolve `nao_aplicavel`. Com divergência: devolve `conflitante` sem escolher vencedor automático. Nenhum caminho pode ser omitido.
5. A P1-003 normaliza somente as quatro medidas autorizadas e preserva o valor observado; AJV, identidade e `fonte_ref` validam a resposta.
6. A leitura, catálogo futuro, comparação, exportação e reporte mostram estado, fonte, contexto e versão; nenhum consumidor interpreta ausência como zero, falso, não aplicável ou equivalência.

### Impacto técnico e organização da informação

- Artefatos propostos para a execução desta P0: `docs/product/catalogo-variaveis-ficha-tecnica.md`, com as 204 linhas, glossário de classes/estados, matriz de defaults, indicadores de cobertura e apêndice de casos de decisão; e `docs/product/decisoes-racionalizacao-variaveis.md`, com alternativas e recomendação para os campos especializados. Serão documentos de governança, não assets carregados pelo runtime.
- Evidências a confrontar: `schema.json`, `base-agent-prompt.txt`, `mock-response.json`, `normalization-policy.json`, `source-policy.json`, `runtime-assets.ts`, `prompt-builder.ts`, `validator.ts`, `normalizer.ts`, fixtures e documentos em `docs/product/`.
- Inconsistências já detectadas para registrar: a documentação de fluxo ainda descreve apenas prompt/schema entre os assets iniciais, embora o runtime atual também carregue políticas de fonte e normalização; a documentação histórica não distingue os 204 caminhos obrigatórios dos 199 campos com status; e o schema não codifica a razão de `nao_aplicavel` nem a aplicabilidade por configuração.
- Persistência atual deve conservar payload e hash de schema. Esta P0 não migra dados nem recalcula fichas; qualquer catálogo usado como contrato ativo precisará de versão explícita e plano de compatibilidade posterior.

### Revisão de segurança proporcional

Data: `2026-09-08`

#### Escopo e gatilhos

- Mudança proposta: governar defaults, estados e aplicabilidade de dados produzidos por IA e exibidos em ficha técnica.
- Gatilhos: IA que consome fontes externas, schema/prompt futuros e persistência de dados de ficha.
- Não há novo provider, dependência, segredo, endpoint, tráfego de dados ou ferramenta externa nesta P0.

#### Fronteiras e riscos

- Fronteira: resposta de LLM e fontes externas passam pelo contrato da ficha e podem ser usadas por leitura, comparação ou exportação futuros.
- Cenário de falha principal: valor padrão ou regra de UI ser interpretado como especificação confirmada, `nao_aplicavel` mascarar ausência, ou um campo condicional desaparecer da ficha; isso induz decisão incorreta e pode se propagar para catálogo, comparação e exportação.
- Controles: inventário individual 204/204, cobertura estrutural/resolvida explícita, ausência como padrão seguro, proveniência obrigatória, classificação de aplicabilidade, regras versionadas de normalização, revisão humana para lacunas e nenhuma chamada a provider real.

#### Verificação planejada

- Validar o catálogo contra todos os `required` do schema e falhar se faltar ou sobrar caminho.
- Revisar fixtures de confirmado, ausente, não aplicável, conflitante, opcional e fonte incompatível sem enviar dados para a rede.
- Quando houver mudança de contrato futura: AJV, `fonte_ref`, typecheck, build e smoke simulated, além de avaliação de migração/persistência.

#### Risco residual, bloqueios e próximo passo

- Risco residual: sem um discriminador completo de configuração, alguns campos permanecem `condicional` e não podem ser marcados `nao_aplicavel` automaticamente. Lucas é o responsável por aceitar ou ajustar esse trade-off.
- Bloqueio de implementação: nenhum técnico; o Architecture Gate ainda requer aprovação explícita de Lucas.
- Próximo passo: aprovar esta arquitetura para produzir o catálogo auditável e a matriz de defaults; mudanças no contrato ou no prompt continuam fora desta P0.

### Plano incremental e reversibilidade

1. Extrair os 204 caminhos do schema e validar a cobertura do catálogo por script local, sem tocar no runtime.
2. Classificar cada campo, seus discriminadores, unidade, genericidade e regra segura de ausência; registrar consumidores e inconsistências.
3. Produzir o dossiê de racionalização com alternativas e recomendações para os campos especializados, sem alterar o contrato.
4. Acrescentar matriz de defaults, semântica dos seis estados, indicadores de cobertura de 100% e casos de decisão/fixture propostos.
5. Atualizar backlog e fluxograma somente nas partes que descrevem comportamento já comprovado ou a política de governança entregue, mantendo distinção entre atual e planejado.
6. Revisar links, ausência de segredos e cobertura 204/204 e 199/199 de campos de status; executar checks de documentação. Não haverá provider real, banco, migration ou backfill.
7. Reverter removendo somente o catálogo/documentação da P0; não haverá payload, schema ou banco alterado por esta tarefa.

### Double-check da arquitetura

- Confirmado: o schema canônico tem 14 grupos e 204 caminhos `required`; o mock atual tem 199 estados `nao_encontrado` e cinco coleções de adicionais, e não deve fornecer defaults técnicos.
- Confirmado: AJV e `fonte_ref` continuam após normalização; P1-003 só transforma unidades allowlisted e não deve expandir o escopo desta P0.
- Confirmado: fonte é hoje governada por marca/mercado e não resolve aplicabilidade por versão/pacote; portanto, inferir `nao_aplicavel` de silêncio da fonte seria inseguro.
- Confirmado: o schema já exige todos os caminhos, mas não distingue cobertura estrutural de pesquisa resolvida, e não contém política de genericidade/aplicabilidade por campo.
- Estados revisados: dado confirmado, parcial/a confirmar, inferido, ausente, não aplicável comprovado, conflito, unidade ambígua, opcional não documentado e fonte fora da política.
- Conclusão: arquitetura `READY`. O desenho traz a racionalização das variáveis para decisão humana e exige 100% de presença/resolução por ficha, sem prometer que uma tabela documental já altere a resposta do agente. Aguarda aprovação explícita de Lucas.

## Resultado do agente

_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — Lucas autorizou em 08/09/2026`; política de catálogo documental por campo, sem alteração de runtime nesta P0.
- Triagem automática: `Material — a revisão organiza um contrato de governança que pode orientar schema, prompt, validação, persistência e contratos consumidores; requer Architecture Gate antes de implementar.`
- Segurança: `Aplicável — revisão proporcional registrada nesta task; fronteira LLM/fontes → ficha técnica, com controles de ausência, aplicabilidade e proveniência.`
- Implementação: entregue somente a governança documental e sua verificação local; schema, prompt, provider, endpoint, banco, UI e persistência permaneceram inalterados.
- Arquivos alterados: esta task; `docs/product/catalogo-variaveis-ficha-tecnica.md`; `docs/product/decisoes-racionalizacao-variaveis.md`; `scripts/verify-technical-sheet-catalog.ts`; `package.json`.
- Verificação: `npm run verify:technical-sheet-catalog` passou com `fields=204`; `npm run typecheck` e `npm run build` passaram; `git diff --check` passou. O build foi executado fora do sandbox por exigir leitura de `vite.config.ts`. Nenhum provider real, banco ou dado externo foi acessado.
- Próximo passo: Lucas decidir as cinco racionalizações propostas. Qualquer remoção/fusão de campo, novo status, uso do catálogo pelo agente, mudança de schema/prompt ou migração deve entrar em nova task com Architecture Gate próprio.
