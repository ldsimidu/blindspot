# Alinhamento com o PEK comum

## Conclusão

O fluxo planejado para o BlindSpot está incluído no PEK comum em nível de método: descoberta de evidências, mapa de experiência, estados, decisões UX, priorização e comparação antes/depois. O adapter do BlindSpot acrescenta regras de domínio necessárias para que a UX não induza decisões sobre dados automotivos incertos.

O PEK passa a ter também um contrato genérico de governança de Design System. O [Design System do BlindSpot](../../../docs/product/design-system.md) concretiza essa governança com a direção visual, os limites de domínio e as referências deste produto.

## O que o PEK comum já cobre

- jornadas, objetivos, etapas e pontos de entrada;
- estados inicial, carregando, vazio, parcial, conflitante, erro, indisponível e sucesso;
- evidência visual, implementação, fontes de dados e lacunas;
- acessibilidade, responsividade, teclado, foco, contraste e movimento reduzido;
- registro de achados, critérios de validação e priorização por impacto;
- comparação antes/depois sem alegar métricas não medidas.

## O que o adapter BlindSpot complementa

- `fonte_ref`, proveniência, completude, conflito e status são informação decisória;
- identidade persistida inconsistente com o payload bloqueia comparação;
- estados de dado confirmado, parcial, conflitante, não encontrado, não aplicável e inferido precisam de significado visível;
- comparação e exportação dependem de elegibilidade e integridade;
- direção visual: sobriedade operacional, densidade progressiva e evidência legível.

## Extensão incorporada ao core v0.3

O core v0.3 incorporou uma extensão genérica para produtos orientados a evidências: `proveniência`, `completude`, `conflito`, `elegibilidade da ação` e `explicação do bloqueio`. Os nomes e regras automotivas continuam no adapter. A fonte canônica está em `tools/product-experience-kit/core/evidence-quality-contract.md` no Bedrock.

## Evidência e lacunas atuais

- screenshots atuais e referências foram adicionados em `evidence/ux-ui/current/` e `evidence/ux-ui/references/`; a leitura consolidada está em `docs/product/ux-ui-auditoria-estado-atual.md`;
- a auditoria é visual e de jornada: não confirma por si só teclado, responsividade, carregamento real, autorização ou permissões de servidor;
- comparação está visualmente evidenciada, mas a elegibilidade e o contrato de servidor continuam sendo comprovados pelo fluxo funcional e runtime, não pela captura;
- o Design System e a direção de refatoração são propostas arquiteturais: não devem ser apresentados como UI já entregue até a evidência de implementação.
