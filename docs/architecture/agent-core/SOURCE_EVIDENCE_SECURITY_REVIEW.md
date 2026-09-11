# Revisão de segurança — evidência de fontes web

Data: 2026-09-09

## Decisão

A pesquisa permanece aberta por padrão. Conteúdo e URLs retornados pelo provider são dados não confiáveis e não têm autoridade sobre prompt, schema, políticas ou ações do servidor.

## Controles implementados

- A fonte final é correlacionada com citação observada na mesma execução.
- Avaliação de aderência e metadados de observação são recalculados pelo servidor; valores equivalentes emitidos pelo modelo são descartados.
- O trecho usado para análise é sanitizado, limitado e mantido somente em memória; o contrato público recebe título, instante, fingerprint e contexto mínimo.
- Links da interface exigem HTTPS e usam `rel="noreferrer"`.
- O probe HTTP direto foi removido; a API não segue redirects nem busca URLs arbitrárias para revalidá-las.
- Fonte insegura ou não observada é isolada quando existe evidência utilizável restante; campos sem referência restante são rebaixados em vez de causar bloqueio por política local.
- Fonte explicitamente divergente do veículo alvo é isolada antes da resposta pública. Ela pode orientar a rejeição interna durante a execução, mas não é exibida nem pode sustentar campo; fontes ambíguas também não são publicadas como evidência final.
- Logs recebem configuração efetiva não sensível. Chaves, headers e `.env` não são registrados por essa camada.
- Quando não há política oficial nem âncora aprendida, a descoberta de presença por marca/mercado tem orçamento próprio e limitado. Ela aceita apenas host HTTPS público que carrega a marca como pista transitória; não rotula o host como oficial, não o publica e não o persiste. Aprendizado exige depois uma citação observada de documento exato para o veículo.
- A telemetria dessa etapa contém somente estado e contagens agregadas de citações e hosts candidatos; URL, hostname, título e conteúdo continuam fora do evento sanitizado.
- Para Gemini/OpenRouter, após uma resposta somente de ferramenta, a tentativa de finalização seguinte não recebe ferramentas. Isso limita loops sem aceitar JSON sem evidência: a validação de fonte observada continua obrigatória.
- A telemetria de cada passe OpenRouter guarda somente contadores e estados terminal allowlisted; descarta campos inesperados, URL, hostname, título, texto e payload do provider.
- A autoridade final é server-owned: somente primeira parte configurada/aprendida/promovida por documento aderente e parceiros allowlisted podem permanecer. Um tipo de fonte declarado pelo modelo nunca aprova um hostname externo.
- O caçador documental usa duas buscas do provider restritas ao domínio candidato; a API não abre a página, não segue links e não faz fetch direto. Domínios abreviados são candidatos transitórios e precisam de documento exato antes da promoção no pedido.
- Motivos de rejeição documental chegam ao evento sanitizado somente como chaves enumeradas e contagens. URL, hostname, consulta, título e trecho não entram nessa telemetria.
- Evidência herdada entre etapas é limitada a `exata` ou `compativel`, deduplicada por URL normalizada e mantida somente durante a execução. Trechos observados não são injetados no prompt de síntese.
- O quick pesquisa somente primeira parte quando ela foi estabelecida; o refine pode acrescentar apenas parceiros da allowlist. A ferramenta continua obrigatória na primeira rodada mesmo quando já existe evidência herdada.
- A telemetria do passe separa evidência herdada, fontes isoladas por autoridade e fontes isoladas por aderência, sempre como contagens inteiras allowlisted.

## Risco residual

A avaliação determinística detecta contradições explícitas, mas não garante compreensão semântica perfeita. A promoção transitória de um domínio abreviado reduz trabalho manual, porém não comprova juridicamente propriedade corporativa; ela depende da combinação de presença de marca/mercado e documento exato, e deve continuar sujeita à revisão humana. Páginas dinâmicas podem mudar depois da geração; título observado, instante e SHA-256 reduzem esse risco. Validação com provider real exige autorização explícita separada.

## Adendo — leitor determinístico de documentos

Data: 2026-09-10. Gatilhos: integração HTTP externa, parsing de conteúdo não confiável, IA com conteúdo externo e nova dependência. Compliance adicional: não aplicável nesta etapa, pois o fluxo trata documentos automotivos públicos e não introduz dados pessoais, cookies, analytics ou retenção nova.

Fronteira de confiança: somente URL HTTPS já observada, aderente e pertencente a domínio promovido como primeira parte entra no leitor. Redirects repetem toda a validação. O socket usa a resolução pública previamente validada, reduzindo rebinding entre verificação e conexão. Downloads têm timeout, tamanho máximo, MIME permitido e validação `%PDF-`; erros degradam a leitura sem liberar a URL para outro domínio.

Dependência: `pdf-parse@2.4.5`, origem npm/GitHub `mehmet-kozan/pdf-parse`, licença Apache-2.0, versão exata no `package-lock.json`, com `pdfjs-dist` transitivo. Permissões: CPU/memória local sobre `Buffer`; o BlindSpot não usa a capacidade de rede da biblioteca. Tráfego: somente o downloader nativo controlado acessa o documento. Reversão: remover módulo, chamada, asset e dependência.

Checks executados: Node 22 compatível; fixture PDF extrai texto por página; HTML remove script/style; IPs loopback, privados e metadata são bloqueados; telemetria descarta URL/texto; typecheck e contratos locais. `npm audit` não reportou vulnerabilidade em `pdf-parse`; permaneceram oito achados fora deste caminho em Vite, Express/qs e Drizzle/esbuild, sem correção automática nesta mudança.

Risco residual: documentos com texto deliberadamente adversarial ainda chegam ao modelo como dados. O prompt os delimita como evidência sem autoridade, mas isso não elimina todo risco semântico. PDFs escaneados sem camada textual não têm OCR nesta versão. Lucas é o responsável pela aceitação do risco residual e pela validação live.

### Complemento de transporte — parser PDF isolado no OpenRouter

O 403 observado nos CDNs oficiais é tratado sem falsificar cabeçalhos de navegador nem contornar controle de acesso. O documento público passa por uma chamada isolada do plugin `file-parser` antes da síntese. O engine canônico é `cloudflare-ai`, que produz `file_annotations`; `native` não é aceito nesse estágio porque não fornece a prova estruturada de parsing exigida. O caminho pago `mistral-ocr` permanece desabilitado por padrão.

Controles: a URL precisa ter sido observada e classificada `exata`/`compativel`; deve ser HTTPS, terminar em `.pdf` e pertencer ao domínio de primeira parte calculado; somente um documento é enviado por chamada; arquivo lido localmente é excluído; o nome enviado é neutro; imagens/base64 retornadas são descartadas; texto é truncado pelos limites da política e marcado como conteúdo externo não confiável. Quick/refine não recebem anexos. Erros de autenticação, crédito e rate limit (401, 402 e 429) não são degradados para uma geração sem documento.

Quando um PDF oficial elegível existe, mas nenhuma camada produz texto, HTTP 424 impede a validação e a persistência de uma ficha vazia. Logs agregados recebem somente tentativas, parses, rejeições, motivos enumerados e último status HTTP; não recebem URL, hash do provider, anotação ou texto. Riscos residuais: o OpenRouter ainda pode negar a URL pública e o modelo ainda interpreta conteúdo externo adversarial, embora delimitado. Reversão: desativar `provider_parser_enabled` e o gate `fail_when_official_pdf_unreadable`, aceitando explicitamente a volta da degradação silenciosa.

Adendo de observabilidade: erros AJV usam somente caminhos JSON Pointer sanitizados e keywords enumeradas, com limites de quantidade e comprimento. Não são persistidos valor inválido, nome de propriedade adicional controlado pelo provider, texto, URL, prompt ou resposta. O risco residual é a exposição de nomes de campos do schema, considerados metadados técnicos necessários ao diagnóstico e já presentes no contrato público da aplicação.
