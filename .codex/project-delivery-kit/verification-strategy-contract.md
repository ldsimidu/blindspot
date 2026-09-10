# Verification Strategy Contract

## Propósito

Cada repositório consumidor define uma estratégia de verificação proporcional ao risco das mudanças. O PDK exige evidência honesta; não impõe stack, comandos, serviços ou infraestrutura específicos.

## Conteúdo mínimo do perfil local

A estratégia local deve declarar:

1. verificação mínima para documentação e alterações mecânicas;
2. verificações por tipo de mudança relevante, como interface, lógica de domínio, dado persistido, integração, autenticação, configuração e automação;
3. condições para testes que dependem de rede, credenciais, serviços externos ou ambiente descartável;
4. como registrar checks aprovados, falhos, pulados e bloqueados no resultado da task ou no handoff;
5. quem decide a aceitação quando uma verificação essencial não pode ser executada.

## Regras

- Comece por verificações focais durante o diagnóstico e execute o gate mais amplo definido pelo consumidor quando for viável.
- Não alegue aprovação completa se parte da estratégia foi bloqueada; informe o limite e a evidência ainda válida.
- Testes mutantes devem usar dados e ambientes seguros definidos pelo consumidor; nunca presuma que uma base ou serviço compartilhado pode ser alterado.
- A estratégia não substitui critérios de aceite, revisão humana, Architecture Gate ou regras de segurança locais.
- Quando `project-delivery-evals` estiver instalado, seus resultados determinísticos podem complementar a evidência de contrato; `blocked` continua bloqueio explícito, não aprovação.

## Resultado esperado

O resultado de uma task permite distinguir com clareza: o que mudou, o que foi verificado, o que falhou, o que não foi executado e a ação necessária para reduzir o risco restante.
