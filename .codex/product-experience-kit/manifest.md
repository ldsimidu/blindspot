# Manifesto do Product Experience Kit — BlindSpot

| Campo | Valor |
| --- | --- |
| Versao do PEK | `0.8.0` |
| Fonte canônica | `C:\Users\lucas\Documents\bedrock\tools\product-experience-kit` |
| Adapter local | BlindSpot |
| Estado da instalação | Opt-in configurado |

## Ativação

Use o PEK somente quando Lucas invocar `:pek`, mencionar UX/UI como escopo explícito ou uma task referenciar este adapter. Sem isso, a feature continua priorizando comportamento funcional, contrato, dados, integridade de fontes e verificações do BlindSpot.

`--auto` só lê o alvo explicitamente indicado, declara modo, confiança, evidências e lacunas. Ele não altera o repositório, instala dependências, abre serviços ou explora a aplicação sem autorização específica.

O core v0.8 inclui governança de Design System, Image System, arquitetura visual por tela, curadoria de movimento/UI externa, checkpoint de primeira renderização e loop de reabertura por feedback humano. Tokens, componentes e direção visual concretos continuam pertencendo ao consumidor; o PEK padroniza a evidência, a precedência, as decisões, a composição revisável e as verificações.

Para uma task de design material, `core/screen-design-architecture-contract.md` é obrigatório antes do código: ele confronta tela atual, referência específica, referências gerais, regras do produto e composição alvo. Quando houver asset visual, aplicar também `core/image-system-and-asset-curation-contract.md` e o Image System local.

Quando uma task considerar elemento animado, biblioteca, template ou galeria, aplicar antes `core/motion-and-external-ui-curation-contract.md` e `core/component-intake.md`. Curadoria não autoriza instalar, conectar MCP, criar conta, baixar template ou copiar código.

Após aprovação e primeiro JSX/CSS estrutural, `core/first-render-composition-checkpoint.md` é obrigatório antes de polir a tela ou concluir o fluxo. Capturas sanitizadas em desktop/mobile (e tablet quando aplicável) precisam aprovar canvas, largura, regiões, hierarquia e legibilidade; reprovação retorna à arquitetura visual. Feedback humano posterior que sinalize identidade, propósito, fluxo, agrupamento de campos ou composição também invalida a aprovação visual e exige uma nova arquitetura antes de qualquer polimento.

## Atualizações

O core no Bedrock é canônico. Antes de atualizar o adapter, comparar versão e diff; a aplicação exige autorização explícita e preserva regras próprias do BlindSpot.
