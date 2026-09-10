# Project Compliance Assurance Contract

## Propósito

Esta extensão opt-in torna revisável a conformidade proporcional de uma mudança com regras de privacidade, proteção de dados e direitos correlatos. Ela transforma obrigações aplicáveis em perguntas, evidências e bloqueios; não presta parecer jurídico, não certifica conformidade e não substitui decisão humana ou aconselhamento jurídico qualificado.

## Escopo inicial e fontes normativas

O perfil-base é Brasil e trata a Lei Geral de Proteção de Dados Pessoais (LGPD, Lei nº 13.709/2018) como referência primária. Consulte a fonte oficial consolidada em `https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm` e as orientações vigentes da Autoridade Nacional de Proteção de Dados (ANPD) em `https://www.gov.br/anpd/`.

Em especial, a revisão deve considerar os princípios do art. 6º, as hipóteses de tratamento e dados sensíveis quando pertinentes, e a obrigação de medidas técnicas e administrativas do art. 46. O contrato não presume que uma base legal é válida: ela deve ser definida e validada pelo responsável competente no contexto concreto.

Outras normas — por exemplo direitos autorais, proteção do consumidor, acessibilidade, regras trabalhistas, setoriais ou de outra jurisdição — só entram quando o perfil do projeto ou a mudança as declarar aplicáveis. Registre a fonte oficial, a data de consulta e o responsável pela interpretação.

## Quando aplicar

Aplicar quando a mudança criar ou alterar coleta, consulta, inferência, persistência, compartilhamento, exportação, anonimização, retenção ou descarte de dados pessoais; uso de IA com dados de pessoas; cookie, analytics, API, conector, upload, log, backup, integração externa ou transferência internacional.

Também aplicar quando houver conteúdo de terceiros, interface pública ou obrigação legal/setorial explicitamente declarada pelo projeto. Sem gatilho, registre `Não aplicável` e a justificativa curta.

## Revisão mínima

A revisão registra:

- jurisdição, normas e fontes oficiais consultadas, com data;
- finalidade específica, papel no tratamento e responsável pela decisão;
- categorias de dados, titulares e se há dado sensível ou de criança/adolescente;
- minimização, qualidade, acesso, transparência, retenção e descarte;
- terceiros, IA, dados transmitidos, localização/transferência e contrato aplicável quando necessário;
- controles técnicos e administrativos, direitos do titular, evidência e verificações;
- exceções, risco residual, pendências jurídicas e condição objetiva de reavaliação.

Não copie dados pessoais, credenciais, conversas brutas ou pareceres confidenciais para a revisão. Referencie evidência sanitizada e com acesso controlado quando necessário.

## Regras de bloqueio

Bloqueie a implementação ou liberação quando houver dado pessoal sem finalidade ou responsável definidos; dado sensível ou de criança/adolescente sem avaliação reforçada e aprovação humana; envio de dados a IA, API ou terceiro sem destino e dados transmitidos conhecidos; retenção, descarte ou transparência indefinidos; incidente/suspeita de incidente sem encaminhamento; ou obrigação jurídica aplicável sem fonte e responsável de validação.

`READY`, ausência de ferramenta, template preenchido ou avaliação automática não substituem validação jurídica, autorização específica, controles técnicos nem aceitação humana de risco residual.

## Integração com o PDK

- O intake identifica gatilhos e encaminha a revisão.
- A política de ação impede transmissão de dados ou escrita remota não autorizada.
- A arquitetura define o fluxo e os controles; security assurance cobre a face técnica.
- Handoff e release registram fontes, evidências sanitizadas, bloqueios e risco residual.
- Evals verificam a presença dos campos exigidos; não decidem interpretação jurídica ou validade da base legal.

## Limites

O consumidor define sua jurisdição, critérios de severidade, responsável jurídico e procedimentos de incidente. Esta extensão não instala ferramentas, não monitora serviços, não comunica autoridades, não responde a titulares e não toma decisões legais em nome do consumidor.
