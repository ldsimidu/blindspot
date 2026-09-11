# Adapter PEK — BlindSpot

## Contexto e Prioridade

O PEK avalia como a experiência torna dados automotivos rastreáveis compreensíveis e acionáveis. Não substitui o runtime em `packages/agent-runtime/assets/`, o schema, validadores, API ou controles de segurança.

Prioridade de entrega: primeiro integridade do dado, comportamento funcional e estados corretos; depois elevação UX/UI. O PEK pode identificar uma falha que bloqueia compreensão ou induz decisão incorreta, mas não altera código sem Architecture Gate aprovado.

## Fluxos a Mapear

1. Identificar veículo e iniciar pesquisa.
2. Acompanhar carregamento, falha, ausência ou indisponibilidade.
3. Ler ficha, fonte, completude, conflito e status por variável.
4. Recuperar histórico e versão de ficha.
5. Comparar somente fichas elegíveis, quando a funcionalidade estiver disponível.

## Evidência e Limites

Ao usar `:pek --auto`, priorizar documentos de jornada/requisitos, screenshots/renders, evidência de implementação e regras de dados. Declarar contradição entre documentos e comportamento observado; não resolver por suposição.

Exploração interativa requer alvo e autorização explícitos. Ela é de observação: não envia solicitações que gerem dados, não salva, exclui, publica, altera configurações nem acessa áreas fora do escopo autorizado.

## Regras de Domínio na Interface

- `fonte_ref`, status, completude e conflito são informações decisórias; não podem aparecer apenas por cor, tooltip ou detalhe oculto.
- Uma identidade persistida inconsistente com o payload bloqueia comparação e exige explicação visível.
- Dados parciais, conflitantes, não encontrados, não aplicáveis e inferidos minimamente devem informar limites e próximo passo.
- Ações de comparação e exportação só aparecem quando pré-requisitos técnicos e de integridade forem atendidos.
