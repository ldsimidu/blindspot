# Revisão de segurança — pesquisa tolerante e orientada por lacunas

Data: `2026-09-10`

Atualização: `2026-09-11` — bootstrap de presença institucional limitado a uma URL observada por execução, HTTPS e host candidato; promoção somente após conteúdo concluído confirmar marca e mercado. Sem promoção persistente a partir de snippet.

## Escopo e gatilhos

- Mudança: composição da pesquisa web por IA, classificação do nível de observação de URLs, leitura documental opcional, `openrouter:web_fetch` limitado a primeira parte e planejamento server-owned de consultas por lacunas.
- Gatilhos: IA com ferramenta web, integração OpenRouter/Claude, conteúdo externo não confiável e alteração futura de metadados do contrato público.
- Privacidade/compliance adicional: não aplicável neste incremento; trata dados públicos de veículos, sem nova coleta pessoal, upload ou retenção documental.

## Fronteiras e riscos

- Dados, segredos e integrações: identidade pública do veículo, URLs e conteúdo público passam pelos provedores já configurados; credenciais permanecem somente no ambiente do servidor.
- Falha principal: resultado de busca, página de terceiro ou instrução contida em documento ser promovida a fonte oficial/evidência; outra falha é o planner gerar consultas arbitrárias ou custo descontrolado.
- Controles: estados distintos de URL; autoridade/aderência server-owned; aliases e caminhos versionados; orçamento por estágio; fetch somente para URL previamente observada e host de primeira parte; `allowed_domains`, `blocked_domains`, máximo de usos/conteúdo/tool calls; leitura HTTPS/host/DNS/MIME/tamanho/timeout limitada; telemetria sanitizada; fonte não aprovada apenas como pista.

## Verificação planejada ou executada

- Leitura dos assets canônicos e do fluxo atual: executada em modo somente leitura; confirmou política de capacidade, leitor opcional e aderência aceita `exata`/`compativel`.
- Revisão do Prompt Mestre externo: executada como conteúdo não confiável; nenhuma instrução, schema ou score foi copiado automaticamente para o runtime.
- Testes de snippet versus conteúdo aberto: planejados; fixture deve provar que snippet isolado não confirma campo.
- Testes do planner: planejados; determinismo, aliases permitidos, orçamento e ausência de termos vindos do conteúdo web.
- Testes de autoridade: planejados; domínio parecido com marca, concessionária e fonte global sem compatibilidade não podem confirmar campo.
- Fixtures de fetch: planejadas; retorno concluído, falho, URL fora do inventário, redirect incompatível, excesso de conteúdo e ausência de suporte textual à alegação.
- Provider real: bloqueado até aprovação da arquitetura e autorização de geração manual.

## Achados, exceções e risco residual

- A proposta externa delega classificação, confiança e resolução ao modelo: risco alto de falsa precisão e promoção indevida; mitigado mantendo essas decisões no servidor.
- Busca por cada campo individual pode multiplicar custo/turnos: mitigado por grupos de capacidade e condição de parada por campo.
- URL oficial inacessível pode permanecer visível como apontador: risco de interpretação como prova; a UI deve rotular explicitamente que não foi lida e separá-la das fontes utilizadas.
- A lista atual de parceiros é uma decisão de governança: eventual ampliação exige revisão humana separada. Responsável pelo risco residual: Lucas.
- O server tool aceita limites que o request atual não envia integralmente (`max_uses` e `max_tool_calls`): risco de chamadas acima da intenção local; corrigir no primeiro incremento.
- O bootstrap atual pode acumular confiança a partir de trechos de busca repetidos: exigir diversidade ou conteúdo obtido antes de promover domínio aprendido.
- `openrouter:web_fetch` foi incluído por decisão de arquitetura. É beta e acrescenta superfície de integração e consumo de tokens; o risco é limitado por estágio dedicado, primeira parte já elegível, teto de usos/conteúdo/tool calls e degradação sem confirmação quando a rastreabilidade não puder ser provada.
- Mesmo sem novo fornecedor, cada pesquisa direcionada pode aumentar o custo já existente do OpenRouter; o aceite exige teto de chamadas/resultados/tools e telemetria agregada por estágio.

## Bloqueios e próximo passo

- Architecture Gate permanece `READY`: implementar somente após aprovação explícita.
- Após aprovação, executar verificadores offline e só então uma geração live controlada; sem ativar OCR pago ou novo provedor.
