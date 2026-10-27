# Mau Odor — Caderno de campo urbano

Protótipo visual e interativo do Sistema Participativo de Monitoramento e Análise de Mau Odor Urbano com IA no entorno da UFN — Santa Maria/RS.

## Avaliação do protótipo

Esta publicação permite avaliar o fluxo, a clareza dos textos, a direção visual e as interações no computador e no celular. O mapa e os cenários de IA são demonstrativos. Os relatos ficam somente no navegador de quem testa; não são enviados ao pesquisador.

## Abrir

Abra **index.html** no navegador. É um HTML único com Tailwind compilado, CSS, JavaScript, ilustrações SVG e mapa incorporados. Não exige instalação para visualizar. Somente a consulta meteorológica precisa de rede.

Para usar o contexto local de desenvolvimento e recursos que dependem do navegador:

```sh
node serve.mjs
```

Acesse `http://127.0.0.1:4173`. O servidor se restringe à máquina local. GPS depende da autorização e suporte do navegador; a opção de câmera usa `capture="environment"`, que pode abrir a galeria em computadores. Nenhuma permissão é solicitada antes de tocar no controle correspondente.

## Conteúdo

- `CONCEITO-VISUAL.md`: direção de arte, componentes, interações e relação com requisitos conhecidos.
- `mau-odor-nanquim.html`: estrutura editável, usando os arquivos separados.
- `styles.css`: tokens, composição, componentes e responsividade.
- `illustrations.js` / `illustrations.css`: oito ilustrações e animações autorais, panorama do ar e volutas.
- `map.js` / `map.css`: cartografia ilustrativa interativa e isolinhas demonstrativas.
- `app.js`: formulário, revisão, foto, GPS, clima, armazenamento e exportação.
- `tailwind.input.css` / `tailwind.css`: fonte e saída compilada do Tailwind 4.
- `build.mjs`: gera o HTML autocontido em `entrega/` e atualiza `index.html`, publicado pelo GitHub Pages.

## Recompilar

Node.js e pnpm instalados:

```sh
pnpm install
pnpm run build
```

Se alterar somente CSS personalizado, HTML ou JavaScript, `node build.mjs` atualiza o HTML único. Alterações em classes Tailwind exigem também `pnpm run build:css`.

## Comportamentos implementados

- Intensidade 1–5 por radios nativos, com teclas táteis e números rolantes.
- Oito tipos em seleção múltipla com SVGs, microanimações e informação independente.
- Campo condicional para “Outros”, tags rápidas, exclusividade de “Nada aparente” e limite de 400 caracteres.
- Foto JPG/PNG/WebP até 8 MB, validação, prévia e remoção; revisão aguarda o carregamento.
- Opção de ausência de foco visível, separando evidência visual da percepção.
- Horário de São Paulo, GPS após permissão e clima via Open-Meteo com estado de indisponibilidade.
- Revisão, armazenamento local de até 100 relatos, persistência, exportação JSON e confirmação para apagar.
- Mapa com pontos inspecionáveis, zoom, arraste, tela inteira, camadas e cenários visuais de modelos.
- Foco visível, diálogos nativos, estados textuais, suporte a redução de movimento e controle de pausa.

## Limites explícitos

O mapa é **esquemático, sem precisão cartográfica**. Os oito pontos e as isolinhas são demonstrações. Os seletores Decision Tree/Random Forest mudam o cenário gráfico; **nenhum modelo é executado**. Não há inferência de visão computacional, causa comprovada nem envio a banco compartilhado.

Os relatos são gravados no `localStorage` deste navegador e origem. Não se transferem automaticamente entre arquivo local, localhost, outro endereço ou outro dispositivo. **As fotos ficam apenas na memória da sessão**; o JSON inclui metadados, sem a imagem. A revisão informa isso antes de salvar. Os campos `multiHot`, `verificationStatus`, `causeProven` e `ai` tornam essa distinção explícita na exportação.

A consulta de clima usa a área de estudo enquanto não houver GPS. Depois da autorização, usa a região do GPS com coordenadas arredondadas a duas casas decimais, transmitidas à Open-Meteo. O GPS exato fica no relato local. O clima retornado pelo serviço é contexto meteorológico, não uma medição química ou sensor instalado no local.

A meta de preenchimento em 30 segundos ainda exige avaliação com participantes. Cartografia validada, backend, política de retenção de fotos e modelos científicos são etapas de integração posteriores.

## Verificação desta entrega

Verificado em navegador desktop e viewport móvel: seleção única/múltipla, botão informativo independente, validação obrigatória, “Outros”, exclusividade das tags, prévia/remoção de imagem, revisão, salvamento, persistência e download JSON. O clima retornou dados no teste. Zoom, camadas e alternância dos cenários também foram verificados.

GPS real e abertura da câmera física dependem do equipamento/permissão e não foram exercitados no teste. Não há afirmação de conformidade integral com WCAG ou de validação científica.

## Referências

Direção visual baseada nas oito imagens fornecidas pelo usuário, traduzida em desenhos SVG originais. Referências de interação: [Hairline](https://hairline.lucasmarkes.com/docs), [Motes](https://motes.lucasmarkes.com), [input-otp](https://input-otp.rodz.dev). A escala implementa seleção única, não autenticação por OTP. Clima: [documentação Open-Meteo](https://open-meteo.com/en/docs).

## Atualizar a publicação

Edite os arquivos-fonte, execute `pnpm run build` e envie as alterações para a mesma branch configurada no GitHub Pages. O arquivo `index.html` precisa acompanhar o envio. O Pages publica a nova versão mantendo o mesmo endereço. Alterar arquivos apenas no computador não atualiza o repositório.
