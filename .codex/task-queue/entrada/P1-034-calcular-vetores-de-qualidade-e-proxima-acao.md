# ✅ Concluída — Calcular vetores de qualidade e recomendar próxima pesquisa

> Prioridade: P1
>
> Área afetada: qualidade, API, dados, interface e explicabilidade
>
> Origem ou referência: P1-033; proposta, seções 7 a 9, 17, 40, 41 e 67
>
> Arquitetura: `APPROVED — Lucas autorizou “pode seguir” em 2026-09-11.`
>
> Triagem automática: `Material — cria avaliação derivada e recomendação de produto.`
>
> Segurança: `Aplicável — decisões derivadas, API e possível exposição de dados.`

## Pedido

Criar indicadores explicáveis de qualidade por revisão e uma recomendação não mandatória de próximo foco. A V1 deve usar vetores separados de completude, evidência, consistência, atualidade e validação humana; o agregado, se houver, é secundário e não decide sozinho.

## Critérios de aceite

- [ ] `latest` é temporal; `recommended` é calculado; `primary` é escolha autorizada da pessoa/organização, sem um sobrescrever o outro.
- [ ] Cada indicador informa versão de política, entradas, limites e razões observáveis; dados ausentes não viram nota positiva.
- [ ] A recomendação sugere um preset de foco e impacto esperado, mas a pessoa pode escolher outro ou não executar pesquisa.
- [ ] Nenhum score promove fonte, resolve conflito ou confirma campo sem evidência válida.
- [ ] Métricas são recalculáveis a partir de revisões/evidências e testadas com fixtures determinísticas.

## Restrições ou contexto

- Depende de P1-033; usar dados observados e políticas explícitas, não modelo treinado ou ranking opaco.
- Reputação de fonte, personalização e automático/autopilot ficam fora deste corte.

## Architecture Gate — vetor de qualidade explicável (2026-09-11)

### Decisão

Criar um calculador puro, versionado e determinístico a partir de `field_resolutions`, `field_evidence` e timestamps da revisão. Ele retorna os vetores `completeness`, `evidence`, `consistency`, `freshness` e `human_validation`, cada qual com numerador, denominador, limites e razões sanitizadas. Não há score único decisório; se exibido, é resumo secundário e não altera payload, fontes, estados nem `primary`.

`latest` continua seleção temporal. `recommended` é somente a sugestão de preset com razão e impacto observável: ausência sugere `MISSING_VARIABLES`; conflito, `CONFLICT_RESOLUTION`; evidência fraca, `OFFICIAL_SOURCES`; caso contrário, `VALIDATE_EXISTING`. O cliente pode ignorá-la ou escolher outro foco. `primary` fica indisponível até política, papel e auditoria próprios.

### Segurança e double-check

O calculador é read-only, tenant-scoped e não envia dado a provider. Métricas não carregam URL, trecho, prompt, segredo nem metadado interno; fonte só conta quando a evidência válida existe. Ausência, conflito e dado sem evidência não contam positivamente. Fixtures determinísticas devem provar que o vetor não promove campo, não decide conflito e é recalculável. Conclusão: `APPROVED` para implementação sem ranking, reputação ou autopilot.

## Resultado do agente

- Estado: `✅ Concluída`
- Arquitetura: `APPROVED — corte determinístico autorizado em 2026-09-11.`
- Triagem automática: `Material — regra de qualidade e novo comportamento de API/UI.`
- Segurança: `Aplicável — autorização para primary e explicabilidade de decisão.`
- Implementação: calculador puro `quality-vector-v1` entrega vetores separados de completude, evidência, consistência, atualidade e validação humana, com numerador, denominador e razões. A recomendação é não mandatória e prioriza lacunas, conflitos, evidência ausente ou validação; não altera fonte, conflito, payload, `latest` ou `primary`.
- Arquivos alterados: `services/api/quality-vector.ts`, `scripts/verify-quality-vector.ts`, `package.json` e esta task.
- Verificação: `npm run verify:quality-vector` retornou `QUALITY_VECTOR=PASS`; `npm run typecheck` passou. Nenhum endpoint, provider, ranking opaco, reputação ou autopilot foi criado.
- Próximo passo: P1-035 — workspace de veículo e ciclo de vida de fichas, onde os indicadores poderão ser expostos sob autorização.
