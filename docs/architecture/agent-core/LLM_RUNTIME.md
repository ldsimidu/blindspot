# Execução do LLM (lógica adicional)

Origem: `services/api/llm.ts`.

## Variável `LLM_PROVIDER`

- **`simulated`** (padrão se ausente): não chama API externa.
  - Lê `mock-response.json` de `packages/agent-runtime/assets/` pelo resolvedor `services/api/runtime-assets.ts`.
  - Faz parse JSON, clona o objeto, injeta dados do `VehicleInput` em `veiculo_alvo` e em campos de identificação em `ficha_tecnica` (marca, modelo, versão, ano_modelo, mercado) ajustando `valor`, `status`, `fonte_ref`, etc.

- **`claude`**: chama `https://api.anthropic.com/v1/messages`.

## Claude — requisitos e opções

- **API key**: `ANTHROPIC_API_KEY` (obrigatória para Claude).
- **Modelo**: `CLAUDE_MODEL` (padrão `claude-sonnet-4-5`).
- **Ferramenta web**: `CLAUDE_WEB_SEARCH_TOOL_TYPE` (padrão `web_search_20250305`), `name: "web_search"`.
- **Limites**: `CLAUDE_MAX_TOKENS` (padrão 16384), `CLAUDE_WEB_SEARCH_MAX_USES` (padrão 3), `CLAUDE_MAX_TURNS` (padrão 6).
- **Beta header opcional**: `CLAUDE_BETA_HEADER` → header `anthropic-beta`.
- **Domínios**: `CLAUDE_ALLOWED_DOMAINS` **ou** `CLAUDE_BLOCKED_DOMAINS` (CSV), nunca ambos — senão erro 500.
- **Fallback**: se `LLM_FALLBACK_TO_MOCK=true` e a chamada Claude falhar, usa o fluxo simulado.

## System prompt (Claude), fixo no código

Texto único (inglês), resumindo: agente automotivo; seguir `BASE_AGENT_PROMPT`; usar web search; priorizar fontes confiáveis e oficiais; retornar só JSON válido conforme `OUTPUT_SCHEMA_JSON`; sem comentário, planejamento ou cercas markdown.

## Mensagens

- Primeira mensagem **user**: o `finalPrompt` completo (como descrito em `PROMPT_COMPOSITION.md`).

## Tratamento de `stop_reason`

- **`pause_turn`**: empilha assistant + user `"Continue. Return only valid JSON according to OUTPUT_SCHEMA_JSON."`
- **`max_tokens`**: continua pedindo o **JSON completo** do início ao fim, sem markdown nem texto extra.
- Caso contrário: extrai blocos `type === "text"`, junta em string; faz parse JSON (aceita JSON puro ou JSON dentro de um fenced code block rotulado como json).

## Localização da busca (ferramenta web)

`user_location` é derivado de `mercado` (string): heurística para Brasil (`BR`, São Paulo TZ) ou EUA (`US`, New York TZ); default Brasil.

## Logs

Execuções Claude podem ser persistidas em `var/logs/` (hash SHA-256 do prompt, preview, turns, resultado, erro). Falha ao logar apenas gera `console.warn`.

## OpenRouter e roteamento por qualidade

O provider `openrouter` usa web search aberta quando `OPENROUTER_ALLOWED_DOMAINS` está ausente ou vazia. Allowlist e blocklist continuam opcionais e mutuamente exclusivas. O quick usa até cinco resultados por padrão; o refine usa o orçamento completo configurado.

O refine recebe as lacunas agrupadas por `research-capability-policy.json`, um asset neutro em relação à marca e ao veículo. As capacidades descrevem materiais alternativos adequados a cada grupo do schema; não forçam PDF, catálogo ou domínio específico.

Quando não há domínio oficial configurado nem âncora aprendida para uma marca/mercado, OpenRouter executa antes do quick uma descoberta institucional curta e separada. Ela recebe somente marca e mercado — não o modelo — e usa o orçamento versionado em `research-document-policy.json` (por padrão, uma busca, até cinco resultados e 1.200 tokens). Somente hosts HTTPS públicos que carregam o nome normalizado da marca podem orientar a próxima etapa; são `candidato_de_marca_observado`, nunca confirmação automática de propriedade, selo oficial ou fonte publicável.

Esses hosts são rotas transitórias para uma busca documental do veículo exato, limitada aos próprios domínios. Um host só entra no aprendizado persistente após uma citação observada de documento exato para o alvo; a descoberta institucional isolada não é persistida. Assim, a rota serve BYD, Honda e outras marcas sem cadastro manual por marca, mas não amplia a lista de fontes aprovadas nem substitui a avaliação server-side de aderência.

A descoberta do veículo segue então uma rota explícita: ficha técnica do veículo exato, catálogo/brochura equivalente e, só então, configurador, manual e serviços. A rota é montada exclusivamente a partir de marca, modelo, versão, ano-modelo e mercado do payload. URLs ou títulos que nomeiem explicitamente outro ano-modelo não entram no inventário de síntese. Na resposta final, fontes ambíguas, divergentes ou não verificadas são isoladas; somente fontes `exata` ou `compativel` podem permanecer em `fontes_utilizadas` e sustentar campos.

Após a descoberta, quando `OPENROUTER_ACQUISITION_ENABLED` não está desativada, há uma chamada distinta de aquisição documental. Ela não preenche o schema: busca ficha técnica, catálogo/brochura, documento técnico/manual e configurador para o alvo exato. O servidor avalia as citações observadas e injeta no quick apenas o inventário `exata`/`compativel`. Os limites independentes são `OPENROUTER_ACQUISITION_MAX_TOKENS`, `OPENROUTER_ACQUISITION_WEB_SEARCH_MAX_USES`, `OPENROUTER_ACQUISITION_WEB_SEARCH_MAX_RESULTS` e `OPENROUTER_ACQUISITION_WEB_SEARCH_MAX_TOTAL_RESULTS`.

Quick e refine são combinados por campo, não por substituição integral da ficha. Um campo do passe anterior é preservado quando o candidato não oferece status/evidência superior; as fontes elegíveis são unificadas e seus IDs são remapeados para evitar colisões.

Os logs sanitizados registram, por passe, a qualidade antes da publicação: fontes exatas/compatíveis e contagens isoladas de fontes ambíguas, divergentes ou não verificadas. Esses diagnósticos continuam disponíveis ao roteador mesmo quando as URLs isoladas não aparecem no resultado público.

Os identificadores do pedido são aplicados pelo validador depois da resposta do provider como `informado_na_entrada`. Eles não dependem de fontes web e não entram no denominador de cobertura pesquisada.

O roteador considera `coverageRate`, `groundedCoverageRate`, `criticalGroundedCoverageRate`, contagens de fontes exatas/compatíveis/ambíguas/divergentes e campos rebaixados por divergência. `OPENROUTER_QUALITY_ROUTER_ENABLED=false` desliga temporariamente apenas os novos limiares; não restaura whitelist implícita nem o probe HTTP removido.

Limiares opcionais: `OPENROUTER_ROUTER_MIN_GROUNDED_COVERAGE` (padrão 0,65) e `OPENROUTER_ROUTER_MIN_CRITICAL_GROUNDED_COVERAGE` (padrão 0,8). Claude possui equivalentes prefixados por `CLAUDE_`.

`OPENROUTER_REQUIRE_OBSERVED_SOURCE_MATCH` e `CLAUDE_REQUIRE_OBSERVED_SOURCE_MATCH` passam a ser verdadeiros por padrão. Quando há evidência observada, URLs finais não observadas, não HTTPS ou proibidas por restrição explícita são isoladas sem executar fetch adicional.

Os logs incluem budgets, modo de domínio, contagens de domínios, flags de busca/observação e decisões/métricas do roteador. Não incluem API key, headers ou conteúdo de `.env`. O contador reconhece a forma aninhada `url_citation.url_citation.url`, evitando classificar essas execuções como `sem-web-search`.

`llm_execution` descreve somente o estágio do provider — budgets, modo, passes e desfecho — e não publica resultado estrutural pré-validação. Depois de `validateResponse`, o endpoint emite `validated_technical_sheet_result` com `result_summary`: completude declarada, estados por grupo, fontes finais por aderência e cardinalidades de uso de fontes. Quando a política de fontes está disponível, ele agrega fontes/campos por classe `official`, `partner` e `other`; `official` exige tipo presente na política server-owned e avaliação `na_lista_aprovada` já aplicada à resposta validada. Valores de variáveis, IDs de referência, URLs, hostnames, títulos, tipos declarados, trechos de evidência, prompt e resposta bruta não entram nesse resumo. Assim, uma auditoria posterior compara a ficha efetivamente publicada, não o candidato cru do provider.

## Architecture Gate — finalização OpenRouter/Gemini (2026-09-10)

**Status: APPROVED.** A alteração atende operadores que recebem erro de limite de turnos em modelos Gemini que retornam apenas `tool_calls` antes do JSON final. O escopo é o passe OpenRouter e a telemetria sanitizada; não altera schema, prompt, política de fontes, persistência, endpoint, provider configurado ou o `.env` real.

Quando um Gemini devolve uma rodada sem texto com `finish_reason: tool_calls`, a rodada seguinte do mesmo passe não recebe a ferramenta web nem `tool_choice`. Ela recebe somente a instrução de finalizar o JSON usando a evidência já coletada. A resposta continua sujeita à exigência de busca/evidência observada: uma ficha sem evidência não é aceita só para evitar o erro.

O evento sanitizado passa a expor apenas por passe: quantidade de requests, rodadas de ferramenta obrigatória, rodadas somente de ferramenta, rodadas de finalização sem ferramenta, número de fontes observadas e estado terminal enumerado. Não registra URL, hostname, título, texto, resposta do provider, prompt, token, header ou segredo.

Double-check: o modo sem ferramenta só é acionado pelo guard Gemini e depois de `tool_calls` sem texto; Claude não é afetado. O limite de custo do passe não aumenta no runtime. A documentação de ambiente recomenda duas rodadas no quick para permitir busca seguida de JSON, mas não altera nenhum ambiente existente. A validação live continua dependente de geração manual autorizada.

## Architecture Gate — caçador oficial genérico (2026-09-10)

**Status: APPROVED.** Lucas aprovou a implementação após o diagnóstico da geração BYD King que encontrou fontes aderentes, porém não oficiais. O escopo é OpenRouter, classificação de autoridade server-owned, isolamento de fontes externas não aprovadas e telemetria agregada; não altera endpoint público, schema da ficha, provider configurado, segredo ou `.env` real.

Autoridade do domínio e aderência do documento são eixos separados. Uma presença institucional observada pode criar uma rota temporária mesmo quando a marca usa domínio abreviado, mas não é fonte oficial por si. O caçador faz buscas restritas ao domínio em dois modos independentes: primeiro a página do veículo e seus links internos de ficha, catálogo, manual ou PDF; depois o arquivo anual com marca, modelo, versão, ano e mercado. Apenas documento `exata` ou `compativel` promove o host como primeira parte durante aquela execução.

Quick e refine recebem essa lista calculada pelo servidor. Antes da auditoria de aderência, fontes são reduzidas a: domínios de primeira parte configurados/aprendidos/promovidos no pedido, ou domínios parceiros e tipos parceiros presentes na política. O tipo declarado pelo modelo não promove host; em primeira parte, o servidor normaliza o tipo para site ou documento oficial. Uma fonte como CarsNaWeb, ausente da allowlist, é isolada e os campos que dependiam apenas dela voltam a `nao_encontrado`.

Double-check: não há fetch direto, redirect ou resolução de URL pelo servidor; a navegação continua dentro da ferramenta do provider e dos domínios candidatos. Domínio abreviado exige duas provas independentes — presença de marca/mercado e documento exato — e nunca é persistido pela primeira prova. A validação live continua manual e será auditada pelas contagens sanitizadas.

### Correção do handoff entre caça e extração

**Status: APPROVED.** Após a primeira validação manual do caçador retornar zero variáveis apesar de dois documentos elegíveis, Lucas autorizou corrigir o handoff. A causa era o escopo por passe: o inventário levava URL e título ao quick, mas a correlação de fonte começava novamente sem as evidências já aprovadas na mesma execução.

Agora somente citações `exata` ou `compativel` das etapas documental e de aquisição são herdadas. O primeiro passe continua obrigado a pesquisar, mas sua ferramenta fica limitada aos domínios de primeira parte calculados para o pedido; quando não há primeira parte, usa somente parceiros aprovados. O refine usa a união de primeira parte e parceiros aprovados. Evidências novas são deduplicadas e acumuladas entre passes.

A correlação continua exigindo URL observada na execução e domínio permitido. O handoff não injeta trecho de página no prompt, não autoriza fonte ambígua/divergente e não executa fetch direto. A telemetria registra separadamente contagem herdada, fontes removidas por autoridade e fontes removidas por aderência.

## Architecture Gate — leitor determinístico de documentos (2026-09-10)

**Status: APPROVED.** Após a segunda geração manual retornar zero variáveis mesmo com evidência herdada, Lucas aprovou substituir a redescoberta do PDF por aquisição e leitura server-side. O endpoint e o schema público permanecem iguais; mudam a integração HTTP, a composição interna do prompt e a dependência de parsing.

Fluxo: o caçador observa a URL; a aderência server-owned aceita somente `exata`/`compativel`; o domínio precisa estar promovido como primeira parte no pedido; o leitor baixa no máximo dois documentos; PDF ou HTML é convertido em texto limitado e organizado por página; o pacote entra no prompt como conteúdo externo não confiável; quick e refine continuam sujeitos às mesmas políticas de fonte e identidade.

Ausência/erro é degradável: documento indisponível, grande, sem MIME permitido, sem texto ou bloqueado pela proteção de rede não interrompe a ficha; apenas não produz pacote. A telemetria guarda estado e contagens de tentativas, downloads, parses, rejeições, bytes e páginas — nunca URL ou texto.

Double-check: o downloader usa apenas HTTPS/443, sem credenciais, cookies ou proxy; valida e fixa resolução DNS pública no socket; rejeita IP privado, local, reservado ou de documentação; limita redirects e revalida cada destino contra o domínio promovido; aplica timeout, limite de bytes, MIME allowlisted e magic bytes de PDF. A validação live continua dependendo de nova geração manual.

### Aquisição isolada de PDF público pelo OpenRouter

Os testes de integração contra fichas oficiais da Ford e da BYD mostraram HTTP 403 no downloader local, apesar de as URLs terem sido observadas e aprovadas. Não há tentativa de simular navegador ou contornar o CDN. Um PDF elegível de primeira parte que não produz pacote local é enviado, sozinho, a uma chamada curta do plugin `file-parser`. O runtime aceita somente `file_annotations` estruturadas e converte seus blocos de texto em `DocumentEvidencePacket`; imagens base64 são descartadas.

O parser isolado usa `cloudflare-ai`. O engine `native` foi removido desse papel porque encaminha o arquivo ao modelo e não produz as anotações reutilizáveis exigidas pelo gate de evidência. `mistral-ocr` permanece permitido pelo tipo de política, mas não é o padrão e não deve ser habilitado sem decisão explícita de custo. Quick e refine recebem apenas texto limitado já adquirido, nunca a URL como anexo.

A aquisição não redescobre nem aprova URL. Ela aceita somente HTTPS, caminho `.pdf` e host igual/subdomínio de primeira parte calculado para o pedido. PDFs já lidos localmente não são enviados. Com `fail_when_official_pdf_unreadable=false` no asset canônico, um PDF elegível sem texto não encerra a síntese: ele não é usado como evidência de campo e a execução segue com as demais fontes. Falhas 401, 402 e 429 no parser continuam como erro de integração, sem retentativa disfarçada. A telemetria registra somente contagens, motivos enumerados e o último status HTTP.

### Architecture Gate — observabilidade do 422 e ciclo do anexo (2026-09-10)

**Status: APPROVED.** Após uma geração em que quick e refine produziram JSON parseável, mas o validador final respondeu 422, Lucas autorizou tornar a falha diagnosticável sem persistir o payload e impedir a repetição de um anexo já recusado.

Decisão: erros AJV expõem e registram somente até vinte pares `path + keyword`, derivados do schema canônico e sanitizados; valores, mensagens do documento, prompt e resposta bruta ficam fora do evento. A interface preserva os detalhes estruturados da API e apresenta até cinco caminhos ao operador. A regra histórica de remover anexos nos passes foi substituída pelo gate de aquisição isolada descrito acima; os passes de síntese não recebem arquivos.

Double-check: o schema não foi relaxado e nenhuma correção de valor foi inferida. Falhas de autenticação, crédito e rate limit continuam sem retentativa documental. O comportamento de fonte, identidade, persistência e endpoint permanece igual; a próxima geração manual deve revelar a regra exata antes de qualquer normalização adicional.

## Architecture Gate — prova de leitura antes da síntese (2026-09-10)

**Status: APPROVED.** Lucas pediu uma revisão crítica após sucessivas fichas com zero variáveis e autorizou a mudança caso necessária. A hipótese de apenas “isolar a mesma chamada” foi rejeitada: conforme o contrato atual do OpenRouter, `cloudflare-ai` e os caminhos não OCR continuam dependendo do fetch do próprio OpenRouter, portanto isolamento não garante acesso ao CDN. A decisão arquitetural é separar aquisição de síntese e exigir prova de leitura, não prometer um transporte infalível.

Fluxo vigente: descoberta e aderência server-owned; leitura local segura; parser OpenRouter isolado com `cloudflare-ai`; conversão exclusiva de `file_annotations` textuais para pacote limitado; somente então quick/refine. URL sem texto não entra como documento lido. A falha de todos os transportes gratuitos não bloqueia a geração; o fallback pago `mistral-ocr` permanece desabilitado até autorização explícita.

Double-check: nenhuma fonte nova ganha autoridade; imagens/base64 não chegam ao prompt; texto, URL e anotação não entram na telemetria agregada; um documento é enviado por chamada e os limites de texto/páginas continuam valendo na composição; quick/refine mantêm web search e validações atuais, mas não repetem download ou parsing. Rollback: desativar `provider_parser_enabled` e `fail_when_official_pdf_unreadable` no asset canônico, reconhecendo que isso restaura o risco de degradação silenciosa.

Alternativas avaliadas: repetir o mesmo anexo dentro do quick/refine foi rejeitado por misturar falha de transporte com falha de síntese; `native` foi rejeitado como prova de leitura por não devolver anotações; `openrouter:web_fetch` não foi colocado no caminho crítico por ser beta, depender de decisão de ferramenta do modelo e não oferecer o mesmo contrato de anotação; `mistral-ocr`, Exa, Parallel e Firecrawl ficaram fora do padrão por cobrança ou credencial adicional. Se a validação live mostrar `official_document_unreadable`, o próximo incremento deve ser um serviço de ingestão documental com transportes explicitamente autorizados e cache por hash, ou habilitação consciente de um desses provedores — não mais mudanças de prompt.
