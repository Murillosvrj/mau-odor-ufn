# WAIND — Contrato privado do dataset 0.7

O relato registra uma percepção humana de odor entre 1 e 5. A intensidade é o alvo; não representa concentração química, presença/ausência ou comprovação de fonte. A estimativa futura ocorre depois do relato, em documento separado. A coleta de campo ainda não começou.

## Exportação e acesso

`exportar-dataset-pesquisa.mjs` faz somente leituras administrativas e une `relatos_pesquisa`, `relatos_mapa` e `relatos_fotos` pelo UUID. Aceita snapshot JSON local ou Firebase Admin SDK com Application Default Credentials autorizadas. A configuração pública do aplicativo não concede acesso administrativo. Nunca coloque credenciais no código, notebook ou repositório. Para usar Admin, instale `firebase-admin` no ambiente do script; snapshots não precisam dessa dependência.

Formato do snapshot: `{ "collections": { "relatos_pesquisa": { "UUID": {} }, "relatos_mapa": { "UUID": {} }, "relatos_fotos": { "UUID": {} } } }`. Também aceita listas `{id,data}` por coleção. Não é o formato binário do backup gerenciado do Firestore; esse backup deve ser restaurado em ambiente autorizado antes da leitura administrativa.

Exemplo com caminhos privados fora da pasta do site:

```sh
node pesquisa/exportar-dataset-pesquisa.mjs --snapshot /privado/snapshot.json --out /privado/dataset_privado/lote-001 --salt-file /privado/.segredos/salt.bin --create-salt
```

Na cópia completa do Drive o script fica em `documentacao/`, e a lista de QA em `waind-preview/qa-ids.json`. No pacote público ficam em `pesquisa/` e `qa-ids.json` na raiz. Exemplo de emulador, sempre técnico:

```sh
node documentacao/exportar-dataset-pesquisa.mjs --admin --project demo-waind-gpt07 --emulator 127.0.0.1:8087 --out /privado/dataset_privado/tecnico-001 --salt-file /privado/.segredos/salt.bin --create-salt --technical
```

Para produção: `--admin --project waind-ufn-dev`, com identidade IAM de leitura já autorizada, sem `--emulator`. Para snapshots de simulação use `--technical`; emuladores são sempre técnicos. Não sobrescreve dataset existente. O salt é criado uma vez com 32 bytes aleatórios e deve ficar privado; sua perda impede repetir os pseudônimos.

## Saída versionada

`manifesto.json` identifica `waind-dataset-0.7`, fonte, data, contagens, IDs técnicos excluídos, parâmetros de agrupamento e SHA-256 de `registros.jsonl`. `tabela.csv` é uma visão resumida; o notebook usa o JSONL completo. Imagens validadas ficam em `fotos/{UUID}.webp|jpg`. Toda a pasta é privada: texto livre, imagens, localização e pseudônimos podem permitir reidentificação.

| Papel | Conteúdo e uso |
| --- | --- |
| `alvo` | `intensidade_humana`, inteiro de 1 a 5, extraído de `intensidade_odor.nivel`. Somente y. |
| `entradas_estruturadas` | Categorias e oito indicadores `multi_hot`, contexto visível, ausência de foco visível, data/hora, ocorrência atual/anterior, coordenadas e clima. |
| `entradas_texto` | Descrição de Outros, observação, original e `texto_sem_indicio_direto`, com rótulos/nota/intensidade explícitos e e-mails mascarados para comparação. |
| `entrada_visual` | Caminho relativo, largura, altura e `tem_foto`. Ausência é `null`; nenhuma foto é inventada. |
| `controle_coleta_e_divisao` | UUID, consentimento, origem da localização, qualidade, modalidades presentes, grupo ocorrência/foto, pseudônimo, hash/tamanho da foto e origem campo/técnica. Controles nunca entram em X. |

Categorias fixas: `waste`, `container`, `sewer`, `ditch`, `organic`, `metabolic`, `chemical`, `other`. Os oito valores devem corresponder às categorias selecionadas. Ausências meteorológicas permanecem nulas/NaN. Para `tipo_ocorrencia: anterior`, o clima só é mantido quando o relato traz `clima.momento: historico-horario` (0.8: consulta Open-Meteo da hora informada, na região do ponto); caso contrário, todas as variáveis de clima são anuladas e `clima_valido_para_ocorrencia: false`: clima atual nunca é convertido em histórico. O clima exportado tem `temperatura_c`, `umidade_pct`, `vento_kmh`, `rajada_kmh`, `vento_dir_sin`, `vento_dir_cos` (direção de onde o vento vem, codificada como seno/cosseno) e `condicao_codigo`; relatos 0.5–0.7 não têm direção nem rajada e exportam esses campos nulos. `controle_coleta_e_divisao.clima_momento` registra a origem do clima. É contexto regional modelado, não medição no ponto.

O pseudônimo é HMAC-SHA-256 com salt privado sobre o UID e separador de domínio WAIND. Não exporta UID, nome, e-mail nem perfil. Relatos antigos sem autoria recebem pseudônimo nulo; não inferir autoria pelo e-mail. O texto original continua privado e pode conter identificação escrita pelo participante; mascarar expressões não constitui anonimização completa.

## Integridade e exclusão de QA

Verifica par público com exatamente oito campos, coerência com relato, consentimento reconhecido 0.5/0.6/0.7 e intensidade válida. Não atualiza consentimentos nem reatribui autoria antiga. Fotografias exigem vínculo com relato/autor, Base64 canônico, até 143360 bytes, SHA-256 recalculado, assinatura WebP/JPEG, dimensões reais até 640 px e metadados/rótulos coerentes. Falhas interrompem a exportação.

Todos os IDs de `qa-ids.json` (6 da GPT 0.5, 3 da 0.6 e 32 UUIDs reservados da 0.7) e qualquer relato em latitude -80, longitude 0 são excluídos. O painel usa a mesma lista, incorporada também ao notebook. Os UUIDs `71000000-0000-4000-8000-000000000001` a `...003` são fixtures exclusivamente locais do teste do exportador, nunca enviados à produção; a saída é `sintetico-pipeline`. Não misturar com campo. A prévia local usa somente projeto `demo-` de emulador.

## Vazamento e avaliação

`assertInputs` bloqueia recursivamente `nome`, `email`, `autor_uid`, `uid`, `provedor_auth`, `alvo`, `intensidade_humana`, `intensidade_odor`, `rotulos_ml`, `intensidade_nivel` e `intensidade_estimada` nas entradas X. Bloqueia assim `intensidade_odor.nivel/rotulo` e `rotulos_ml.intensidade_nivel`. Features explícitas excluem controles, identificadores e grupos.

Fotos com mesmo SHA-256 ou ocorrências a até 100 metros e 120 minutos formam componentes conectados; `--group-meters` e `--group-minutes` explicitam o critério. Agrupamento não comprova causa comum; o custo quadrático é adequado ao piloto. Divisões por dia/participante unem também ocorrência/foto para impedir sobreposição. Com poucos grupos, a avaliação é inviável; não substituir por divisão aleatória. Pseudônimos ausentes impedem avaliação entre participantes para esses relatos.

O notebook implementa referência mediana; árvore/floresta; embeddings multilíngues fixos com original versus mascarado; extrator visual fixo e vizinhos; combinação com abstenção experimental. Transformações e limiar de distância usam somente treino. Métricas: MAE em níveis arredondados 1–5, acerto exato, matriz de confusão, por nível, com/sem foto/texto e cobertura da abstenção. O limiar não é confiança calibrada. Reservar teste final independente antes de ajustar hiperparâmetros. Generalização para locais novos permanece uma extensão necessária.

Padrão: 60 exemplos sintéticos, somente pipeline. Texto/imagem exigem `EXECUTAR_EMBEDDINGS` e download de pesos. A validação entregue executou apenas os experimentos 1 e 2: não há desempenho real ou modelo pronto para integração.

## Predições futuras, coleção separada

`relatos_predicoes/{predicaoId}` deverá ter schema fechado e gravação apenas administrativa:

```json
{
  "relato_id": "UUID_DO_RELATO",
  "versao_modelo": "identificador-imutavel-do-modelo",
  "versao_contrato": "waind-dataset-0.7",
  "processado_em": "TIMESTAMP_DO_SERVIDOR",
  "modalidades_utilizadas": ["estruturada", "texto_mascarado", "imagem"],
  "abstencao": false,
  "intensidade_estimada": 3,
  "motivo_abstencao": null
}
```

Falta de suporte: `abstencao: true`, `intensidade_estimada: null`, motivo explícito. Nunca usar zero como intensidade. Registrar hashes/versões dos artefatos de treino administrativamente. Nunca modificar nota humana, `relatos_mapa`, cor do ponto ou relato original. As regras atuais negam acesso cliente a essa coleção; integração ainda não implementada.

## Consenso, viés e retreino (0.8)

`waind_consenso_vies_retreino_colab.ipynb` lê esta exportação e: agrupa relatos (100 m / 120 min, ou o `grupo_ocorrencia_ou_foto` exportado); estima o viés de cada `participante_pseudo_id` com encolhimento; calcula a intensidade ajustada (nota − viés, limitada a 1–5) e o consenso por grupo (mediana bruta, média ajustada, dispersão). Treina por grupo e só promove um modelo quando cumpre os mínimos (100 relatos, 15 participantes, 20 grupos, 8 grupos com 2+ pessoas) e vence a mediana por 0,05 nível nas divisões por grupo e por local. Cada rodada grava `registro.json`, consenso, viés e intensidade ajustada em `WAIND/modelos/<data>_<modo>/`; só a promoção em campo atualiza `vigente.json`. A nota humana nunca é alterada.
