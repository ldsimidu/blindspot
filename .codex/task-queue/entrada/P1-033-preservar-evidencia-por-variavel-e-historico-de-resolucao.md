# ✅ Concluída — Preservar evidência por variável e histórico de resolução

> Prioridade: P1
>
> Área afetada: schema, dados, validação, API e qualidade
>
> Origem ou referência: P1-004, P1-027 e proposta, seções 24 a 35
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-11.`
>
> Triagem automática: `Material — altera semântica de proveniência e resolução.`
>
> Segurança: `Aplicável — dados de proveniência, API e retenção.`

## Pedido

Evoluir o vínculo atual de fonte por versão para evidência consultável por variável, preservando o payload validado e os estados sem inventar um “fato vencedor” automático. Criar histórico de resolução que explique por que uma revisão escolheu, manteve conflito ou declarou desconhecimento.

## Critérios de aceite

- [ ] Cada valor publicado referencia evidências imutáveis com `source_ref`, localização/trecho seguro quando disponível, método e momento de observação.
- [ ] A fonte continua canônica por URL e sua classificação de política permanece server-owned.
- [ ] Conflitos mantêm alternativas e motivos; uma resolução automática só é possível por regra aprovada, explicável e reversível.
- [ ] Edição/decisão humana futura não altera evidência original e deixa ator, motivo e revisão resultante auditáveis.
- [ ] APIs não expõem conteúdo bruto, dados proibidos de fonte ou metadados internos de provider.

## Restrições ou contexto

- Depende de P1-030 e deve integrar o corte B de P1-004, não duplicar a fila de revisão humana.
- Não introduzir scraping, download de URL arbitrária ou nova reputação de fonte nesta task.

## Architecture Gate — evidência e resolução por campo (2026-09-11)

### Decisão

Adicionar `field_evidence` append-only, vinculada a `technical_sheet_versions`, `sources` e ao caminho canônico `grupo.campo`; e `field_resolutions`, também append-only, para materializar o estado/valor escolhido ou a preservação de ausência/conflito na revisão. `sources` continua a única identidade canônica de URL, e aderência/classificação continua server-owned no pipeline já existente.

O backfill inicial deriva somente `source_ref` já publicado no payload: não inventa trecho, localização, confiança, evidência ou vencedor. Evidência nova pode registrar método e instante de observação, mas trecho é opcional, limitado/sanitizado e nunca sai por API pública neste corte. Conflito referencia alternativas e mantém `valor: null`; decisão humana futura criará nova resolução/revisão, sem editar evidência prévia.

### Segurança e conformidade

Gatilhos: persistência de proveniência, APIs e retenção. A fronteira é conteúdo externo não confiável → validação server-owned → evidência sanitizada → banco → leitura autorizada. Não haverá fetch, scraping, URL arbitrária, provider novo ou telemetria de URL/texto. Ator/organização continuam derivar da sessão; consultas são tenant-scoped. Retenção de trechos e eventual decisão humana são pendências controladas: V1 não persiste trecho bruto nem oferece endpoint de edição.

### Verificação e double-check

Fixtures devem provar: `source_ref` desconhecida bloqueia; conflito preserva alternativas; backfill não muda payload/versão/fonte; outro tenant não lê evidência; saída pública não contém trecho, URL interna, prompt ou metadata do provider. `typecheck`, migration autorizada e contrato estático são mínimos. O desenho não transforma fonte em fato, não reabre políticas canônicas e não promete revisão humana já implementada. Conclusão: `APPROVED` para corte estrutural e backfill compatível.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — corte estrutural autorizado em 2026-09-11.`
- Triagem automática: `Material — schema de proveniência e revisão.`
- Segurança: `Aplicável — retenção, exposição de conteúdo e autorização de revisão.`
- Implementação: `field_evidence` e `field_resolutions` append-only foram criadas e preenchidas por migration a partir de `source_ref`, status e valores já publicados. Novas revisões registram resolução por caminho e evidência por referência de fonte na mesma transação, sem alterar o payload original ou promover conflito automaticamente.
- Arquivos alterados: `services/api/db/schema.ts`, `services/api/db/repository.ts`, `drizzle/0021_field_evidence_and_resolutions.sql`, `drizzle/meta/_journal.json` e esta task.
- Verificação: migration `0021` aplicada no PostgreSQL autorizado; `npm run typecheck` e `git diff --check` passaram. Não foi criado endpoint público, scraping, download, provider ou telemetria de URL/texto.
- Próximo passo: P1-034 — calcular vetores de qualidade e próxima ação explicável.
