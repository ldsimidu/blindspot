# ❌ Pendente — Orquestrar pesquisa direcionada e publicar revisões

> Prioridade: P1
>
> Área afetada: runtime de IA, API, persistência, custo e observabilidade
>
> Origem ou referência: P1-031; proposta, seções 18 a 25 e 45 a 48
>
> Arquitetura: `A avaliar`
>
> Triagem automática: `Material — altera execução de pesquisa e publicação de dados.`
>
> Segurança: `Aplicável — provider, orçamento, concorrência, persistência e telemetria.`

## Pedido

Implementar o Research Orchestrator V1 como módulo do monólito: ele transforma uma sessão em plano determinístico, executa uma rodada direcionada, revalida o resultado e cria uma nova revisão apenas ao finalizar com integridade.

## Critérios de aceite

- [ ] O plano explicita campos-alvo, motivo, política de fontes, limites de custo/tempo/tentativas e condição de parada.
- [ ] A execução mantém estados `queued`, `running`, `succeeded`, `partial`, `failed` e `cancelled`, com transições allowlisted.
- [ ] Duas sessões podem coexistir somente sob regra documentada; publicação detecta revisão-base desatualizada e nunca perde edição/revisão concorrente.
- [ ] Resultado sem evidência suficiente preserva `unknown`, `not_found`, `not_applicable`, `conflicting` ou `research_exhausted`; completude não força valor inventado.
- [ ] Métricas e erros são agregados/sanitizados, sem prompt, conteúdo bruto, segredo ou URL em telemetria.

## Restrições ou contexto

- Depende de P1-031; reutilizar validação AJV, `fonte_ref`, políticas de qualidade e evidência atuais.
- V1 é uma fila local/worker modular com uma sessão por ficha como padrão seguro; fila distribuída, autopilot e paralelismo amplo ficam fora.
- Requer smoke simulated, fixtures de concorrência/idempotência e checks de tipo/build.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — provider, execução assíncrona e estados.`
- Segurança: `Aplicável — custo, conteúdo externo, autorização e observabilidade.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar P1-031 aprovado e Architecture Gate próprio.
