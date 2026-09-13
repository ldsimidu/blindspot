# P1-055 — Nova Ficha V3: composição modular e ocupação de viewport

> Estado: `APPROVED — Lucas autorizou a implementação em 2026-09-13`.

## Objetivo

Reconstruir a primeira dobra da Nova Ficha para extrair da referência a grade modular, a densidade e a prioridade de objeto, sem copiar sua marca, carro, telemetria, mapa, manutenção ou dados fictícios.

## Grade

Em desktop, a área autenticada usa quase toda a largura disponível, com frame de margem pequena. A primeira dobra usa 12 colunas: identidade do veículo ocupa 6; completude ocupa 3; prioridades/qualidade ocupam 3. A linha seguinte contém módulos de fontes, campos sem informação, conflitos e temporalidade quando cada dado existir. Tablet usa 8 colunas; mobile, 4 colunas em ordem: objeto → ação → completude → qualidade → tempo → detalhe.

## Módulos e fonte factual

| Módulo | Dado | Regra |
| --- | --- | --- |
| Identidade editorial | `veiculo_alvo` | Marca/modelo/versão/ano/mercado são a representação canônica; sem foto genérica |
| Anel de completude | `preenchidas / total_variaveis` | Percentual real, clamp 0–100, texto `n / total`; sem animação de contagem |
| Fontes | `fontes_utilizadas.length` | Número factual |
| Sem informação | `nao_encontradas` | Ausência é limite, não erro |
| Conflitos | `conflitantes` | Estado visual e texto; não escolhe vencedor |
| Temporalidade | `history.finishedAt` | Primeira e última pesquisa somente se há histórico; caso contrário, indisponível |
| Exportar | identificador técnico exato | Não renderizar até o contexto expor versão exportável |

## Ações superiores

Tema, descoberta de destinos e conta ficam no shell. Ações auxiliares da página podem incluir abrir histórico; exportar só é exibido quando a versão correspondente estiver presente e autorizada. Não criar atalho de exportação sem contrato.

## Remoções e preservação

O painel de qualidade do workspace não repete números que já aparecem na primeira dobra. Ele mantém interpretação de status, conflitos e evidência por atributo. Composer, payload, geração, source refs, RBAC, logout e tabs permanecem comportamentalmente iguais.

## Aceite visual

- Não há vazios laterais estruturais além da margem de frame necessária.
- Cada número principal possui módulo próprio e responsabilidade não duplicada.
- O primeiro olhar identifica veículo, completude e risco factual.
- Light e dark preservam grade/semântica.
- Render em 1440 e 390, comparado com a evidência de 2026-09-13, é obrigatório antes de conclusão.

