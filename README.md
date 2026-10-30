# WAIND — integração Firebase para avaliação

Versão local `0.5.0-dev`, preparada sobre a GPT 0.4 publicada, commit `3c334ae836a820b042cdfa3b7ebd1979319f7c14`.

## O que mudou

O botão Enviar Relato agora grava no Firestore de desenvolvimento e só confirma depois da resposta do banco. Nome e e-mail continuam no formulário, sem tela de login. O consentimento e a revisão informam explicitamente o envio ao Firebase. Fotos permanecem temporárias e não são enviadas.

As sete etapas, ocorrência anterior, oito categorias, animações, pausa, intensidades, GPS/clima e mapa vetorial da GPT 0.4 permanecem na base. O mapa ainda reúne dados locais deste navegador; a visualização compartilhada é uma etapa posterior.

## Projeto e acesso

- Projeto: `waind-ufn-dev` — WAIND - Desenvolvimento.
- Firestore Standard, banco `(default)`, região `southamerica-east1` (São Paulo).
- Plano Spark. Não foi vinculado faturamento ou ativado Storage.
- Console: https://console.firebase.google.com/project/waind-ufn-dev/firestore
- App Web: WAIND Web - Desenvolvimento.
- Authentication: apenas provedor anônimo habilitado.

A identificação automática distingue navegadores; nome e e-mail são autodeclarados, sem verificação de e-mail. Não há recuperação da identidade técnica em outro aparelho. Cada envio guarda uma cópia própria da identificação, para preservar os dados informados mesmo se outra pessoa usar o mesmo navegador depois.

## Coleções

`participantes/{idDoRelato}` contém nome, e-mail, identificador técnico, consentimento e recebimento no servidor. `relatos/{idDoRelato}` contém intensidade, categorias, localização, horário da ocorrência, clima quando disponível, pistas, observação e indicadores metodológicos. Não contém nome nem e-mail. Os dois documentos são criados na mesma transação.

Clientes só leem os próprios documentos. Listagens exigem filtro de proprietário e limite de até 100. Alteração e exclusão pelo cliente são negadas nesta etapa; o responsável pelo projeto administra os registros pelo console. Não há coleção pública de relatos.

As regras validam campos e tipos, intensidade 1–5, categorias conhecidas, coordenadas, consentimento e criação vinculada. `receivedAt` usa horário do servidor; os horários declarados da ocorrência e do consentimento são informações do cliente.

## Envio e caderno local

Uma transação com o mesmo ID verifica se o relato já existe antes de gravar. Reenvios não duplicam o registro. Transações não ficam enfileiradas para envio offline. Em falha, o formulário permanece aberto para nova tentativa. Após confirmação, o navegador guarda até 100 cópias recentes para caderno e exportação; falha no armazenamento local não desfaz um envio confirmado.

Nenhum registro antigo do localStorage é enviado automaticamente. Apagar as cópias locais não apaga os documentos do Firestore. Fechar/recarregar a página mantém o comportamento anterior de perder o rascunho não enviado.

## Arquivos

- `firebase-config.js`: configuração pública do app Web; não é uma credencial administrativa.
- `firebase-store.js`: carregamento dos SDKs, identificação técnica e transação.
- `firestore.rules`: regras publicadas e validadas no banco de desenvolvimento.
- `firebase.json` e `.firebaserc`: referência do projeto para ferramentas de desenvolvimento.
- `app.js`, `wizard.js`, `waind.html`: fluxo de envio e consentimento.
- `qa/`: páginas locais de validação; excluir do pacote público.

Os SDKs Firebase 13.1.0 são carregados do CDN oficial, apenas quando necessário para enviar. Cartografia, clima e envio dependem de rede.

## Executar

Com Node.js, executar `node serve.mjs` e abrir http://127.0.0.1:4174/. Para recompilar, executar `node build.mjs`; a entrega fica em `entrega/index.html` e na raiz.

## Validação e publicação

Foram testados envio real de dados fictícios, criação atômica, acesso por proprietário, recusa de leitura por outro usuário e sem identificação, consulta restrita, campos inválidos, consentimento falso, escrita incompleta, alterações e exclusão. O reenvio pelo SDK foi verificado sem duplicação. O fluxo completo da interface foi percorrido com dados fictícios.

Os ensaios técnicos usam dados fictícios identificados no banco de desenvolvimento. Eles devem ser excluídos de análises da pesquisa.

A integração usa o projeto Firebase waind-ufn-dev e o site https://murillosvrj.github.io/mau-odor-ufn/. O envio confirmado fica disponível ao responsável no console do Firestore. Esta publicação é um piloto para avaliação: o mapa não exibe relatos de outros participantes. App Check ainda não está registrado; a proteção atual usa autenticação técnica e regras de acesso por proprietário. Antes de ampliar o uso, configurar a proteção contra abuso e revisar os procedimentos da pesquisa e o acesso aos dados compartilhados.
