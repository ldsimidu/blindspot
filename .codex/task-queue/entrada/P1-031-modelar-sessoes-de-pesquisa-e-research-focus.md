# ❌ Pendente — Modelar Research Sessions e Research Focus estruturado

> Prioridade: P1
>
> Área afetada: dados, API, runtime de IA e auditoria
>
> Origem ou referência: P1-029 e proposta, seções 13 a 23
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — cria contrato de API, persistência e orientação de IA.`
>
> Segurança: `Aplicável — endpoint, instrução livre, orçamento e integração com provider.`

## Pedido

Adicionar sessões de pesquisa rastreáveis a uma ficha, com foco estruturado e instrução complementar limitada. A primeira versão deve oferecer presets: `GENERAL`, `MISSING_VARIABLES`, `OFFICIAL_SOURCES`, `CONFLICT_RESOLUTION`, `LOW_CONFIDENCE`, `VALIDATE_EXISTING`, `CATEGORY` e `VARIABLES`.

## Critérios de aceite

- [ ] Uma sessão registra ficha/revisão-base, foco estruturado, alvos resolvidos no servidor, política de fontes, orçamento, versão de runtime e estados de execução.
- [ ] A instrução livre é opcional, limitada, sanitizada e não consegue relaxar schema, política de fonte, autorização ou orçamento.
- [ ] O endpoint cria operação idempotente e retorna apenas identificador/estado sanitizado; ator e organização derivam da sessão autenticada.
- [ ] Focos `MISSING_VARIABLES` e `CONFLICT_RESOLUTION` recebem somente os campos elegíveis, não uma lista genérica de toda a ficha.
- [ ] Falha, cancelamento e resultado parcial deixam trilha auditável sem publicar revisão incompleta como confirmada.

## Restrições ou contexto

- Depende de P1-030 e de P1-011/P1-013 para expor operação autenticada ao produto; pode preparar serviço interno antes disso se o Gate permitir.
- Reutilizar políticas canônicas em `packages/agent-runtime/assets/`; não transformar texto de usuário em instrução de sistema.
- Não executar provider real no desenvolvimento/verificação sem ambiente e autorização específicos.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — IA com foco, endpoint e persistência.`
- Segurança: `Aplicável — input não confiável, custo, autorização e logs sanitizados.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar dependências e Architecture Gate próprio.
