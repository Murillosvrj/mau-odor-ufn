# WAIND — GPT 0.6

[Aplicativo publicado](https://murillosvrj.github.io/mau-odor-ufn/)

Pesquisa de Murillo Viçosa, UFN, Santa Maria/RS, organizada por Design Science Research. Relatos são percepções isoladas, não comprovação de fonte, medição química ou previsão por IA.

## O que mudou

- Firebase/Cloud Firestore real no projeto waind-ufn-dev, região southamerica-east1 (São Paulo).
- Gravação atômica em relatos_pesquisa (privado) e relatos_mapa (público sem identificação direta), com o mesmo UUID; quando há foto, relatos_fotos integra o mesmo lote. Autenticação anônima técnica, sem login extra ou verificação de nome/e-mail.
- Schema em português: nome, email, data/hora de Brasília, ocorrência atual/anterior, timestamp do servidor, temperatura, clima atual, localização/endereço, intensidade ordinal, categorias/multi-hot, contexto, metadados de foto e consentimento.
- Mapa coletivo lê até 500 relatos mais recentes por data e reúne cópias locais sem duplicar IDs. Atualização em tempo real, sem nome/e-mail, endereço, observação, descrição livre ou foto.
- Fila durável no localStorage com status pendente-sincronizacao. Ao reconectar, reabrir o app conectado ou a cada minuto com o app aberto, tenta novamente. A confirmação distingue envio confirmado de armazenamento somente local. Exportar JSON inclui as cópias pendentes.
- Movimento de vento, pausa, oito ilustrações, mapa vetorial e ajuste dos botões i da GPT 0.4 preservados (base 3c334ae836a820b042cdfa3b7ebd1979319f7c14).

## Privacidade e alcance

relatos_pesquisa não permite nenhuma leitura, alteração ou exclusão pelo SDK do navegador, nem para o autor. Pesquisadores autorizados usam o Console Firebase/IAM. relatos_mapa permite leitura sem login; contém somente latitude, longitude, intensidade_odor, tipo_odor (categorias, rotulos e multi_hot), data, hora, temperatura e status_qualidade. Campos arbitrários são proibidos. Regras exigem o par e, quando há foto, o trio de documentos novos no mesmo lote, com valores coerentes. Fotos órfãs e relatos que declaram imagem sem documento correspondente são recusados. relatos_fotos bloqueia toda leitura, alteração e exclusão pelo navegador.

Coordenadas exatas e horário são públicos e podem permitir inferências sobre rotinas. A interface informa isso antes do consentimento. Não há garantia de anonimato absoluto. Texto de Outros, observação, endereço, nome do arquivo da foto e identidade ficam no documento privado. Os dados do caderno e do JSON incluem nome/e-mail: mantenha-os privados.

A fotografia opcional é reencodificada em canvas (WebP/JPEG, lado máximo de 640 px, até 143360 bytes e 200000 caracteres Base64), sem copiar EXIF/GPS do arquivo original. Seu SHA-256 é calculado no navegador. O binário Base64 fica exclusivamente em relatos_fotos, privado e vinculado ao mesmo UUID; relatos_pesquisa contém somente metadados. Nenhuma imagem ou metadado entra no mapa público. Fotografias pendentes permanecem no localStorage até a confirmação; depois o Base64 local é removido. A exportação JSON contém identificação e metadados, mas omite imagens. Clima Open-Meteo é atual, regional e não medido na fonte; em ocorrências anteriores não corresponde ao clima histórico. Ausência de clima/endereço não bloqueia o relato.

Consentimento vigente: waind-pesquisa-mapa-0.6. Relatos com aceite anterior permanecem locais e não são reenviados automaticamente. As coleções anteriores participantes e relatos permanecem no banco, com acesso pelo navegador desativado. Cópias locais antigas não são compartilhadas automaticamente, pois não possuem o consentimento novo para mapa público. Nenhuma migração destrutiva foi feita.

## Executar e recompilar

Sem instalação de dependências ou bundler. Node.js serve os arquivos e reúne CSS/JS/SVG no HTML; SDK modular oficial é importado do gstatic somente quando necessário.

    node serve.mjs
    node build.mjs

Abrir http://127.0.0.1:4174. O build atualiza index.html e entrega/index.html. A aplicação precisa ter sido carregada antes de perder a conexão; esta versão não instala um service worker para abertura inteiramente offline. Para sincronizar, mantenha ou reabra o site com internet. O navegador não executa sincronização após fechar a página. Apagar os dados do navegador remove pendências ainda não enviadas.

## Configuração e regras

firebase-config.js contém somente a configuração Web pública; não é uma credencial de administrador. Nenhuma chave de serviço, token ou dado real de participante faz parte do código. firestore.rules é a fonte das regras, para colar em Firestore > Regras > Publicar ou usar firebase deploy --only firestore:rules com a CLI autenticada de um pesquisador.

As validações são repartidas entre as três criações atômicas para respeitar o limite de 1.000 expressões das regras. O par é obrigatório, imutável e tem projeção pública fechada. Testes negativos comprovam que criar somente um documento, alterar o par, adicionar identificação ao mapa ou enviar dados inválidos é recusado.

Projeto no plano Spark, sem ativação de cobrança. Firebase Storage e Firebase Hosting não são utilizados. App Check não está registrado/exigido nesta versão; autenticação anônima e schema não são mecanismos de moderação ou proteção completa contra spam. Nominatim exige atenção a limites de uso antes de ampliar a coleta; geocoding-config.json permite desativar/substituir a consulta reversa.

## Recursos e histórico

MapLibre + OpenFreeMap/OpenStreetMap, odor-heat.js e Open-Meteo. Atribuições visíveis no mapa. Arquivos e vídeos promocionais existentes de CRIKOS e versões anteriores são preservados no repositório/Drive; não são executados pelo formulário. mau-odor-nanquim.html, map.js e CONCEITO-VISUAL.md preservam o protótipo anterior.

## Referências técnicas

- [SDK modular no navegador](https://firebase.google.com/docs/web/alt-setup)
- [Gravações atômicas e lotes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Regras e getAfter](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Testes no emulador](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Condições atuais Open-Meteo](https://open-meteo.com/en/docs)

## GPT 0.6 — implementação e testes

photo-process.js é carregado antes do cliente Firebase e do formulário. O SDK grava relatos_pesquisa, relatos_mapa e a fotografia opcional em relatos_fotos no mesmo writeBatch. O recebimento público imutável confirma a gravação atômica em reenvios pelo mesmo UUID. SHA-256 identifica bytes iguais no dataset; não bloqueia relatos distintos que usem a mesma imagem.

As regras validam schema, limites e vínculo, mas não decodificam Base64 nem recalculam SHA-256 no servidor. O pipeline científico deve conferir bytes, hash e formato antes do treinamento e excluir os IDs técnicos documentados. A remoção de EXIF não apaga rostos, placas ou elementos identificáveis desenhados nos pixels.

O painel de relatos também está incluído em painel.html, com paginação temporal e categorias em barras. O App Check está preparado, mas desativado até o registro e a chave pública do site; nenhum token de debug é publicado. Os materiais CRIKOS existentes permanecem preservados.
