# ❌ Pendente — validar acessibilidade, responsividade e aceite visual

> Prioridade: P2
>
> Área afetada: qualidade de interface e documentação de evidência
>
> Origem ou referência: Design System, auditoria UX/UI e roadmap
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — validação transversal de experiência`
>
> Segurança: `Não aplicável — não altera identidade, API, dados ou integrações`

## Pedido

Validar a experiência refatorada por jornada, viewport e tecnologia assistiva, registrando evidências visuais e lacunas sem declarar aprovação para estados não exercitados.

## Critérios de aceite

- [ ] Desktop, tablet e mobile foram verificados nas jornadas implementadas de acesso, ficha, catálogo, comparação e administração aplicáveis.
- [ ] Fluxo por teclado, foco, contraste, zoom de 200%, leitura de status e `prefers-reduced-motion` têm resultado registrado.
- [ ] Estados loading, vazio, parcial, conflito, erro, indisponível, bloqueado e sem permissão foram cobertos quando presentes no runtime.
- [ ] Evidências são sanitizadas: sem credenciais, cookies, tokens, logs brutos ou dados pessoais desnecessários.
- [ ] Achados remanescentes recebem prioridade e task própria; não são escondidos por aprovação genérica.

## Restrições ou contexto

- Não acionar dados de produção, provider real ou ações destrutivas para produzir evidência.
- Distinguir renderização estática, smoke manual e comportamento comprovado em runtime.
- Usar `evidence/ux-ui/` como repositório de capturas e registros, sem duplicar segredos.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — validação transversal`.
- Segurança: `Não aplicável`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: ativar após as fatias UX/UI correspondentes.
