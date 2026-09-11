# Manifesto do Product Experience Kit — BlindSpot

| Campo | Valor |
| --- | --- |
| Versao do PEK | `0.5.0` |
| Fonte canônica | `C:\Users\lucas\Documents\bedrock\tools\product-experience-kit` |
| Adapter local | BlindSpot |
| Estado da instalação | Opt-in configurado |

## Ativação

Use o PEK somente quando Lucas invocar `:pek`, mencionar UX/UI como escopo explícito ou uma task referenciar este adapter. Sem isso, a feature continua priorizando comportamento funcional, contrato, dados, integridade de fontes e verificações do BlindSpot.

`--auto` só lê o alvo explicitamente indicado, declara modo, confiança, evidências e lacunas. Ele não altera o repositório, instala dependências, abre serviços ou explora a aplicação sem autorização específica.

O core v0.5 inclui governança de Design System, Image System e arquitetura visual por tela. Tokens, componentes e direção visual concretos continuam pertencendo ao consumidor; o PEK padroniza a evidência, a precedência, as decisões, a composição revisável e as verificações.

Para uma task de design material, `core/screen-design-architecture-contract.md` é obrigatório antes do código: ele confronta tela atual, referência específica, referências gerais, regras do produto e composição alvo. Quando houver asset visual, aplicar também `core/image-system-and-asset-curation-contract.md` e o Image System local.

## Atualizações

O core no Bedrock é canônico. Antes de atualizar o adapter, comparar versão e diff; a aplicação exige autorização explícita e preserva regras próprias do BlindSpot.
