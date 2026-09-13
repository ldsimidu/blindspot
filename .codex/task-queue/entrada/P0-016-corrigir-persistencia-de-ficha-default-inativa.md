# ✅ Concluída — Corrigir persistência diante de ficha default inativa

> Prioridade: P0
>
> Área afetada: persistência PostgreSQL, migração e validação de regressão
>
> Origem ou referência: erro HTTP 409 `Ficha tecnica indisponivel para persistencia`, reportado em 2026-09-13
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” após o diagnóstico em 2026-09-12.`
>
> Triagem automática: `Material — corrige regra de unicidade e ciclo de vida persistidos.`
>
> Segurança: `Aplicável — integridade tenant-scoped e persistência.`

## Pedido

Corrigir a geração normal de ficha quando uma ficha `default` antiga ou inativa impede a criação da ficha ativa da mesma configuração e organização.

## Architecture Gate — 2026-09-12

### Fatos confirmados

- O bootstrap de `persistTechnicalSheetInTransaction` procura somente `TechnicalSheet` com `state = active` e `is_default = true`.
- A migração 0019 tornou único `is_default = true` sem considerar o estado. Assim, uma ficha `legacy_imported`, `stale` ou `archived` podia impedir o insert da nova ficha ativa, que terminava no HTTP 409 reportado.
- A consulta agregada autorizada confirmou fichas `default` em estados legados; nenhum dado de ficha, conta ou segredo foi lido ou registrado.

### Decisão e fluxo

1. A migração converte `legacy_imported` e `legacy_unassigned` para `archived`, preservando registros e linhagem; fichas não ativas deixam de ser `default`.
2. A unicidade passa a abranger somente `is_default = true AND state = active`, por configuração e organização.
3. No bootstrap sem ficha explícita, a transação limpa qualquer `default` inativa remanescente antes de criar/reusar a ficha ativa.
4. Com `technicalSheetId` explícito, a persistência não cria uma ficha substituta: ficha ausente/inativa continua erro controlado.

### Segurança e conformidade proporcionais

- **Fronteira:** sessão autenticada → organização derivada no servidor → transação PostgreSQL filtrada por `organization_id` e configuração exata.
- **Risco principal:** uma ficha antiga bloquear a geração ou uma sessão direcionada publicar em ficha diferente. Controle: transação, predicados tenant-scoped e proibição de fallback quando a ficha é explícita.
- **Dados e conformidade:** nenhuma categoria, finalidade, retenção, terceiro, IA, cookie ou endpoint é criado. A migração altera apenas metadados de estado/default de fichas já persistidas. LGPD não cria obrigação nova neste recorte; a finalidade e responsável existentes permanecem os do produto. Não é parecer jurídico.
- **Verificação:** fixture descartável com ficha `default` arquivada, geração simulated e duas organizações; checar nova ficha ativa, revisão persistida, ausência de cruzamento e falha segura para ficha explícita inativa.

### Double-check

- Nenhuma ficha, revisão, evidência ou auditoria histórica é apagada.
- `latest`, `recommended`, `primary`, prompt, schema, provider e frontend permanecem inalterados.
- O novo índice preserva no máximo uma ficha `default` ativa por configuração/organização; a migração remove a ambiguidade histórica antes de criá-lo.

## Critérios de aceite

- [x] Uma ficha default inativa não bloqueia a geração normal; a nova ficha ativa recebe a revisão.
- [x] Dados legados permanecem arquivados e deixam de ser default.
- [x] Uma sessão com ficha explícita inativa falha controladamente, sem criar ficha substituta.
- [x] A correção preserva isolamento organizacional e passa em fixture PostgreSQL descartável, typecheck e build.

## Resultado do agente

- Estado: `✅ Concluída`.
- Implementação: adicionada a migração `0029_recover_inactive_default_technical_sheets`, aplicada no PostgreSQL configurado. Ela arquiva os estados legados preservando registros, limpa `is_default` de fichas não ativas, normaliza a constraint de estado e restringe a unicidade a ficha default ativa. O bootstrap limpa default inativa dentro da transação; uma ficha explícita ausente/inativa não recebe fallback de criação.
- Arquivos alterados: `drizzle/0029_recover_inactive_default_technical_sheets.sql`, `drizzle/meta/_journal.json`, `services/api/db/repository.ts`, `scripts/verify-inactive-default-sheet-recovery-db.ts`, `package.json` e esta task.
- Verificação: `npm run db:migrate`, `npm run verify:inactive-default-sheet-recovery-db`, `npm run typecheck`, `npm run build` e `git diff --check` passaram. A fixture usou duas organizações sintéticas e limpeza em `finally`.
- Limitação: a geração manual autenticada permanece para confirmação de produto pelo usuário; nenhum provider real foi chamado pela verificação.
- Próximo passo: repetir a geração que falhou; uma configuração com ficha legada/inativa agora deve criar uma ficha default ativa e persistir a revisão.
