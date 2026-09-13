# 🚧 Em execução — Reverter priorização experimental no refine compatível

> Prioridade: P1
>
> Área afetada: prompt de refine OpenRouter e seu verificador estático
>
> Origem ou referência: duas amostras pós-experimento de Ford Ranger Raptor 2025 Brasil em 11/09/2026
>
> Arquitetura: `APPROVED — Lucas autorizou o rollback pontual nesta sessão em 11/09/2026`
>
> Triagem automática: `Material — altera orientação de IA, sem contrato ou integração nova`
>
> Segurança: `Aplicável — prompt de IA com conteúdo externo não confiável`

## Pedido

Reverter somente a orientação experimental adicionada ao refine OpenRouter em `ex_prompt_compat` que pedia preferência por fonte de primeira parte por variável e múltiplas referências. Preservar a busca ampla, a permissão de fontes externas observadas, a telemetria pós-validação, o modo compatível, os budgets e as demais mudanças de pesquisa.

## Critérios de aceite

- [x] As três frases experimentais de priorização/corroboracão deixam o refine compatível.
- [x] Permanece a orientação existente de priorizar materiais de primeira parte quando observados e de permitir fontes externas observadas, HTTPS e rastreáveis para lacunas.
- [x] Quick, `strict_evidence`, Claude, schema, política, endpoint, provider, modelo, budgets, telemetria e persistência não mudam.
- [x] O verificador volta a testar somente os invariantes reais do modo compatível, sem esperar a orientação revertida.
- [x] A documentação e o ledger distinguem este rollback de um retorno amplo ao fluxo anterior ao `ex_prompt_compat`.

## Arquitetura, segurança e conformidade proporcionais — 2026-09-11

### Fatos e decisão

- O baseline pós-validação registrou 109/194 campos pesquisáveis preenchidos, com 14 campos `official` e 95 `other`.
- Duas amostras posteriores permaneceram em 107/194, com os mesmos 14 `official` e 93 `other`; não houve campo com múltiplas classes de fonte.
- A evidência não sustenta manter a orientação experimental. O rollback é limitado ao texto do prompt, seus asserts e a documentação correspondente; não restaura versões históricas nem remove a observabilidade que permitiu o diagnóstico.

### Fluxo e impacto técnico

1. O quick e o refine amplo existentes permanecem inalterados.
2. O refine compatível volta à orientação anterior: priorizar materiais de primeira parte quando observados, permitindo fontes externas observadas e rastreáveis para lacunas.
3. A resposta continua sendo validada e auditada após validação; a próxima geração será apenas confirmação do rollback, não prova causal sem série controlada.

### Segurança

- Fronteira e controles permanecem: provider/conteúdo externo não confiável, política e validação server-owned, schema fechado e telemetria sanitizada.
- O rollback não acrescenta chamadas, ferramentas, dados enviados, permissões, segredos, domínios ou custos; remove orientação que poderia incentivar uma alocação inadequada de fonte.
- Verificação: asserts de prompt, typecheck e build; nenhuma chamada real ao provider durante a implementação. Risco residual de qualidade factual continua sob responsabilidade de Lucas e é medido na geração manual seguinte.

### Conformidade proporcional

- Jurisdição Brasil; referência LGPD oficial do Planalto, arts. 5º, 6º e 46, consultada em 11/09/2026.
- Não há nova coleta, retenção, compartilhamento, transferência, conteúdo bruto ou dado pessoal. Finalidade e destinatário da integração existente permanecem inalterados.
- A revisão não substitui validação jurídica humana; reavaliar se a integração, retenção ou conteúdo tratado mudar.

### Double-check e reversibilidade

- A reversão não toca `strict_evidence`, logo não reintroduz o filtro de parceiros em `ex_prompt_compat`.
- A frase que permite fonte externa permanece explicitamente coberta pelo verificador.
- O ponto recuperável é o diff desta task, não uma execução histórica: os logs não comprovam cinco fontes finais publicadas, somente observações no refine em diferentes amostras.
- Reversibilidade: reaplicar somente este diff caso uma futura arquitetura e experimento controlado justifiquem a hipótese; sem migration, banco ou operação externa.

## Resultado do agente


_Preenchido pelo agente. Não apague o pedido original._

- Estado: `✅ Concluída`
- Implementação: removidas exclusivamente as três instruções experimentais do refine compatível e seus asserts; a busca ampla e a permissão de fontes externas permanecem.
- Arquivos alterados: `services/api/llm.ts`, `scripts/verify-research-capabilities.ts`, documentação/ledger e esta task.
- Verificação: `npm run verify:research-capabilities` ✅; `npm run typecheck` ✅; `npm run build` ✅.
- Validação real: pendente de uma geração manual de confirmação; não houve chamada ao provider durante esta task.
