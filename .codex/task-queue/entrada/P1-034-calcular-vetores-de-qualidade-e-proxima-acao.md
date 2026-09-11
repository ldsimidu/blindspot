# ❌ Pendente — Calcular vetores de qualidade e recomendar próxima pesquisa

> Prioridade: P1
>
> Área afetada: qualidade, API, dados, interface e explicabilidade
>
> Origem ou referência: P1-033; proposta, seções 7 a 9, 17, 40, 41 e 67
>
> Arquitetura: `A avaliar`
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

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar`
- Triagem automática: `Material — regra de qualidade e novo comportamento de API/UI.`
- Segurança: `Aplicável — autorização para primary e explicabilidade de decisão.`
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: aguardar P1-033 e Architecture Gate próprio.
