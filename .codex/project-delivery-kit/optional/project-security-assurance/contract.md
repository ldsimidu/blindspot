# Project Security Assurance Contract

## Propósito

Esta extensão opt-in torna explícita a segurança proporcional em mudanças de software. Ela conecta preflight, Architecture Gate, estratégia de verificação, handoff e release sem impor ferramenta, stack, fornecedor ou acesso a serviços externos.

## Quando aplicar

Aplicar quando a mudança criar ou alterar autenticação, autorização, dados sensíveis, segredo, API pública, integração externa, upload, persistência, dependência, CI/CD, infraestrutura, IA com ferramentas ou conectores, exportação, auditoria ou retenção de dados.

Mudanças que não acionam esses gatilhos podem registrar `Não aplicável` com justificativa curta. A ausência de ferramenta, acesso ou ambiente não transforma uma verificação de segurança em aprovada.

## Revisão mínima

A revisão de segurança registra:

- gatilhos e escopo da mudança;
- dados, credenciais, integrações e fronteiras de confiança afetados;
- cenário de abuso ou falha relevante e controles previstos;
- verificações proporcionais, ambiente seguro e evidência esperada;
- achados, exceções com prazo e responsável pela aceitação do risco residual;
- verificações bloqueadas e a próxima ação objetiva.

Use referências normativas versionadas e adequadas ao contexto, como NIST SSDF para o ciclo de desenvolvimento e OWASP ASVS para aplicações web/API. Elas orientam a revisão; não substituem requisitos locais nem criam certificação.

## Conteúdo externo e ferramentas

Skills, plugins, scripts ou scanners de terceiros só podem ser sugeridos ou adotados após registrar origem, licença, versão ou commit fixado, comandos, dependências, permissões, dados enviados pela rede e efeito de escrita. Conteúdo ofensivo ou dual-use exige alvo autorizado e limite explícito; nunca é ativado por descoberta automática.

O PDK não instala nem executa essas ferramentas. Cada consumidor decide ferramentas, severidade de bloqueio, ambiente descartável e quem pode aceitar exceções.

## Integração com gates

- O preflight identifica os gatilhos e encaminha a revisão.
- A arquitetura inclui controles e critérios de aceite quando a revisão é aplicável.
- A estratégia de verificação define checks concretos por stack.
- `project-compliance-assurance` cobre requisitos de privacidade e outras obrigações aplicáveis, incluindo fonte oficial, finalidade, dados, retenção e pendência jurídica; security assurance continua responsável pelos controles técnicos.
- O handoff e a release registram evidências, achados e risco residual, sem segredos.
- `project-agent-action-policy` pode registrar a classe da ação e sua autorização; a política não substitui a revisão de segurança.

## Limites

Esta extensão não substitui threat modeling especializado, pentest autorizado, resposta a incidente, requisitos legais, revisão humana ou o Architecture Gate. Ela não declara que um sistema está seguro; declara apenas o escopo e as evidências da revisão realizada.
