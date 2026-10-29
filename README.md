# WAIND — Caderno de campo urbano

Protótipo de um sistema participativo de monitoramento e análise de mau odor urbano em Santa Maria e região/RS, desenvolvido como pesquisa na Universidade Franciscana. Esta publicação permite avaliar o fluxo, o texto, a direção visual e as interações no computador e no celular.

[Abrir WAIND](https://murillosvrj.github.io/mau-odor-ufn/)

## O que funciona

- Capa WAIND com emblema vetorial em nanquim; sete etapas com navegação inferior e progresso.
- Abertura coreografada, transições de vento da esquerda para a direita, ilustrações com movimento ambiente e reações ao mouse. Pausa e preferência de movimento reduzido respeitadas.
- Identificação, confirmação de contexto e GPS opcional.
- Triagem da percepção atual. Quem não sente odor pode registrar uma ocorrência anterior com data/hora aproximadas ou explorar o mapa sem criar relato.
- Escala de intensidade de 1 a 5 com informações próprias em cada tecla, oito categorias ilustradas e animadas, explicações e descrição de Outros.
- Fotografia opcional por câmera ou galeria, prévia, indicação de ausência de foco visível, tags e observação livre.
- Mapa vetorial real em papel e nanquim, prédios hachurados, nomes de ruas apenas a partir do zoom 15, sem POIs/ícones comerciais. Roda do mouse, pinça, arraste, teclado, mira e coordenadas manuais.
- Calor georreferenciado dos relatos deste navegador e da prévia atual, com cores 1–5, soma suave e isolinhas. Pontos locais abrem intensidade, categorias e horário; não exibem nome ou e-mail.
- Revisão, edição, salvamento neste navegador e exportação JSON.

## Dados e limites desta avaliação

**“Enviar Relato” salva apenas neste navegador. Os dados não são enviados à UFN.** Não existe backend de coleta compartilhada, reconhecimento automático da foto ou modelo de IA em execução. Nome, e-mail e informações do relato ficam no localStorage da origem do site, na chave `waind-relatos-local-v2`. A exportação JSON inclui esses dados; evite compartilhar o arquivo com informações pessoais sem intenção.

A fotografia fica somente na sessão e não é enviada para análise. O registro salvo e o JSON contêm apenas seus metadados, não a imagem. Fechar/recarregar a página remove a foto da sessão e reinicia o rascunho; os relatos já salvos continuam no caderno local. Os botões Voltar e Continuar preservam o preenchimento durante a sessão.

GPS depende da permissão do navegador. Um pin manual indica a escolha da pessoa e não tem precisão medida por sensor. A câmera depende do aparelho e das permissões; a galeria permite escolher um arquivo local.

## Mapa vetorial e refinamentos — 29/10/2026

A etapa inicial chama-se “Início e contexto”, sem legenda redundante no rodapé. Os cinco botões “i” das intensidades abrem o mesmo diálogo editorial das categorias sem alterar o rádio selecionado.

Ao abrir a tela final, o mapa usa o GPS já capturado em zoom 16,5. Se ainda não há captura, solicita uma posição; durante a espera mostra “Localizando sua posição”. Recusa/indisponibilidade usa Santa Maria como referência em zoom 12. O botão ⌂ volta ao GPS atual ou a Santa Maria, preservando o pin escolhido. O calor não usa dados fictícios: sem relatos geográficos ou pino em prévia não há manchas. Um campo gaussiano local soma pesos de intensidade e gera isolinhas por marching squares. Cor e alcance variam de 1 a 5. Os raios são uma convenção visual, não estimativa física de dispersão, medição química ou resultado de ML.

Renderização por [MapLibre GL JS 5.24.0](https://maplibre.org/) (BSD-3-Clause, licença em `MAPLIBRE-LICENSE.txt`) e vetores gratuitos de [OpenFreeMap](https://openfreemap.org/quick_start/), com dados [OpenMapTiles](https://openmaptiles.org/) / [OpenStreetMap](https://www.openstreetmap.org/copyright). O estilo é uma lista explícita de camadas geométricas e um único rótulo de nomes de ruas; não herda POIs, sprites, números de imóveis ou placas do estilo padrão. As hachuras são geradas localmente. Biblioteca e CSS acompanham os fontes e estão incorporados ao HTML compilado. Tiles e glifos exigem rede; sem rede ou WebGL, as coordenadas manuais e a revisão continuam disponíveis, com aviso claro e sem ruas inventadas. Os relatos e os pontos de calor permanecem locais; o provedor recebe as requisições cartográficas normais da área vista.

## Refinamento do Passo 1 — 29/10/2026

Horários visíveis usam “Horário de Brasília”; internamente permanece `America/Sao_Paulo`. O GPS solicita uma captura nova no clique (alta precisão, timeout de 15 segundos, sem cache de posição). O contexto regional usa uma referência aproximada de 45 km do centro de Santa Maria, não um limite municipal oficial. O clima acompanha o ponto capturado, com coordenadas arredondadas em duas casas decimais. O mapa permite zoom de 10 a 19; o GPS centraliza sem transformar a posição em um pin manual confirmado.

Marcar Fotografia solicita acesso à câmera por `getUserMedia`, sem microfone, e encerra todas as tracks do teste imediatamente. Permissão negada, câmera ausente ou espera pelo prompt não bloqueiam o formulário. A galeria continua disponível pelo seletor de arquivos na etapa 05; não existe permissão geral de galeria concedida por esse checkbox. O navegador decide se deve exibir novamente um prompt já autorizado ou bloqueado. Os relatos locais aparecem apenas no Passo 7 com identificação válida ou após concluir o registro.

**Endereços: [política de uso do Nominatim](https://operations.osmfoundation.org/policies/nominatim/).** A consulta reversa é disparada pelo GPS solicitado pela pessoa, com cache na sessão, espaçamento mínimo de 1,1 segundo neste navegador, identificação pelo Referer e atribuição OpenStreetMap visível. O serviço público tem limite agregado de 1 requisição/segundo por aplicação, somando todos os usuários: esta integração atende à avaliação de pequeno porte. Antes de ampliar o uso simultâneo, configurar um proxy com cache e limite compartilhado, ou contratar/hospedar outro serviço compatível. `geocoding-config.json` permite trocar `reverseUrl` ou desativar a consulta com `enabled:false` sem alterar/recompilar o código. Coordenadas são enviadas ao serviço para obter rua/CEP; nome, e-mail, foto e texto do relato não são enviados. Endereços são aproximados e podem faltar; a captura GPS continua disponível sem rede.

O mapa usa [OpenStreetMap](https://www.openstreetmap.org/copyright), com atribuição visível, e requer internet. O clima usa [Open-Meteo](https://open-meteo.com/) com coordenadas arredondadas. Esses serviços recebem as requisições normais de rede. Nos relatos anteriores, o clima é identificado como atual, sem representar as condições históricas da ocorrência.

## Executar e editar

O arquivo `index.html` reúne HTML, CSS, JavaScript e SVGs. Para testar mapa, clima e permissões, recomenda-se um servidor local com Node.js:

```sh
node serve.mjs
```

Abra http://127.0.0.1:4174. Não é necessário instalar dependências. Os estilos Tailwind utilizados já estão compilados em `tailwind.css`.

Edite `waind.html`, `app.js`, `wizard.js`, `brand.js`, `pin-map.js` e os respectivos CSS. As ilustrações estão em `illustrations.js` e `illustrations.css`. Para gerar novamente o HTML autocontido:

```sh
node build.mjs
```

O build grava `entrega/index.html` e atualiza `index.html` na raiz. Também pode ser executado por `npm run build` ou `pnpm run build`.

## Publicação

O GitHub Pages usa a branch `main`, pasta raiz. Depois de validar uma mudança, envie o código e o `index.html` recompilado para essa branch e aguarde a implantação. O endereço público permanece o mesmo. Editar arquivos somente no computador não atualiza o repositório ou o site.

## Versão anterior

`mau-odor-nanquim.html` preserva a versão anterior autocontida. `map.js` e `CONCEITO-VISUAL.md` documentam a direção anterior e não são executados pelo WAIND. Referências originais, backups, manifesto do Drive, histórico privado e dados reais de participantes não fazem parte deste pacote público.

