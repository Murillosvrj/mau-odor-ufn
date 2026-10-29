# WAIND — Caderno de campo urbano

Protótipo de um sistema participativo de monitoramento e análise de mau odor urbano no entorno da Universidade Franciscana, em Santa Maria/RS. Esta publicação permite avaliar o fluxo, o texto, a direção visual e as interações no computador e no celular.

[Abrir WAIND](https://murillosvrj.github.io/mau-odor-ufn/)

## O que funciona

- Capa WAIND com emblema vetorial em nanquim; sete etapas com navegação inferior e progresso.
- Abertura coreografada, transições de vento da esquerda para a direita, ilustrações com movimento ambiente e reações ao mouse. Pausa e preferência de movimento reduzido respeitadas.
- Identificação, confirmação de contexto e GPS opcional.
- Triagem da percepção atual. Quem não sente odor pode registrar uma ocorrência anterior com data/hora aproximadas ou explorar o mapa sem criar relato.
- Escala de intensidade de 1 a 5, oito categorias ilustradas e animadas, explicações e descrição de Outros.
- Fotografia opcional por câmera ou galeria, prévia, indicação de ausência de foco visível, tags e observação livre.
- Mapa geográfico real em preto e branco, com clique/toque, teclado, mira, zoom, coordenadas manuais e resumo no pin.
- Revisão, edição, salvamento neste navegador e exportação JSON.

## Dados e limites desta avaliação

**“Enviar Relato” salva apenas neste navegador. Os dados não são enviados à UFN.** Não existe backend de coleta compartilhada, reconhecimento automático da foto ou modelo de IA em execução. Nome, e-mail e informações do relato ficam no localStorage da origem do site, na chave `waind-relatos-local-v2`. A exportação JSON inclui esses dados; evite compartilhar o arquivo com informações pessoais sem intenção.

A fotografia fica somente na sessão e não é enviada para análise. O registro salvo e o JSON contêm apenas seus metadados, não a imagem. Fechar/recarregar a página remove a foto da sessão e reinicia o rascunho; os relatos já salvos continuam no caderno local. Os botões Voltar e Continuar preservam o preenchimento durante a sessão.

GPS depende da permissão do navegador. Um pin manual indica a escolha da pessoa e não tem precisão medida por sensor. A câmera depende do aparelho e das permissões; a galeria permite escolher um arquivo local.

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
