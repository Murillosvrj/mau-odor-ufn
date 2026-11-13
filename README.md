# WAIND — GPT 0.7

[Aplicativo](https://murillosvrj.github.io/mau-odor-ufn/) · [Painel](https://murillosvrj.github.io/mau-odor-ufn/painel.html)

Pesquisa de Murillo Viçosa, UFN, Santa Maria/RS, organizada por Design Science Research. A intensidade humana de 1 a 5 vem primeiro. O aplicativo registra percepções; não mede substâncias, não comprova fonte e ainda não apresenta estimativas por IA.

## Conta, autoria e privacidade

Entrada Google e e-mail/senha, recuperação de senha e sessão persistente. Perfil privado com somente UID, nome, e-mail, provedor e timestamps. Alterar o perfil não reescreve relatos históricos. Sessões anônimas podem vincular credenciais; relatos antigos nunca são atribuídos por coincidência de e-mail.

Consentimento obrigatório `waind-pesquisa-mapa-0.7`, incluindo conta autenticada. Cada envio cria atomicamente `relatos_pesquisa` + `relatos_mapa` e, quando há imagem, `relatos_fotos`, no mesmo UUID. Privados recebem `autor_uid`; o relato registra também o provedor. O participante lê somente seus relatos e perfil. Fotos não permitem leitura por nenhum cliente. Relatos são imutáveis.

O mapa tem exatamente latitude, longitude, intensidade, categorias fechadas, data, hora, temperatura e qualidade. Não contém nome, e-mail, UID, endereço, texto livre, foto ou metadados de foto. Coordenadas/horários públicos permitem inferências; não há anonimato absoluto. O consentimento informa essa exposição. App Check permanece preparado e desativado. Spark, sem Storage, Blaze ou Firebase Hosting.

Histórico ordenado por data/hora, paginado em 50 registros, combinado com pendências do mesmo UID. Trocar/sair de conta limpa a visualização e preserva pendências separadas. O JSON contém somente a conta atual e as páginas carregadas, sem Base64; tem informações privadas. A chave local da 0.6 é preservada, sem reivindicar autoria antiga ou reenviar aceites anteriores.

Fotos opcionais reencodificadas sem copiar EXIF, até 640 px e 140 KB, com SHA-256. Base64 persiste na pendência até confirmação e é removido depois. Não há sincronização com página fechada nem service worker para primeira abertura offline. Apagar dados do navegador remove pendências não enviadas. Clima atual de Open-Meteo não representa clima histórico.

## Executar e compilar

```sh
node serve.mjs
node build.mjs
```

Abra `http://127.0.0.1:4174`. Build atualiza `index.html`, `entrega/index.html` e `entrega/painel.html`; fontes `waind.html` e `painel.html` permanecem modulares. Não há dependências para build/servidor. Firebase SDK oficial vem de gstatic. Configuração específica da prévia com emuladores não integra a publicação.

## Preparação de produção

Habilitar Google e e-mail/senha no Firebase Auth, autorizar `murillosvrj.github.io`, publicar regras e índice `autor_uid ASC, data DESC, hora DESC`. A nova interface requer backend 0.7: a 0.6 não aceita os novos campos/autoria e não fornece histórico privado. Com Firebase CLI autenticada e IAM suficiente:

```sh
firebase deploy --only firestore:rules,firestore:indexes --project waind-ufn-dev
```

Esperar o índice ficar pronto. Validar Google OAuth e reset de senha em produção. Há fallback de popup bloqueado para redirecionamento; cookies entre GitHub Pages e Firebase podem limitar o fluxo em certos navegadores/webviews. Oferecer e-mail/senha ou navegador compatível, sem pedir redução da segurança do navegador.

`firebase-config.js` contém configuração Web pública sem poderes administrativos. Regras/IAM controlam acesso. Nunca publicar chave de serviço, token, senha, salt, snapshot ou dataset. `.gitignore` é auxiliar: a cópia completa usa `documentacao/preparar-github.mjs` com lista explícita de arquivos. Não enviar a pasta inteira do projeto ao GitHub.

## Pesquisa e validação

Contrato, exportador e notebook limpo ficam em `pesquisa/` no pacote público e `documentacao/` na cópia completa. São ferramentas sem dados reais. Seus resultados, imagens e credenciais devem ficar privados. Leia o contrato antes de executar. O lote sintético testa pipeline; não há modelo de campo validado.

Validação local: 57 testes de regras no emulador oficial; desktop 1365 px e mobile 390 px com cadastro por e-mail, persistência, isolamento conta/fila/JSON, foto offline, sincronização, idempotência e histórico em outro contexto. Testes do exportador e notebook com 60 registros sintéticos. Google real e reset de senha por e-mail dependem da validação administrativa. A existência destes fontes não confirma implantação de produção.

Marca, oito ilustrações, movimentos, escala térmica, mapa vetorial e processamento de fotos preservam a GPT 0.6. Atribuições MapLibre, OpenFreeMap/OpenStreetMap e Open-Meteo mantidas. Preservar materiais CRIKOS e legados independentes em atualizações remotas.
