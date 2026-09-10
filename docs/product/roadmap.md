# Roadmap e maturidade do BlindSpot

O roadmap descreve dependências, não promessa de cronograma. O estado é baseado no checkout atual e nas fontes inventariadas em [source-inventory.md](source-inventory.md).

| Fase | Resultado | Estado | Próxima evidência necessária |
|---|---|---|---|
| 0. Descoberta e arquitetura | Problema, proposta e backlog inicial. | Consolidado documentalmente. | Manter decisões e fontes atualizadas. |
| 1. Domínio e schema | Contrato de dados versionado e aplicável. | Em validação. | Política de versão, dicionário e testes de contrato. |
| 2. Agente de IA reproduzível | Geração consistente com fontes e status. | Parcial. | Baseline de provider, regressões e métricas. |
| 3. API e qualidade | API mínima com validação e erros controlados. | Parcial. | Testes automatizados, completude oficial e documentação de API. |
| 4. Persistência e catálogo | Histórico reutilizável, imutável e consultável. | Planejado. | Release `database-foundation`, política de versão, arquitetura P1 aprovada e migration verificada. |
| 5. Web, comparador e exportação | Fluxos corporativos de consulta e análise. | Visualização parcial; demais planejados. | Requisitos de comparação, autorização e exportação. |
| 6. Identidade, organizações e consumo | Isolamento multiempresa e controle de uso. | Planejado. | Modelo de identidade, permissões e tenancy aprovado. |
| 7. Observabilidade, segurança e SLA | Operação mensurável e recuperável. | Planejado. | Controles, telemetria, backup e resposta a incidentes. |
| 8. Piloto Ford | Valor e qualidade demonstrados em uso controlado. | Planejado. | Critérios, grupo piloto e revisão humana. |
| 9. Escala comercial | Expansão para mercados e clientes. | Futuro. | Evidência do piloto, custo e qualidade. |

## Ordem de evolução recomendada

1. Fechar e versionar schema, dicionário e regras condicionais.
2. Criar fixtures e testes de entrada, schema, `fonte_ref` e completude.
3. Medir e escolher baseline operacional do agente para um conjunto de veículos e mercados.
4. Persistir fichas validadas com histórico e rastreabilidade (task P1).
5. Completar experiência de consulta e rastreabilidade; só então introduzir comparador e exportações.
6. Introduzir identidade, organizações e controle de consumo antes de qualquer dado corporativo multi-tenant.
7. Instrumentar segurança, observabilidade e operação antes de prometer SLA ou piloto.

## Métricas e metas: estado correto

Tempo de resposta, disponibilidade, `confidence_score`, custo por ficha, percentual de fontes e metas de consumo aparecem nas fontes de produto como propostas ou medições pontuais. Não são SLOs, SLAs nem baseline aprovado neste repositório até que existam método, amostra, ambiente e decisão registrados.

## Dependências críticas

- Persistência depende de definir schema versionado, retenção e estratégia de migração de snapshots.
- Comparação e exportação dependem de fichas validadas, versionadas e de autorização.
- Organizações e consumo dependem de autenticação, autorização e isolamento de dados.
- Piloto depende de qualidade mensurável, revisão humana e operação segura.

## Governança documental

A [matriz de cobertura](coverage-matrix.md) distingue fontes de runtime, fontes históricas, propostas e contexto acadêmico. O catálogo e o backlog futuro devem referenciá-la; uma narrativa de pitch, meta financeira ou requisito acadêmico não muda o estado de implementação.
