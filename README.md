# WAIND — GPT 0.5

[Aplicativo publicado](https://murillosvrj.github.io/mau-odor-ufn/)

Pesquisa de Murillo Viçosa, UFN, Santa Maria/RS, organizada por Design Science Research. Relatos são percepções isoladas, não comprovação de fonte, medição química ou previsão por IA.

## O que mudou

- Firebase/Cloud Firestore real no projeto waind-ufn-dev, região southamerica-east1 (São Paulo).
- Gravação atômica em relatos_pesquisa (privado) e relatos_mapa (público sem identificação direta), com o mesmo UUID. Autenticação anônima técnica, sem login extra ou verificação de nome/e-mail.
- Schema em português: nome, email, data/hora de Brasília, ocorrência atual/anterior, timestamp do servidor, temperatura, clima atual, localização/endereço, intensidade ordinal, categorias/multi-hot, contexto, metadados de foto e consentimento.
- Mapa coletivo lê até 500 relatos mais recentes por data e reúne cópias locais sem duplicar IDs. Atualização em tempo real, sem nome/e-mail, endereço, observação, descrição livre ou foto.
- Fila durável no localStorage com status pendente-sincronizacao. Ao reconectar, reabrir o app conectado ou a cada minuto com o app aberto, tenta novamente. A confirmação distingue envio confirmado de armazenamento somente local. Exportar JSON inclui as cópias pendentes.
- Movimento de vento, pausa, oito ilustrações, mapa vetorial e ajuste dos botões i da GPT 0.4 preservados (base 3c334ae836a820b042cdfa3b7ebd1979319f7c14).

## Privacidade e alcance

relatos_pesquisa não permite nenhuma leitura, alteração ou exclusão pelo SDK do navegador, nem para o autor. Pesquisadores autorizados usam o Console Firebase/IAM. relatos_mapa permite leitura sem login; contém somente latitude, longitude, intensidade_odor, tipo_odor (categorias, rotulos e multi_hot), data, hora, temperatura e status_qualidade. Campos arbitrários são proibidos. Regras exigem os dois documentos novos no mesmo lote, com valores coerentes, antes de aceitar qualquer um.

Coordenadas exatas e horário são públicos e podem permitir inferências sobre rotinas. A interface informa isso antes do consentimento. Não há garantia de anonimato absoluto. Texto de Outros, observação, endereço, nome do arquivo da foto e identidade ficam no documento privado. Os dados do caderno e do JSON incluem nome/e-mail: mantenha-os privados.

A foto nunca é enviada: apenas nome, tipo, tamanho e dimensões no registro privado. A imagem existe somente na sessão. Clima Open-Meteo é atual, regional e não medido na fonte; em ocorrências anteriores não corresponde ao clima histórico. Ausência de clima/endereço não bloqueia o relato.

As coleções anteriores participantes e relatos permanecem no banco, com acesso pelo navegador desativado. Cópias locais antigas não são compartilhadas automaticamente, pois não possuem o consentimento novo para mapa público. Nenhuma migração destrutiva foi feita.

## Executar e recompilar

Sem instalação de dependências ou bundler. Node.js serve os arquivos e reúne CSS/JS/SVG no HTML; SDK modular oficial é importado do gstatic somente quando necessário.

    node serve.mjs
    node build.mjs

Abrir http://127.0.0.1:4174. O build atualiza index.html e entrega/index.html. A aplicação precisa ter sido carregada antes de perder a conexão; esta versão não instala um service worker para abertura inteiramente offline. Para sincronizar, mantenha ou reabra o site com internet. O navegador não executa sincronização após fechar a página. Apagar os dados do navegador remove pendências ainda não enviadas.

## Configuração e regras

firebase-config.js contém somente a configuração Web pública; não é uma credencial de administrador. Nenhuma chave de serviço, token ou dado real de participante faz parte do código. firestore.rules é a fonte das regras, para colar em Firestore > Regras > Publicar ou usar firebase deploy --only firestore:rules com a CLI autenticada de um pesquisador.

As validações são repartidas entre as duas criações atômicas para respeitar o limite de 1.000 expressões das regras. O par é obrigatório, imutável e tem projeção pública fechada. Testes negativos comprovam que criar somente um documento, alterar o par, adicionar identificação ao mapa ou enviar dados inválidos é recusado.

Projeto no plano Spark, sem ativação de cobrança. Firebase Storage e Firebase Hosting não são utilizados. App Check não está registrado/exigido nesta versão; autenticação anônima e schema não são mecanismos de moderação ou proteção completa contra spam. Nominatim exige atenção a limites de uso antes de ampliar a coleta; geocoding-config.json permite desativar/substituir a consulta reversa.

## Recursos e histórico

MapLibre + OpenFreeMap/OpenStreetMap, odor-heat.js e Open-Meteo. Atribuições visíveis no mapa. Arquivos e vídeos promocionais existentes de CRIKOS e versões anteriores são preservados no repositório/Drive; não são executados pelo formulário. mau-odor-nanquim.html, map.js e CONCEITO-VISUAL.md preservam o protótipo anterior.

## Referências técnicas

- [SDK modular no navegador](https://firebase.google.com/docs/web/alt-setup)
- [Gravações atômicas e lotes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Regras e getAfter](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Testes no emulador](https://firebase.google.com/docs/firestore/security/test-rules-emulator)
- [Condições atuais Open-Meteo](https://open-meteo.com/en/docs)
