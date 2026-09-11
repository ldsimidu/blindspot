# ❌ Pendente — integrar curadoria de imagens com rastreabilidade

> Prioridade: P1
>
> Área afetada: assets, integração externa, segurança, privacidade e interface
>
> Origem ou referência: `docs/product/image-system.md`
>
> Arquitetura: `A avaliar na ativação`
>
> Triagem automática: `Material — provider externo, credencial, licença e metadados de assets`
>
> Segurança: `Aplicável — integração externa, segredo/API key, tráfego de dados e assets`

## Pedido

Implementar, se aprovado, uma curadoria de imagens em desenvolvimento com abstração de provider, Image Intent, ranking revisável, metadados e manifesto de assets. A funcionalidade não pode realizar busca autônoma em produção nem expor credenciais ao cliente.

## Critérios de aceite

- [ ] Provider e termos/licença são aprovados por decisão humana para a finalidade declarada.
- [ ] Chave/API token fica exclusivamente em ambiente seguro; nenhum segredo entra no cliente, Git, log ou manifesto.
- [ ] Busca usa Image Intent, múltiplas queries e candidatos; a seleção final é revisável e não usa o primeiro resultado automaticamente.
- [ ] Asset aprovado registra origem, provider, licença/termos, data, finalidade, atribuição e revisão necessária.
- [ ] Imagem ilustrativa não é apresentada como identidade exata da ficha técnica.
- [ ] Falha de provider, licença incerta ou ausência de candidato produzem Image Specification/placeholder, sem bloquear a tela nem inserir imagem aleatória.

## Restrições ou contexto

- Ler `docs/product/image-system.md`, Design System, contrato PEK de intake e os termos atuais do provider antes do Architecture Gate.
- Aplicar `project-security-assurance` e `project-compliance-assurance`; registrar finalidade, dados enviados, destino, retenção e responsável.
- Não instalar SDK, criar conta, usar chave, baixar ou publicar asset sem autorização específica.
- Não usar imagens das referências como assets do produto.

## Resultado do agente

- Estado: `❌ Pendente`
- Arquitetura: `A avaliar na ativação`.
- Triagem automática: `Material — provider externo, licença, segredo e metadados`.
- Segurança: `Aplicável — revisão obrigatória`.
- Implementação: ainda não iniciada.
- Arquivos alterados: nenhum.
- Verificação: não executada.
- Próximo passo: decisão de provider/uso e Architecture Gate com security/compliance.
