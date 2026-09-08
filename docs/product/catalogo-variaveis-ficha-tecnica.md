# Catálogo de variáveis da ficha técnica

> Estado: governança aprovada na P0-006 em 08/09/2026. Este documento descreve os 204 caminhos obrigatórios do contrato atual: 199 campos com `status` e 5 coleções de adicionais. Não adiciona valores técnicos, campos ou comportamento de runtime.

## Regras de cobertura e preenchimento

A ficha possui sempre os mesmos **204 caminhos canônicos**. Os 199 campos de dados possuem `status`; as 5 coleções de `adicionais` são contêineres obrigatórios. `cobertura_estrutural` e `cobertura_resolvida` devem ser 100% dentro de suas unidades: 204/204 caminhos presentes e 199/199 campos de status com resultado explícito. Isso não significa 100% de confirmação; `confirmado` somente ocorre com fonte compatível da configuração exata.

| Estado | Uso seguro |
|---|---|
| `confirmado` | Valor da configuração exata + `fonte_ref`. |
| `parcial` | Valor com evidência parcial + `fonte_ref` e explicação; a UI pode exibir “a confirmar”. |
| `inferido_minimamente` | Valor inferido com evidência + explicação; nunca é default. |
| `nao_encontrado` | `valor: null` e NF1 depois da pesquisa mínima definida para a família. |
| `nao_aplicavel` | `valor: null` somente com incompatibilidade comprovada da configuração. |
| `conflitante` | `valor: null`, fontes divergentes e CF1; não escolhe vencedor. |

`Núcleo` significa que o campo é útil à leitura de qualquer veículo, ainda que seu valor possa estar ausente. `Condicional` exige um discriminador de configuração. `Extensão` é detalhe especializado, mantido no schema atual para não perder comparabilidade, mas candidato à decisão de racionalização. Nenhuma célula abaixo autoriza usar `false`, `0`, string “N/A”, array vazia ou valor de outro veículo como padrão.

## Identificação — 8

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `identificacao.marca` | Núcleo | Toda ficha; identidade solicitada e fonte da configuração. | Confirmar ou rejeitar a ficha por identidade; nunca inferir. |
| `identificacao.modelo` | Núcleo | Toda ficha; identidade solicitada e fonte da configuração. | Confirmar ou rejeitar a ficha por identidade. |
| `identificacao.versao` | Núcleo | Toda ficha; versão exata é obrigatória. | Ausência não permite usar versão próxima. |
| `identificacao.ano_modelo` | Núcleo | Toda ficha; ano-modelo exato. | Ausência impede misturar geração/release. |
| `identificacao.mercado` | Núcleo | Toda ficha; mercado exato. | Ausência impede reutilizar fonte de outro país. |
| `identificacao.categoria` | Núcleo genérico | Toda ficha; catálogo/ficha oficial. | Ex.: automóvel, utilitário, motocicleta; não é default. |
| `identificacao.tipo_carroceria` | Núcleo genérico | Toda ficha; catálogo/ficha oficial. | Ex.: sedan, hatch, SUV, picape/caminhonete; taxonomia única. |
| `identificacao.cabine_tipo` | Condicional | Carrocerias que possuem cabine; ficha oficial. | `nao_aplicavel` fora desse contexto, nunca ausência silenciosa. |

## Motorização — 15

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `motorizacao.motor_nome` | Núcleo | Toda ficha; ficha/manual oficial. | Sem evidência: NF1. |
| `motorizacao.cilindrada_l` | Condicional | Motor térmico; ficha/manual oficial. | EV puro: não aplicável comprovado; conversão só pela política v1. |
| `motorizacao.configuracao_motor` | Condicional | Quando a arquitetura do motor for publicada. | Não deduzir cilindros/configuração. |
| `motorizacao.aspiracao` | Condicional | Motor térmico; ficha/manual oficial. | EV puro: não aplicável comprovado. |
| `motorizacao.potencia_cv` | Núcleo de propulsão | Toda ficha com potência publicada. | Converter somente regra v1; sem valor não estimar. |
| `motorizacao.potencia_rpm` | Condicional | Motor térmico ou dado oficial correspondente. | EV pode não publicar RPM: aplicar status explícito. |
| `motorizacao.torque_nm` | Núcleo de propulsão | Toda ficha com torque publicado. | Converter somente regra v1. |
| `motorizacao.torque_rpm` | Condicional | Quando fonte informar regime de torque. | EV pode não publicar RPM: não inventar. |
| `motorizacao.motor_tipo` | Núcleo genérico | Toda ficha; arquitetura de propulsão oficial. | Candidato a campo pai: combustão, elétrico, híbrido, PHEV etc. |
| `motorizacao.motor_combustivel` | Condicional | Propulsão com combustível; ficha/manual oficial. | EV puro: não aplicável comprovado. |
| `motorizacao.motor_eletrificacao_tipo` | Extensão condicional | Híbrido/PHEV/EV; ficha oficial. | Não pesquisar como requisito de combustão pura. |
| `motorizacao.motor_eletrico_presente` | Extensão condicional | Quando houver propulsão eletrificada. | Candidato a fundir na arquitetura de propulsão. |
| `motorizacao.autonomia_eletrica_km` | Extensão condicional | EV/PHEV com método oficial. | Combustão/híbrido sem autonomia elétrica: não aplicável comprovado. |
| `motorizacao.consumo_tipo` | Condicional | Quando houver métrica oficial; mercado/método importam. | Não comparar ciclos diferentes como iguais. |
| `motorizacao.consumo_valor` | Condicional | Quando houver métrica oficial e tipo correspondente. | Converter somente regra v1; sem unidade/método: NF1 ou conflito. |

## Transmissão, tração e cores — 8

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `transmissao_e_tracao.transmissao_tipo` | Núcleo | Toda ficha; ficha oficial. | Ex.: manual, automática, redução fixa; não deduzir. |
| `transmissao_e_tracao.transmissao_descricao` | Condicional | Quando a marca publicar detalhe. | NF1 é válido. |
| `transmissao_e_tracao.numero_marchas` | Condicional | Transmissão com marchas discretas. | EV/redução fixa: não aplicável ou valor oficial. |
| `transmissao_e_tracao.tipo_acionamento_cambio` | Condicional | Quando existir seletor/acionamento publicado. | Não confundir com transmissão. |
| `transmissao_e_tracao.tracao` | Núcleo | Toda ficha; fonte oficial. | Ex.: dianteira, traseira, integral, 4x4. |
| `transmissao_e_tracao.diferencial_dianteiro_blocante` | Extensão condicional | Veículos com diferencial dianteiro aplicável. | Não assumir `false`. |
| `transmissao_e_tracao.diferencial_traseiro_blocante` | Extensão condicional | Veículos com diferencial traseiro aplicável. | Não assumir `false`. |
| `cores_externas.cores_externas` | Condicional comercial | Catálogo de mercado/ano. | Lista só com catálogo correspondente; não usar lista vazia como ausência. |

## Exterior — 37

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `exterior.ajuste_eletrico_altura_farois` | Condicional | Equipamento/versão. | Não assumir `false`. |
| `exterior.estribo_plataforma` | Extensão condicional | Picape/SUV/utilitário ou pacote. | Não aplicável exige contexto. |
| `exterior.farois_neblina_led` | Condicional | Equipamento/versão. | Fonte de catálogo. |
| `exterior.farois_tipo` | Núcleo | Toda ficha com iluminação publicada. | Ex.: halógeno/LED/matriz; não deduzir. |
| `exterior.grade_radiador_ativa` | Condicional | Arquitetura/publicação oficial. | EV pode ter regra distinta; não presumir. |
| `exterior.grade_descricao` | Condicional | Quando a ficha descrever. | Não converter marketing em especificação. |
| `exterior.iluminacao_360` | Extensão condicional | Equipamento/versão. | Ausência explícita após pesquisa. |
| `exterior.lanternas_traseiras_led` | Condicional | Equipamento/versão. | Não assumir. |
| `exterior.drl` | Condicional | Mercado/versão. | Fonte oficial. |
| `exterior.moldura_paralamas_cor` | Extensão condicional | Carroceria/pacote. | Não aplicável só quando incompatível. |
| `exterior.parabarros_dianteiros` | Extensão condicional | Carroceria/pacote. | Não assumir. |
| `exterior.parabarros_traseiros` | Extensão condicional | Carroceria/pacote. | Não assumir. |
| `exterior.parachoque_cor` | Condicional | Versão/corpo do veículo. | Fonte de catálogo. |
| `exterior.pneus_medida` | Núcleo | Toda ficha com medida publicada. | Não usar medida de outra roda/pacote. |
| `exterior.pneus_modelo` | Extensão condicional | Quando fabricante publicar marca/modelo. | NF1 é esperado em muitos mercados. |
| `exterior.protetor_offroad_dianteiro` | Extensão condicional | Pacote off-road. | Não assumir `false`. |
| `exterior.protecoes_inferiores_offroad` | Extensão condicional | Pacote off-road. | Não aplicável exige contexto. |
| `exterior.retrovisores_ajuste_eletrico` | Condicional | Equipamento/versão. | Não assumir. |
| `exterior.retrovisores_indicador_direcao` | Condicional | Equipamento/versão. | Fonte de catálogo. |
| `exterior.retrovisores_rebatimento_eletrico` | Condicional | Equipamento/versão. | Não assumir. |
| `exterior.retrovisores_aquecimento` | Condicional | Mercado/clima/versão. | Não assumir. |
| `exterior.retrovisores_luz_cortesia` | Extensão condicional | Equipamento/versão. | Não assumir. |
| `exterior.rodas_material` | Condicional | Roda/pacote oficial. | Não usar genérico de modelo. |
| `exterior.rodas_aro_pol` | Condicional | Roda/pacote oficial. | Medida e fonte da versão. |
| `exterior.visual_descricao` | Extensão editorial | Quando fonte técnica descrever acabamento. | Não usar texto promocional como fato. |
| `exterior.pneus_tipo_uso` | Condicional | Pneu/pacote oficial. | Ex.: estrada, AT, MT; não inferir. |
| `exterior.pneus_tecnologias` | Extensão condicional | Quando fonte publicar. | NF1 válido. |
| `exterior.estepe_tipo` | Condicional | Mercado/versão. | Não assumir ausência. |
| `exterior.farol_funcionalidades` | Condicional | Equipamento/versão. | Lista com fonte. |
| `exterior.teto_tipo` | Núcleo genérico | Toda ficha; carroceria/versão. | Ex.: rígido, panorâmico, removível; não deduzir. |
| `exterior.portas_recursos` | Condicional | Carroceria/equipamento. | Lista com fonte. |
| `exterior.acabamentos_externos` | Extensão condicional | Pacote/versão. | Lista com fonte. |
| `exterior.bagageiro_teto_tipo` | Extensão condicional | Carroceria/equipamento. | Não assumir. |
| `exterior.estribo_lateral_tipo` | Extensão condicional | Carroceria/pacote. | Não assumir. |
| `exterior.adesivos_externos` | Extensão condicional | Série/pacote. | Não usar como núcleo. |
| `exterior.aerofolio_spoiler` | Extensão condicional | Carroceria/pacote. | Não assumir. |
| `exterior.alargadores_paralamas` | Extensão condicional | Carroceria/pacote. | Não assumir. |

## Interior e conforto — 31

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `interior_e_conforto.interruptores_auxiliares_qtd` | Extensão condicional | Versão utilitária/off-road. | Não assumir zero. |
| `interior_e_conforto.banco_motorista_ajuste` | Condicional | Equipamento/versão. | Fonte de catálogo. |
| `interior_e_conforto.banco_passageiro_ajuste` | Condicional | Equipamento/versão. | Fonte de catálogo. |
| `interior_e_conforto.aquecimento_bancos` | Condicional | Mercado/versão. | Não assumir. |
| `interior_e_conforto.revestimento_bancos` | Condicional | Versão/pacote. | Não usar acabamento de outra versão. |
| `interior_e_conforto.chave_presenca` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.partida_sem_chave` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.descansa_braco_traseiro` | Condicional | Carroceria/fileiras/versão. | Não aplicável exige contexto. |
| `interior_e_conforto.paddle_shifters` | Condicional | Transmissão/versão. | Manual/EV pode não aplicar. |
| `interior_e_conforto.painel_instrumentos_descricao` | Condicional | Quando fonte técnica publicar. | Não usar marketing. |
| `interior_e_conforto.painel_instrumentos_tamanho_pol` | Condicional | Painel digital publicado. | Analógico sem medida: não aplicável ou NF1. |
| `interior_e_conforto.retrovisor_eletrocromico` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.sensor_chuva` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.tomada_interna_120v` | Condicional de mercado | Mercado/versão. | Não assumir. |
| `interior_e_conforto.vidros_eletricos_sistema_global` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.vidros_eletricos_antiesmagamento` | Condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.volante_ajuste` | Condicional | Equipamento/versão. | Fonte de catálogo. |
| `interior_e_conforto.volante_revestimento` | Condicional | Versão/pacote. | Fonte de catálogo. |
| `interior_e_conforto.tomadas_tipo` | Condicional | Equipamento/mercado. | Lista com fonte. |
| `interior_e_conforto.tomadas_qtd` | Condicional | Equipamento/mercado. | Não usar zero como default. |
| `interior_e_conforto.tomadas_localizacao` | Condicional | Equipamento/mercado. | Lista com fonte. |
| `interior_e_conforto.tomadas_descricao` | Extensão condicional | Quando fonte descrever. | NF1 válido. |
| `interior_e_conforto.painel_instrumentos_tipo` | Núcleo genérico | Toda ficha; oficial. | Ex.: analógico, digital, híbrido. |
| `interior_e_conforto.hud_tipo` | Extensão condicional | Equipamento/versão. | Não assumir. |
| `interior_e_conforto.ar_condicionado_tipo` | Condicional | Equipamento/mercado. | Não assumir. |
| `interior_e_conforto.ar_condicionado_recursos` | Condicional | Equipamento/mercado. | Lista com fonte. |
| `interior_e_conforto.bancos_dianteiros_recursos` | Condicional | Equipamento/versão. | Lista com fonte. |
| `interior_e_conforto.bancos_traseiros_configuracao` | Condicional | Carroceria/fileiras. | Não aplicar em configuração sem traseiro. |
| `interior_e_conforto.fileiras_bancos_qtd` | Núcleo | Toda ficha de veículo de passageiros/cabine. | Veículos especiais exigem regra explícita. |
| `interior_e_conforto.volante_recursos` | Condicional | Equipamento/versão. | Lista com fonte. |
| `interior_e_conforto.vidros_recursos` | Condicional | Equipamento/versão. | Lista com fonte. |

## Multimídia e conectividade — 23

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `sistema_multimidia_e_conectividade.sistema_multimidia_nome` | Condicional | Versão/equipamento. | Não assumir sistema da linha. |
| `sistema_multimidia_e_conectividade.applink` | Condicional | Sistema/mercado. | Fonte oficial. |
| `sistema_multimidia_e_conectividade.assistencia_emergencia` | Condicional de mercado | Serviço ativo no mercado/ano. | Não inferir por existir em outro país. |
| `sistema_multimidia_e_conectividade.sistema_som_marca` | Extensão condicional | Versão/pacote. | NF1 válido. |
| `sistema_multimidia_e_conectividade.sistema_som_qtd_alto_falantes` | Extensão condicional | Versão/pacote. | Não usar zero/default. |
| `sistema_multimidia_e_conectividade.bluetooth` | Condicional | Sistema/versão. | Não assumir. |
| `sistema_multimidia_e_conectividade.comando_voz_ptbr` | Condicional de mercado | Idioma/mercado. | Não inferir por comando de voz genérico. |
| `sistema_multimidia_e_conectividade.comandos_audio_volante` | Condicional | Equipamento/versão. | Não assumir. |
| `sistema_multimidia_e_conectividade.android_auto_sem_fio` | Condicional | Sistema/ano/mercado. | Não confundir com Android Auto com fio. |
| `sistema_multimidia_e_conectividade.apple_carplay_sem_fio` | Condicional | Sistema/ano/mercado. | Não confundir com CarPlay com fio. |
| `sistema_multimidia_e_conectividade.entradas_usb` | Condicional | Equipamento/mercado. | Lista com fonte. |
| `sistema_multimidia_e_conectividade.navegador_gps` | Condicional | Sistema/mercado. | Não confundir espelhamento com GPS integrado. |
| `sistema_multimidia_e_conectividade.navegador_offroad` | Extensão condicional | Pacote off-road/sistema. | Não assumir. |
| `sistema_multimidia_e_conectividade.tela_central_touch` | Condicional | Sistema/versão. | Não assumir. |
| `sistema_multimidia_e_conectividade.tela_central_descricao` | Condicional | Quando fonte técnica publicar. | Não usar marketing. |
| `sistema_multimidia_e_conectividade.tela_multimidia_tamanho_pol` | Condicional | Sistema/versão. | Medida só com fonte. |
| `sistema_multimidia_e_conectividade.espelhamento_smartphone_tipo` | Condicional | Sistema/mercado. | Lista com fonte. |
| `sistema_multimidia_e_conectividade.assistente_digital_integrado` | Extensão condicional | Sistema/mercado. | Não assumir. |
| `sistema_multimidia_e_conectividade.loja_aplicativos_multimidia` | Extensão condicional | Sistema/mercado. | Não assumir. |
| `sistema_multimidia_e_conectividade.atualizacoes_ota` | Condicional | Serviço/mercado/ano. | Não assumir disponibilidade permanente. |
| `sistema_multimidia_e_conectividade.radio_tipo` | Condicional | Sistema/mercado. | Fonte oficial. |
| `sistema_multimidia_e_conectividade.wifi_hotspot` | Condicional de serviço | Mercado/plano/versão. | Não assumir serviço ativo. |
| `sistema_multimidia_e_conectividade.recursos_conectividade_multimidia` | Condicional | Sistema/mercado. | Lista com fonte. |

## Segurança — 27

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `seguranca.airbags_presente` | Núcleo | Toda ficha; oficial. | Não assumir quantidade. |
| `seguranca.airbags_qtd` | Condicional | Quando quantidade oficial publicada. | NF1 se mercado não publicar. |
| `seguranca.airbags_tipos` | Condicional | Quando tipos oficiais publicados. | Lista com fonte. |
| `seguranca.alarme_perimetrico` | Condicional | Versão/mercado. | Não assumir. |
| `seguranca.alerta_colisao` | Condicional | ADAS/versão. | Não assumir. |
| `seguranca.alerta_trafego_cruzado_re` | Condicional | ADAS/versão. | Não assumir. |
| `seguranca.assistente_frenagem_autonoma` | Condicional | ADAS/versão. | Não confundir alerta com frenagem. |
| `seguranca.assistente_frenagem_autonoma_re` | Extensão condicional | ADAS/versão. | Não assumir. |
| `seguranca.assistente_manobra_evasiva` | Extensão condicional | ADAS/versão. | Não assumir. |
| `seguranca.assistente_partida_rampa` | Condicional | Versão/mercado. | Não assumir. |
| `seguranca.assistente_permanencia_faixa` | Condicional | ADAS/versão. | Não confundir alerta com assistência. |
| `seguranca.assistente_centralizacao_faixa` | Condicional | ADAS/versão. | Não assumir. |
| `seguranca.camera_360` | Condicional | Equipamento/versão. | Não assumir. |
| `seguranca.cintos_traseiros_3_pontos` | Condicional | Bancos traseiros aplicáveis. | Não aplicar sem traseiro. |
| `seguranca.controle_eletronico_estabilidade` | Núcleo de segurança | Toda configuração que tenha publicação/regulação aplicável. | Fonte oficial/regulatória. |
| `seguranca.farol_alto_automatico` | Condicional | ADAS/versão. | Não assumir. |
| `seguranca.frenagem_pos_colisao` | Extensão condicional | ADAS/versão. | Não assumir. |
| `seguranca.limitador_velocidade` | Condicional | Versão/mercado. | Não assumir. |
| `seguranca.acc_stop_go` | Condicional | ADAS/transmissão/versão. | Não assumir. |
| `seguranca.piloto_automatico_offroad` | Extensão condicional | Pacote off-road. | Não assumir. |
| `seguranca.sensor_estacionamento_dianteiro` | Condicional | Equipamento/versão. | Não assumir. |
| `seguranca.sensor_estacionamento_traseiro` | Condicional | Equipamento/versão. | Não assumir. |
| `seguranca.monitoramento_ponto_cego` | Condicional | ADAS/versão. | Não assumir. |
| `seguranca.camera_tipo` | Condicional | Equipamento/versão. | Não assumir. |
| `seguranca.estacionamento_automatico_tipo` | Extensão condicional | ADAS/versão. | Não assumir. |
| `seguranca.controle_estabilidade_recursos` | Condicional | Quando fonte detalhar. | Lista com fonte. |
| `seguranca.alarme_tipo` | Condicional | Equipamento/mercado. | Não assumir. |

## Dinâmica, aplicativo e off-road — 33

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `tecnologia_dinamica.modos_amortecedor` | Extensão condicional | Suspensão/versão. | Não assumir. |
| `tecnologia_dinamica.modos_direcao` | Condicional | Direção/versão. | Não assumir. |
| `tecnologia_dinamica.modos_escapamento` | Extensão condicional | Motor/pacote. | EV: não aplicável comprovado. |
| `tecnologia_dinamica.modos_conducao` | Condicional | Versão/propulsão. | Lista com fonte. |
| `tecnologia_dinamica.cambio_eletronico` | Condicional | Transmissão/versão. | Não assumir. |
| `tecnologia_dinamica.direcao_eletrica_ajustavel` | Condicional | Direção/versão. | Não assumir. |
| `tecnologia_dinamica.tpms` | Condicional | Mercado/versão. | Não assumir. |
| `tecnologia_dinamica.start_stop` | Condicional | Motor térmico/híbrido. | EV: não aplicável comprovado. |
| `tecnologia_dinamica.sistema_monitoramento_pneus_tipo` | Condicional | Quando TPMS existir/publicado. | Não inventar tipo. |
| `tecnologia_dinamica.pro_power_disponivel` | Extensão condicional | Recurso/mercado/versão. | Não assumir. |
| `tecnologia_dinamica.pro_power_potencia_w` | Extensão condicional | Quando Pro Power existir. | Sem recurso: não aplicável comprovado. |
| `tecnologia_dinamica.engate_reboque_capacidade_kg` | Condicional | Reboque homologado/mercado. | Não usar dado de outro mercado. |
| `conectividade_via_aplicativo.alerta_alarme_celular` | Extensão condicional | App/serviço ativo. | Não assumir serviço. |
| `conectividade_via_aplicativo.alertas_funcionamento_veiculo` | Extensão condicional | App/serviço ativo. | Não assumir serviço. |
| `conectividade_via_aplicativo.partida_remota_agendada` | Extensão condicional | App/mercado/propulsão. | Não assumir. |
| `conectividade_via_aplicativo.partida_remota_ar_condicionado` | Extensão condicional | App/mercado/propulsão. | Não assumir. |
| `conectividade_via_aplicativo.localizacao_veiculo_celular` | Condicional de serviço | App/mercado/plano. | Não assumir. |
| `conectividade_via_aplicativo.status_remoto_combustivel` | Extensão condicional | App + combustível. | EV: não aplicável comprovado. |
| `conectividade_via_aplicativo.status_remoto_odometro` | Condicional de serviço | App/mercado/plano. | Não assumir. |
| `conectividade_via_aplicativo.travamento_remoto` | Condicional de serviço | App/mercado/plano. | Não assumir. |
| `conectividade_via_aplicativo.destravamento_remoto` | Condicional de serviço | App/mercado/plano. | Não assumir. |
| `conectividade_via_aplicativo.app_conectividade_recursos` | Condicional de serviço | App/mercado/plano. | Lista com fonte. |
| `conectividade_via_aplicativo.app_conectividade_ev` | Extensão condicional | App + eletrificação. | Combustão: não aplicável comprovado. |
| `conectividade_via_aplicativo.app_conectividade_seguranca` | Condicional de serviço | App/mercado/plano. | Lista com fonte. |
| `performance_offroad.freio_disco_4_rodas` | Condicional | Configuração/ficha oficial. | Não assumir. |
| `performance_offroad.freio_mao_eletronico` | Condicional | Equipamento/versão. | Não assumir. |
| `performance_offroad.suspensao_descricao` | Condicional | Quando fonte técnica publicar. | Não usar marketing. |
| `performance_offroad.motor_performance_descricao` | Extensão editorial | Quando fonte técnica publicar. | Não usar marketing. |
| `performance_offroad.suspensao_tipo` | Condicional | Ficha/manual oficial. | Não deduzir. |
| `performance_offroad.suspensao_recursos` | Extensão condicional | Pacote/versão. | Lista com fonte. |
| `performance_offroad.protecao_inferior_itens` | Extensão condicional | Pacote off-road. | Não assumir. |
| `performance_offroad.offroad_recursos` | Extensão condicional | Pacote off-road. | Lista com fonte. |
| `performance_offroad.ganchos_reboque_qtd` | Extensão condicional | Carroceria/pacote. | Não usar zero como default. |

## Dimensões, garantia e adicionais — 22

| Campo | Papel | Aplicabilidade e fonte mínima | Resultado seguro |
|---|---|---|---|
| `dimensoes_e_capacidade.peso_ordem_marcha_kg` | Núcleo | Ficha/homologação da versão. | Não usar peso de outra configuração. |
| `dimensoes_e_capacidade.capacidade_imersao_mm` | Extensão condicional | Veículo com dado oficial de imersão. | NF1 se não publicado; não assumir zero. |
| `dimensoes_e_capacidade.capacidade_carga_kg` | Condicional | Configuração/carroceria/homologação. | Não usar outra versão. |
| `dimensoes_e_capacidade.tanque_combustivel_l` | Condicional | Propulsão com tanque; ficha oficial. | EV puro: não aplicável comprovado. |
| `dimensoes_e_capacidade.altura_mm` | Núcleo | Ficha oficial da versão. | Não misturar acessórios. |
| `dimensoes_e_capacidade.largura_com_espelhos_mm` | Condicional | Quando fonte publicar essa convenção. | Não substituir por largura sem espelhos. |
| `dimensoes_e_capacidade.comprimento_mm` | Núcleo | Ficha oficial da versão. | Não misturar carroceria. |
| `dimensoes_e_capacidade.distancia_entre_eixos_mm` | Núcleo | Ficha oficial da versão. | Não misturar plataforma. |
| `garantia_servicos_e_comercial.preco_publico` | Condicional temporal | Mercado/ano/data da fonte. | Nunca default; registrar referência temporal. |
| `garantia_servicos_e_comercial.garantia_anos` | Condicional comercial | Mercado/veículo/garantia geral. | Fonte oficial vigente. |
| `garantia_servicos_e_comercial.garantia_limite_km` | Condicional comercial | Mercado/veículo/garantia geral. | Fonte oficial vigente. |
| `garantia_servicos_e_comercial.revisao_preco_fixo` | Condicional de serviço | Mercado/serviço vigente. | Não assumir programa ativo. |
| `garantia_servicos_e_comercial.agendamento_online_servico` | Condicional de serviço | Mercado/serviço vigente. | Não assumir. |
| `garantia_servicos_e_comercial.servico_sem_sair_de_casa` | Extensão condicional | Mercado/serviço vigente. | Não assumir. |
| `garantia_servicos_e_comercial.garantia_bateria_anos` | Extensão condicional | EV/híbrido com bateria trativa. | Combustão: não aplicável comprovado. |
| `garantia_servicos_e_comercial.garantia_bateria_limite_km` | Extensão condicional | EV/híbrido com bateria trativa. | Combustão: não aplicável comprovado. |
| `garantia_servicos_e_comercial.garantia_componentes_tipo` | Condicional comercial | Quando termo oficial detalhar. | Lista com fonte. |
| `adicionais.adicionais_externos` | Extensão condicional | Catálogo/pacote. | Lista com detalhe rastreável. |
| `adicionais.adicionais_internos` | Extensão condicional | Catálogo/pacote. | Lista com detalhe rastreável. |
| `adicionais.adicionais_seguranca` | Extensão condicional | Catálogo/pacote. | Lista com detalhe rastreável. |
| `adicionais.adicionais_tecnologia` | Extensão condicional | Catálogo/pacote. | Lista com detalhe rastreável. |
| `adicionais.adicionais_conectividade` | Extensão condicional | Catálogo/pacote/serviço. | Lista com detalhe rastreável. |

## Casos de decisão obrigatórios para qualquer implementação futura

1. **Sedan e picape:** ambos preenchem `tipo_carroceria` com taxonomia genérica; `cabine_tipo` somente recebe valor quando a carroceria/configuração o suportar.
2. **Combustão:** `motor_tipo` resolve a propulsão; dados exclusivamente elétricos terminam em `nao_aplicavel` somente quando isso for comprovado, e não são omitidos.
3. **EV/PHEV:** campos elétricos são pesquisados e recebem fonte, ausência ou conflito; não recebem valor de combustão por fallback.
4. **Opcional de pacote:** a ausência no catálogo da versão é `nao_encontrado` após pesquisa mínima; não é `false` por padrão.
5. **Fonte incompatível:** mesmo que contenha valor, não pode confirmar o campo se marca/mercado/tipo de fonte contrariar a política.
6. **Ficha final:** 204/204 caminhos válidos, 199/199 campos com estado terminal e 5/5 coleções presentes; qualquer omissão é erro de contrato, não redução de escopo.
