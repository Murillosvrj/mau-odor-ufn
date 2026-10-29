> Registro da direção visual original. A interface atual é o WAIND, descrito no README: fluxo por etapas e mapa geográfico real para marcar o local. O mapa esquemático e os cenários de IA mencionados abaixo pertencem à versão anterior preservada em `mau-odor-nanquim.html`.

# Mau Odor · Caderno de campo em nanquim

Conceito visual para o **Sistema Participativo de Monitoramento e Análise de Mau Odor Urbano com IA no entorno da UFN — Santa Maria/RS**.

Esta proposta traduz as oito imagens fornecidas em uma linguagem própria de interface: contornos simples e contínuos, volume construído por linhas curvas, ar representado por volutas e instrumentos de análise desenhados com geometria fina. A nova direção substitui o predomínio de teal da proposta anterior por uma base de papel e nanquim, mantendo cor como informação sobre intensidade.

## 1. O que cada referência traz

- **Gato com xícaras, em duas imagens:** silhueta econômica, curvas legíveis e poucos elementos. É a referência para reconhecer rapidamente um ícone em uma tela pequena.
- **Polvo:** hachuras que mudam de direção ao acompanhar o volume. É a referência para sacos, recipientes e materiais orgânicos.
- **Copo com gelo e limão:** combinação de contorno, hachura e pontilhismo. Orienta as superfícies transparentes do frasco químico e a textura da água.
- **Rosto ARHA:** linhas paralelas e ondulantes com identidade editorial; o carimbo azul inspira o uso restrito de uma cor de acento.
- **Olhos em nanquim:** espirais, gotas e deformações fluidas. Orientam o vocabulário do odor, sem transportar os olhos literalmente para todos os componentes.
- **Mãos, sol e bússola:** círculos, eixos, miras e linhas tracejadas para observação, orientação e análise.
- **Ilustração panorâmica:** continuidade entre ondas de ar, vapor e paisagem. Orienta a composição horizontal da abertura e a representação do odor.

As ilustrações do protótipo são vetores autorais. As imagens de referência não são usadas como fundos nem recortadas para formar os ícones.

## 2. Sistema visual

### Paleta

| Papel | Cor | Uso |
| --- | --- | --- |
| Papel algodão | `#FAF8F5` | Fundo principal, áreas de respiro |
| Branco | `#FFFFFF` | Campos, cartões e superfícies de interação |
| Nanquim | `#111111` | Texto principal, contornos e ações |
| Grafite | `#78756E` | Ornamentos e detalhes secundários que não carregam informação essencial |
| Texto de apoio | Cinza escuro com contraste suficiente | Descrições, instruções, legendas e estados |
| Nível 1 · Muito fraco | `#0D9488` | Intensidade 1 |
| Nível 2 · Fraco | `#65A30D` | Intensidade 2 |
| Nível 3 · Intermediário | `#D97706` | Intensidade 3 |
| Nível 4 · Forte | `#EA580C` | Intensidade 4 |
| Nível 5 · Muito forte | `#DC2626` | Intensidade 5 |

A proporção de 90% monocromia e 10% cor é uma diretriz de composição, não uma medida computacional da área da tela. A intensidade aparece sempre com número e nome, além da cor. O vermelho foi escolhido para o nível 5 para preservar a progressão térmica solicitada. O azul carimbo `#1D4ED8` permanece como possibilidade editorial futura, sem substituir o significado do nível 5 nesta versão.

O grafite especificado não é adotado indiscriminadamente em textos pequenos. Instruções e legendas usam tons mais escuros quando necessário para manter legibilidade sobre papel ou branco. Hachuras e divisórias podem ter contraste menor porque são elementos decorativos.

### Tipografia e hierarquia

Títulos usam uma serifa editorial do sistema, como Georgia. Ela aproxima a experiência de um caderno de observação. Controles, descrições e formulários usam fontes sem serifa nativas para leitura rápida no celular. Metadados curtos podem usar uma fonte monoespaçada.

A sequência visual é: propósito do registro, contexto automático, intensidade, tipo de odor, foto e observações opcionais, revisão. O mapa é uma segunda área de exploração, sem disputar atenção com o preenchimento.

### Linhas e superfícies

Contornos externos contínuos e arredondados estabelecem a silhueta. Linhas internas mais finas acompanham a curvatura do objeto. Pontos aparecem apenas onde ajudam a sugerir textura. Os desenhos evitam preenchimentos pesados, sombras genéricas e ruído de papel que prejudique a leitura.

Cartões brancos têm borda fina, cantos moderadamente arredondados e espaçamento generoso. A seleção combina borda, marca visível e mudança de estado; não depende somente de cor.

### Movimento

O movimento responde a uma ação. Teclas e cartões usam curvas elásticas, incluindo `cubic-bezier(0.34, 1.56, 0.64, 1)`, enquanto deslocamentos maiores usam aceleração suave. A animação confirma o toque e depois permite que a ilustração volte a repousar.

Volutas e pontos podem responder à intensidade com alterações de amplitude e cadência. A preferência `prefers-reduced-motion` reduz ou elimina esses movimentos sem retirar o feedback visual da seleção.

## 3. Componentes

### Cabeçalho digital automático

Uma faixa de ficha de campo reúne data e hora, localização e clima. Ícones pequenos mantêm o mesmo traço das ilustrações maiores. A precisão vem do estado dos dados, não da aparência de um painel complexo.

- **Data e hora:** obtidas do dispositivo e apresentadas no contexto de Santa Maria. O registro armazena um instante de coleta, distinto da mera atualização visual do relógio.
- **Localização:** solicitada ao navegador por uma ação explícita. A interface distingue localização capturada, acesso negado, recurso indisponível e localização ainda não solicitada. A referência à UFN não significa que o GPS já confirmou a presença da pessoa no local.
- **Clima:** consulta meteorológica via Open-Meteo quando disponível, com temperatura, umidade e vento. A interface identifica a consulta e sua referência espacial. Ausência de rede ou falha retorna um estado indisponível, sem inventar números.

Uma localização ilustrativa ou de referência nunca recebe a mesma apresentação de uma coordenada capturada pelo dispositivo.

### Passo 1 — Intensidade

Cinco teclas apresentam número grande e nome curto. A inspiração no input-otp é visual: cada intensidade é uma opção de um grupo de seleção única, implementado com semântica de radio. Não é um campo de autenticação ou de senha.

Ao selecionar, a tecla responde com um pequeno deslocamento, o numeral pode deslizar verticalmente e o medidor assume a cor correspondente. Volutas e pontos acompanham esse estado. O teclado e o foco visível oferecem o mesmo acesso que o toque.

Não há intensidade presumida antes da primeira escolha. A intensidade é um autorrelato subjetivo, não uma concentração química.

### Passo 2 — Percepção ou tipo de odor

Oito cartões permitem seleção múltipla. Cada cartão possui uma área de escolha e um botão “i” independente: abrir a explicação não altera a resposta. A linguagem das descrições ajuda o participante a reconhecer uma categoria sem afirmar que a fonte foi comprovada.

| Categoria | Ilustração | Microinteração |
| --- | --- | --- |
| 1. Resíduos | Saco de lixo com pregas curvas e hachuras de volume | O corpo se comprime suavemente e o laço se fecha |
| 2. Contentor de lixo | Recipiente com tampa articulada e textura linear | A tampa abre, libera uma voluta e retorna |
| 3. Esgoto | Grade em perspectiva com traços finos | Espirais de vapor sobem entre as aberturas |
| 4. Valas a céu aberto | Canal com margens e água em linhas paralelas | As linhas de corrente deslocam-se ao longo da vala |
| 5. Resíduos orgânicos alimentares | Restos orgânicos com volume por hachuras | Ondas curvas pulsam discretamente acima do material |
| 6. Resíduos metabólicos | Gotas e marcas com contornos simples | Uma gota se desloca e círculos sutis indicam a percepção |
| 7. Resíduos químicos | Frasco com hachuras de vidro e líquido | Bolhas sobem e uma pequena reação movimenta a superfície |
| 8. Outros | Bússola de investigação com círculos e eixos | A agulha gira; um campo curto permite descrever a percepção |

As escolhas podem ser serializadas como oito indicadores 0/1, adequados ao futuro tratamento de múltiplas categorias. Essa organização não pressupõe que um modelo já tenha sido treinado.

### Passo 3 — Foto do local

A área de fotografia lembra uma prancha de observação: bordas finas, cantos de enquadramento, mira discreta e bastante espaço. Há ações distintas para câmera e galeria, respeitando os recursos oferecidos pelo navegador e dispositivo.

A prévia mostra a imagem escolhida e oferece remoção ou substituição. A fotografia é opcional. O estado **“O cheiro está no ar, mas não há foco visível na foto”** aparece com uma ilustração de correntes de ar e explicação independente.

O objetivo dessa marcação é preservar a distinção entre odor percebido e fonte visualmente observável. A interface pode preparar os dados para visão computacional, mas não afirma reconhecer resíduos, detectar fontes ou atribuir confiança a uma análise que não foi executada. Elementos de scanner são linguagem visual, não evidência de inferência.

### Passo 4 — Contexto e observação

Tags rápidas registram o que a pessoa observa por perto. São controles de múltipla escolha com textos curtos. Elas complementam o relato sem transformar vizinhança espacial em relação causal.

A observação livre é opcional e tem limite de tamanho visível. O foco está na descrição simples: onde, quando e como a percepção ocorreu. Antes de salvar, uma revisão resume intensidade, categorias, contexto, foto e o estado “sem foco visível”.

### Registro local

O protótipo permite revisar e salvar um relato no navegador, além de exportar JSON. A interface informa que esse armazenamento é local. Salvar não equivale a enviar para pesquisadores ou a registrar em um banco central.

O tratamento da foto deve respeitar o que a implementação efetivamente consegue persistir: uma prévia visual não é prova de upload ou armazenamento permanente. O arquivo exportado identifica os campos incluídos e as eventuais referências à fotografia.

### Mapa de calor do entorno da UFN

O mapa combina linhas finas de ruas, quadras claras, marcos da UFN e contornos orgânicos de intensidade. Os nomes locais contextualizam o estudo: Rua dos Andradas, Rua Silva Jardim, Rua Duque de Caxias, Rua Conde de Porto Alegre, Rua Serafim Valandro, Rua Venâncio Aires, Rua Dr. Bozano e Praça Saldanha Marinho.

Nesta entrega, o desenho é **esquemático e ilustrativo, sem precisão cartográfica**. Não representa um levantamento topográfico real, limites cadastrais verificados ou geometrias oficiais dos conjuntos da UFN. As curvas associadas ao odor são isolinhas gráficas demonstrativas; não são curvas de nível de terreno.

Camadas distinguem pontos de relato e hipóteses demonstrativas. Seletores de Decision Tree e Random Forest mostram como o painel poderá organizar modelos futuros, mas não representam modelos treinados nem predições calculadas nesta versão. Os dados simulados e a condição ilustrativa permanecem visíveis na própria área do mapa.

Os controles incluem zoom, reposicionamento, retorno à vista inicial e ampliação. Pontos podem ser inspecionados com mouse ou teclado. Relatos isolados mantêm o rótulo **“Isolado / não confirmado”**, sem serem classificados automaticamente como falsos.

## 4. Estados que sustentam o rigor científico

| Estado | Significado na interface |
| --- | --- |
| Relato / percepção cidadã | Informação subjetiva fornecida por uma pessoa |
| Hipótese / fonte provável | Possibilidade indicada por participante ou por análise futura, ainda sem comprovação |
| Isolado / não confirmado | Relato preservado, sem confirmação independente |
| Dados simulados | Exemplos utilizados para avaliar a interface |
| Causa comprovada | Não atribuída por este protótipo; exigiria evidências além das disponíveis |

A apresentação evita linguagem que converta uma associação espacial, fotografia ou classificação em prova de causalidade. Nenhum acabamento visual substitui a validação científica do projeto.

## 5. Relação com os requisitos conhecidos

| Requisito citado no material | Aplicação no protótipo |
| --- | --- |
| R01 — Localização | Captura de GPS com permissão e estados claros de disponibilidade |
| R02 — Data e hora | Registro temporal automático |
| R06 — Fotografia | Câmera/galeria, prévia e indicação de ausência de foco visível |
| R07 — Clima | Temperatura, umidade e vento quando a consulta estiver disponível |
| R11 — Rigor metodológico | Separação de percepção, hipótese e comprovação; preservação de relatos isolados |
| R12 — Visão computacional | Preparação da experiência e dos metadados; inferência depende de integração futura |

Os requisitos R03, R04, R05, R08, R09 e R10 não estão definidos integralmente nos materiais lidos. Esta proposta não inventa seus enunciados nem atribui conformidade sem essa definição.

## 6. Acessibilidade e adaptação

- Texto legível, foco visível, controles identificados e contraste adequado às funções de leitura.
- Campos com rótulos reais, seleção única na intensidade e múltipla escolha nas categorias e tags.
- Botões de informação separados das áreas de seleção, com conteúdo acessível por teclado.
- Estados comunicados por texto e forma, além da cor.
- Layout em uma coluna no celular, mantendo margens laterais e áreas de toque confortáveis.
- Movimento reduzido conforme a preferência do sistema.
- Mensagens claras para permissões recusadas, clima indisponível, foto inválida e falha no armazenamento local.

## 7. Escopo desta versão

**Funcional no navegador:** seleção de intensidade e categorias, explicações, tags, observação, câmera/galeria conforme suporte do dispositivo, prévia da imagem, revisão, armazenamento local, exportação JSON e interação com mapa demonstrativo. GPS e consulta meteorológica dependem da permissão, rede e suporte do ambiente.

**Integrações futuras:** cartografia georreferenciada validada, banco de dados compartilhado, política de armazenamento das fotografias, modelos de visão computacional, treinamento e avaliação de Decision Tree/Random Forest, interpolação ou análise espacial validada e implantação para coleta de campo.

A meta de preenchimento em menos de 30 segundos orienta o desenho, mas só pode ser confirmada por testes com participantes. A DSR demanda avaliação do artefato; este documento registra decisões de design, não resultados de uma avaliação ainda não realizada.

## Referências de interação fornecidas

- [Hairline — documentação](https://hairline.lucasmarkes.com/docs): referência de figuras em SVG e resposta sutil à interação.
- [Motes](https://motes.lucasmarkes.com): referência de atmosfera procedural e resposta ao ponteiro.
- [input-otp](https://input-otp.rodz.dev): referência visual de células individuais e atenção ao comportamento acessível dos controles; a escala deste projeto usa seleção única.

As referências orientam acabamento e comportamento. Os vetores, componentes e controles específicos do projeto são construídos para este contexto.
