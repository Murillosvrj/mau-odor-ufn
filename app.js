(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const levels = [
    {name:'Muito fraco',color:'#0D9488'}, {name:'Fraco',color:'#65A30D'},
    {name:'Intermediário',color:'#D97706'}, {name:'Forte',color:'#EA580C'},
    {name:'Muito forte',color:'#DC2626'}
  ];
  const types = [
    {id:'waste',label:'Resíduos',description:'Odor que lembra lixo ou resíduos acumulados, espalhados ou ensacados. Se você vê um contentor, pode selecionar essa categoria também. A escolha descreve sua percepção; não confirma a origem do cheiro.'},
    {id:'container',label:'Contentor de lixo',sub:'Containers',description:'Odor percebido próximo a um recipiente coletivo de armazenamento de lixo. Selecione quando houver essa associação na sua percepção. A proximidade do recipiente, por si só, não comprova que ele seja a fonte.'},
    {id:'sewer',label:'Esgoto',description:'Odor que você associa a esgoto, bueiros, ralos ou águas residuais. Descreva o cheiro percebido, mesmo que não consiga enxergar uma fonte. Não é necessário identificar uma substância.'},
    {id:'ditch',label:'Valas a céu aberto',description:'Odor associado, na sua percepção, a valas, canais ou sarjetas abertas. As tags do próximo passo ajudam a registrar se há água parada ou outros elementos visíveis.'},
    {id:'organic',label:'Resíduos orgânicos alimentares',description:'Odor que lembra restos de comida, cascas, frutas ou outros alimentos em decomposição. Marque apenas se essa descrição corresponde ao que você percebe.'},
    {id:'metabolic',label:'Resíduos metabólicos',description:'Odor que lembra urina, fezes ou outros resíduos de origem humana ou animal. Não é preciso atribuí-lo a uma pessoa ou animal específico.'},
    {id:'chemical',label:'Resíduos químicos',description:'Odor que lembra produtos químicos, solventes, combustíveis ou produtos de limpeza. Essa percepção não identifica a substância nem a sua concentração. Faça o registro a partir de um local seguro, sem se aproximar para investigar.'},
    {id:'other',label:'Outros',description:'Use quando nenhuma opção descreve bem o odor ou quando você não consegue classificá-lo. Um campo curto opcional permite descrevê-lo com suas próprias palavras.'}
  ];
  const tags = ['Lixo acumulado','Contentor próximo','Bueiro / ralo','Água parada','Vala aberta','Restos de alimentos','Animais por perto','Nada aparente'];
  const state = {intensity:null, types:new Set(), tags:new Set(), location:null, weather:null, photo:null, photoLoading:false, pending:null};
  const STORE_KEY = 'ufn-mau-odor-nanquim-v1';
  let records = [], toastTimer, photoURL = null, photoGeneration = 0, weatherGeneration = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches;
  let lastFocused = null;
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (Array.isArray(stored)) records = stored.filter(r => r && typeof r.id === 'string' && Number.isInteger(r.intensity) && r.intensity >= 1 && r.intensity <= 5 && Array.isArray(r.categories)).slice(-100);
  } catch { /* Browsers may disable storage; a save will explain that state. */ }

  $('#hero-art').innerHTML = OdorArt.hero();
  $('#wind-art').innerHTML = OdorArt.wind();
  $('#note-art').innerHTML = `<svg class="empty-illustration" viewBox="0 0 220 140" aria-hidden="true"><g stroke-width=".8"><ellipse cx="110" cy="76" rx="67" ry="50" stroke-dasharray="2 5"/><circle cx="110" cy="76" r="38"/><circle cx="110" cy="76" r="31"/><path d="M20 76h44m92 0h44M110 8v28m0 81v19M61 28l17 17m64 63 17 17M163 25l-17 18M57 122l19-18" stroke-dasharray="3 5"/><path d="M32 98C65 98 64 46 111 46c43 0 61 52 21 64-33 10-56-30-28-42 21-9 37 17 18 23-11 4-18-9-9-12" stroke-width="1.3"/><path d="M28 103C65 106 63 40 112 40c52 0 69 63 22 76-41 12-66-35-32-54 28-15 52 22 24 35M28 108C65 114 66 35 113 35c58 0 76 72 23 87M29 113C56 118 67 101 75 84M32 119c20 4 32-8 38-19"/><path d="m110 11-4 13h8Z" fill="#111"/><circle cx="34" cy="77" r="2"/><circle cx="183" cy="76" r="2"/><circle cx="64" cy="31" r="1"/><circle cx="169" cy="120" r="1"/><path d="m173 33 4 4m0-4-4 4M50 120l3 3m0-3-3 3"/></g></svg>`;
  $('#intensity-options').innerHTML = levels.map((level,i) => `<label class="intensity-option" style="--level-color:${level.color}"><input type="radio" name="intensity" value="${i+1}" aria-label="${i+1}. ${level.name}" required><span class="intensity-key"><span class="selected-mark" aria-hidden="true">✓</span><span class="slot-window" aria-hidden="true"><span class="slot-track"><span>${i+1}</span><span>${i+1}</span></span></span><span class="level-label">${level.name}</span><span class="level-tick" aria-hidden="true"></span></span></label>`).join('');
  $('#odor-options').innerHTML = types.map((type,i) => `<div class="odor-card" data-kind="${type.id}"><label class="odor-choice"><input type="checkbox" name="odor" value="${type.id}"><span class="card-topline"><span class="card-index" aria-hidden="true">0${i+1}</span><span class="card-checkbox" aria-hidden="true"></span></span><span class="card-art" aria-hidden="true">${OdorArt.icon(type.id)}</span><span class="card-label">${type.label}</span>${type.sub?`<span class="card-sublabel">${type.sub}</span>`:''}</label><button type="button" class="info-button" data-info="${type.id}" aria-label="Informações sobre ${type.label}">i</button></div>`).join('');
  $('#context-tags').innerHTML = tags.map((tag,i) => `<label class="tag"><input type="checkbox" name="tag" value="${i}"><span>${tag}</span></label>`).join('');
  OdorMap.mount($('#odor-map'));

  const infoContent = {
    invisible:{title:'Sentir não é o mesmo que enxergar.',body:'<p>O odor pode estar no ar mesmo quando a foto mostra um lugar aparentemente limpo. Marcar esta opção evita tratar a imagem como evidência visual de uma fonte de mau odor.</p><p>No futuro, essa informação poderá ajudar a interpretar as imagens usadas na pesquisa. Neste protótipo, nenhuma foto é analisada por IA.</p>'},
    method:{title:'Uma percepção. Muitas possibilidades.',body:'<p><strong>Relato:</strong> o que alguém sentiu em um lugar e momento.</p><p><strong>Hipótese:</strong> uma possível fonte, sugerida por observação ou por um modelo, que ainda exige investigação.</p><p><strong>Causa comprovada:</strong> exige evidências próprias e não é estabelecida por este formulário. Relatos isolados são preservados como “isolado / não confirmado”.</p>'},
    about:{title:'Uma escuta coletiva do território.',body:'<p>Sistema Participativo de Monitoramento e Análise de Mau Odor Urbano com IA no entorno da UFN — Santa Maria/RS.</p><p>Projeto de pesquisa de Murillo Viçosa, no curso de IA e Ciência de Dados da Universidade Franciscana, estruturado pela metodologia Design Science Research.</p><p>Esta é uma versão de avaliação do design. O mapa é esquemático, seus oito relatos são simulados e os cenários de Decision Tree e Random Forest não executam modelos treinados.</p><p>Seus relatos ficam neste navegador. A foto é temporária e não acompanha a exportação JSON. Quando disponível, o clima é consultado na <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>; essa consulta usa as coordenadas da área de estudo ou as coordenadas arredondadas do GPS autorizado.</p>'}
  };
  function showToast(text) {
    clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').hidden = false;
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5200);
  }
  function openDialog(dialog) {
    lastFocused = document.activeElement;
    dialog.showModal();
  }
  $$('dialog').forEach(dialog => {
    $$('[data-close]',dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => { if(lastFocused?.isConnected) lastFocused.focus({preventScroll:true}); });
    dialog.addEventListener('click', event => {
      if(event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if(event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
  });
  function showInfo(key) {
    const type = types.find(t => t.id === key);
    const content = type ? {title:type.label,body:`<p>${escape(type.description)}</p>`} : infoContent[key];
    if(!content) return;
    $('#info-title').textContent = content.title; $('#info-body').innerHTML = content.body;
    openDialog($('#info-dialog'));
  }
  $$('[data-info]').forEach(button => button.addEventListener('click', () => showInfo(button.dataset.info)));
  $$('[data-about]').forEach(button => button.addEventListener('click', () => showInfo('about')));

  function updateSummary() {
    $('#summary-intensity').textContent = state.intensity ? `${state.intensity} · ${levels[state.intensity-1].name}` : 'A escolher';
    $('#summary-types').textContent = state.types.size ? `${state.types.size} ${state.types.size===1?'categoria':'categorias'}` : 'Nenhuma';
    $('#summary-photo').textContent = state.photo ? 'Adicionada' : 'Opcional';
    const done = Number(!!state.intensity) + Number(state.types.size > 0);
    $('#form-progress').style.width = `${done*50}%`;
    $('#progress-text').textContent = done === 2 ? 'Pronto para revisar. Os detalhes são opcionais.' : `${2-done} ${done?'escolha essencial':'escolhas essenciais'} para registrar`;
  }
  $$('input[name="intensity"]').forEach(input => input.addEventListener('change', () => {
    state.intensity = Number(input.value); const level = levels[state.intensity-1];
    document.documentElement.style.setProperty('--intensity-color', level.color);
    $('#intensity-readout').textContent = `${state.intensity} / 5 — ${level.name}`;
    $('.intensity-meter').setAttribute('aria-valuenow', String(state.intensity));
    $('.intensity-meter').setAttribute('aria-valuetext', level.name);
    $$('.intensity-meter>span').forEach((span,i) => span.classList.toggle('is-active',i<state.intensity));
    $('#intensity-error').hidden = true; updateSummary();
  }));
  $$('input[name="odor"]').forEach(input => input.addEventListener('change', () => {
    if(input.checked) state.types.add(input.value); else state.types.delete(input.value);
    const card = input.closest('.odor-card'); card.classList.toggle('is-selected',input.checked);
    if(input.checked && !motionPaused) {
      card.classList.remove('is-animating'); void card.offsetWidth; card.classList.add('is-animating');
      setTimeout(() => card.classList.remove('is-animating'),1300);
    }
    $('#other-field').hidden = !state.types.has('other');
    $('#selection-count').textContent = state.types.size ? `${String(state.types.size).padStart(2,'0')} ${state.types.size===1?'categoria selecionada':'categorias selecionadas'}` : 'Nenhuma categoria selecionada';
    if(state.types.size) $('#odor-error').hidden = true;
    updateSummary();
  }));
  $$('input[name="tag"]').forEach(input => input.addEventListener('change', () => {
    const value = Number(input.value);
    if(input.checked){
      if(value===7){state.tags.clear(); $$('input[name="tag"]').forEach(other => { if(other!==input) other.checked=false; });}
      else {state.tags.delete(7); $('input[name="tag"][value="7"]').checked=false;}
      state.tags.add(value);
    } else state.tags.delete(value);
  }));
  $('#observation').addEventListener('input', () => { $('#character-count').textContent = `${$('#observation').value.length} / 400`; });

  function updateTime() {
    const now = new Date();
    const date = new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'short',year:'numeric'}).format(now).replace(' de ',' ').replace(' de ',' ');
    const time = new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(now);
    $('#datetime').textContent = `${date} · ${time}`;
  }
  updateTime(); setInterval(updateTime,30000);
  async function fetchWeather(latitude,longitude,basis) {
    const generation = ++weatherGeneration;
    state.weather = null; $('#temperature').textContent='— °C'; $('#humidity').textContent='— %'; $('#wind').textContent='— km/h';
    $('#weather-status').textContent = 'Consultando condições do ar…';
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(),9000);
    try {
      const lat = Number(latitude.toFixed(2)), lon = Number(longitude.toFixed(2));
      const query = new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,relative_humidity_2m,wind_speed_10m',timezone:'America/Sao_Paulo',forecast_days:'1'});
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`,{signal:controller.signal});
      if(!response.ok) throw new Error('Weather unavailable');
      const data = await response.json(); const current = data.current;
      if(!current || ![current.temperature_2m,current.relative_humidity_2m,current.wind_speed_10m].every(Number.isFinite)) throw new Error('Incomplete weather');
      if(generation!==weatherGeneration) return;
      state.weather = {source:'Open-Meteo',basis,latitude:lat,longitude:lon,observedAt:current.time,timezone:'America/Sao_Paulo',temperatureC:current.temperature_2m,relativeHumidityPercent:current.relative_humidity_2m,windSpeedKmh:current.wind_speed_10m};
      $('#temperature').textContent = `${Math.round(current.temperature_2m)} °C`;
      $('#humidity').textContent = `${Math.round(current.relative_humidity_2m)} %`;
      $('#wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
      $('#weather-status').textContent = `Open-Meteo · ${basis==='study-area'?'área da UFN':'região do GPS'} · ${current.time.slice(11,16)}`;
    } catch {
      if(generation!==weatherGeneration) return;
      state.weather = null; $('#weather-status').textContent = 'Clima indisponível · você pode continuar';
    } finally {clearTimeout(timeout);}
  }
  fetchWeather(-29.6838,-53.8105,'study-area');
  $('#locate').addEventListener('click', () => {
    if(!navigator.geolocation){showToast('Este navegador não disponibiliza geolocalização. Você pode continuar sem GPS.');return;}
    $('#locate').disabled = true; $('#locate').textContent='Localizando…';
    navigator.geolocation.getCurrentPosition(position => {
      const {latitude,longitude,accuracy}=position.coords;
      state.location={latitude,longitude,accuracyMeters:Math.round(accuracy),capturedAt:new Date(position.timestamp).toISOString(),source:'device-gps'};
      const distance=Math.hypot((latitude+29.6838)*111,(longitude+53.8105)*96);
      $('#location-value').textContent=`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      $('#location-detail').textContent=`GPS capturado · precisão ±${Math.round(accuracy)} m${distance>3?' · fora da área de estudo':''}`;
      $('#locate').disabled=false; $('#locate').textContent='Atualizar localização ↗';
      fetchWeather(latitude,longitude,'device-region');
    }, error => {
      $('#locate').disabled=false; $('#locate').textContent='Tentar localização novamente ↗';
      if(state.location){
        $('#location-detail').textContent='Última localização capturada · atualização falhou';
        showToast('Não foi possível atualizar. A localização anterior foi mantida e será identificada pela data de captura.');
        return;
      }
      $('#location-detail').textContent=error.code===1?'GPS não autorizado · você pode continuar':'GPS indisponível · você pode continuar';
      showToast(error.code===1?'Localização não autorizada. Nenhuma coordenada foi capturada.':'Não foi possível capturar o GPS agora. Tente novamente ou continue.');
    },{enableHighAccuracy:true,timeout:12000,maximumAge:60000});
  });

  $('#camera-button').addEventListener('click',()=>$('#camera-input').click());
  $('#gallery-button').addEventListener('click',()=>$('#gallery-input').click());
  function removePhoto() {
    ++photoGeneration;
    state.photoLoading=false; $('.review-button').disabled=false;
    if(photoURL) URL.revokeObjectURL(photoURL); photoURL=null; state.photo=null;
    $('#preview-image').removeAttribute('src'); $('#photo-preview').hidden=true; $('#photo-placeholder').hidden=false;
    $('#camera-input').value=''; $('#gallery-input').value=''; $('#photo-error').hidden=true; updateSummary();
  }
  $('#remove-photo').addEventListener('click',removePhoto);
  async function choosePhoto(input) {
    const file=input.files?.[0]; if(!file) return;
    $('#photo-error').hidden=true;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>8*1024*1024){
      $('#photo-error').textContent=file.size>8*1024*1024?'A foto ultrapassa 8 MB. Escolha uma imagem menor.':'Escolha uma foto JPG, PNG ou WebP.';$('#photo-error').hidden=false;input.value='';return;
    }
    const candidate=URL.createObjectURL(file), generation=++photoGeneration;
    state.photoLoading=true; $('.review-button').disabled=true; $('#summary-photo').textContent='Carregando…';
    const preview=new Image(); preview.src=candidate;
    try {
      await preview.decode();
      if(generation!==photoGeneration){URL.revokeObjectURL(candidate);return;}
      if(photoURL) URL.revokeObjectURL(photoURL); photoURL=candidate;
      state.photo={name:file.name,type:file.type,sizeBytes:file.size,width:preview.naturalWidth,height:preview.naturalHeight,retention:'session-only',visionAnalysis:null};
      $('#preview-image').src=photoURL; $('#photo-preview').hidden=false; $('#photo-placeholder').hidden=true; updateSummary();
    } catch {URL.revokeObjectURL(candidate);if(generation===photoGeneration){$('#photo-error').textContent='Não foi possível abrir essa imagem. Escolha outra foto.';$('#photo-error').hidden=false;}}
    finally {if(generation===photoGeneration){state.photoLoading=false;$('.review-button').disabled=false;updateSummary();}}
    input.value='';
  }
  $('#camera-input').addEventListener('change',event=>choosePhoto(event.target));
  $('#gallery-input').addEventListener('change',event=>choosePhoto(event.target));

  function localDate(iso){return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(iso));}
  function createReport(){return {
    schemaVersion:1,id:window.crypto?.randomUUID?crypto.randomUUID():`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    recordedAt:new Date().toISOString(),timezone:'America/Sao_Paulo',intensity:state.intensity,
    categories:types.filter(t=>state.types.has(t.id)).map(t=>t.id),
    multiHot:Object.fromEntries(types.map(t=>[t.id,Number(state.types.has(t.id))])),
    otherDescription:state.types.has('other')?$('#other-text').value.trim():'',
    location:state.location?{...state.location}:null,weather:state.weather?{...state.weather}:null,
    studyArea:{name:'Entorno da UFN, Santa Maria/RS',referenceLatitude:-29.6838,referenceLongitude:-53.8105,isUserLocation:false},
    photo:state.photo?{...state.photo}:null,noVisibleSource:$('#invisible-source').checked,
    visibleTags:[...state.tags].map(i=>tags[i]),observation:$('#observation').value.trim(),
    evidenceType:'citizen-perception',verificationStatus:'isolated-unconfirmed',causeProven:false,
    ai:{computerVisionExecuted:false,predictionExecuted:false},storage:'browser-local',prototype:true
  };}
  $('#odor-form').addEventListener('submit',event=>{
    event.preventDefault();
    if(state.photoLoading){showToast('Aguarde a foto terminar de carregar para revisar.');return;}
    $('#intensity-error').hidden=!!state.intensity; $('#odor-error').hidden=state.types.size>0;
    if(!state.intensity){$('input[name="intensity"]').focus();return;}
    if(!state.types.size){$('input[name="odor"]').focus();return;}
    state.pending=createReport(); const report=state.pending;
    const rows=[['Intensidade',`${report.intensity} / 5 — ${levels[report.intensity-1].name}`],['Percepções',report.categories.map(id=>types.find(t=>t.id===id).label).join(', ')],
      ['Localização',report.location?`${report.location.latitude.toFixed(5)}, ${report.location.longitude.toFixed(5)} (±${report.location.accuracyMeters} m)`:'Sem GPS capturado'],
      ['Clima',report.weather?`${Math.round(report.weather.temperatureC)} °C · ${report.weather.relativeHumidityPercent}% · ${Math.round(report.weather.windSpeedKmh)} km/h (${report.weather.basis==='study-area'?'área de estudo':'região do GPS'})`:'Indisponível'],
      ['Fotografia',report.photo?'Adicionada · só nesta sessão; arquivo não será salvo':'Sem foto'],
      ['Foco visível',report.noVisibleSource?'Não há foco visível informado':'Não especificado'],
      ['Por perto',report.visibleTags.join(', ')||'Não informado'],['Observação',report.observation||'Sem observação']];
    if(report.otherDescription)rows.splice(2,0,['Outro odor',report.otherDescription]);
    $('#review-details').innerHTML=rows.map(([label,value])=>`<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('');
    openDialog($('#review-dialog'));
  });
  $('#save-report').addEventListener('click',()=>{
    if(!state.pending)return;
    const report={...state.pending,recordedAt:new Date().toISOString()};
    if(records.length>=100){showToast('Este caderno chegou a 100 relatos. Exporte os registros antes de limpar espaço.');return;}
    const next=[...records,report];
    try{localStorage.setItem(STORE_KEY,JSON.stringify(next));}
    catch{showToast('Não foi possível salvar no navegador. Verifique as permissões de armazenamento e tente novamente.');return;}
    records=next;state.pending=null;
    $('#review-dialog').close(); OdorMap.addReport(report); renderRecords();
    $('#odor-form').reset();state.intensity=null;state.types.clear();state.tags.clear();removePhoto();
    $$('.odor-card').forEach(card=>card.classList.remove('is-selected','is-animating'));
    document.documentElement.style.setProperty('--intensity-color','#111');
    $('#intensity-readout').textContent='A intensidade começa na sua percepção.';
    $('.intensity-meter').setAttribute('aria-valuenow','0');$('.intensity-meter').setAttribute('aria-valuetext','Ainda não selecionada');
    $$('.intensity-meter>span').forEach(span=>span.classList.remove('is-active'));
    $('#other-field').hidden=true;$('#selection-count').textContent='Nenhuma categoria selecionada';$('#character-count').textContent='0 / 400';updateSummary();
    showToast('Relato salvo neste navegador. Obrigado por compartilhar sua percepção.');
  });
  function renderRecords(){
    $('#local-count').textContent=String(records.length).padStart(2,'0');$('#export-records').disabled=!records.length;$('#clear-records').hidden=!records.length;
    $('#records-description').textContent=records.length?'Relatos locais de percepção · fotos não armazenadas · exportação disponível.':'Os registros que você salvar ficam disponíveis aqui.';
    $('#local-record-list').innerHTML=records.slice(-3).reverse().map(report=>{
      let date;try{date=localDate(report.recordedAt);}catch{date='Data não disponível';}
      const labels=report.categories.map(id=>types.find(t=>t.id===id)?.label||id).join(', ');
      return `<div class="record-row"><div>${escape(labels)}<small>${escape(date)} · intensidade ${report.intensity} / 5</small></div><span>ISOLADO /<br>NÃO CONFIRMADO</span></div>`;
    }).join('');
  }
  $('#export-records').addEventListener('click',()=>{
    if(!records.length)return;
    const payload={project:'Mau Odor — UFN / Santa Maria',exportedAt:new Date().toISOString(),schemaVersion:1,notice:'Relatos locais de percepção. Sem comprovação de causa. Fotografias não incluídas; apenas metadados.',records};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`mau-odor-relatos-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  $('#clear-records').addEventListener('click',()=>{
    $('#info-title').textContent='Apagar os relatos deste navegador?';
    $('#info-body').innerHTML='<p>Você pode exportar o caderno antes de apagá-lo. Essa ação remove os relatos locais deste protótipo.</p><button type="button" class="button button-outline" id="confirm-clear">Apagar relatos locais</button>';
    openDialog($('#info-dialog'));
    $('#confirm-clear').addEventListener('click',()=>{
      try{localStorage.removeItem(STORE_KEY);}catch{showToast('Não foi possível limpar o armazenamento.');return;}
      records=[];renderRecords();OdorMap.mount($('#odor-map'));$('#info-dialog').close();showToast('Relatos locais apagados.');
    });
  });
  renderRecords(); updateSummary();

  const canvas=$('#motes'),ctx=canvas.getContext('2d');
  let frame=0, phase=0, lastFrame=0, canvasWidth=500, canvasHeight=224, pointer={x:.5,y:.5};
  function resizeCanvas(){const bounds=canvas.getBoundingClientRect();canvasWidth=bounds.width;canvasHeight=bounds.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=canvasWidth*dpr;canvas.height=canvasHeight*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);}
  const particles=Array.from({length:36},(_,i)=>({x:(i*.618033)%1,y:(i*.4142)%1,r:i%4===0?.9:.55,offset:i*1.9}));
  function drawMotes(time){
    if(!ctx)return;
    const delta=Math.min((time-lastFrame)||16,50);lastFrame=time;phase+=delta*.00015*(state.intensity||1);
    ctx.clearRect(0,0,canvasWidth,canvasHeight);ctx.fillStyle=state.intensity?levels[state.intensity-1].color:'#111111';
    const count=8+(state.intensity||0)*5;
    for(const p of particles.slice(0,count)){
      const x=((p.x+phase*.05)%1)*canvasWidth;
      const y=(.17+p.y*.64)*canvasHeight+Math.sin(phase+p.offset)*7+(pointer.y-.5)*p.r*6;
      ctx.globalAlpha=.18+p.r*.24;ctx.beginPath();ctx.arc(x+(pointer.x-.5)*p.r*7,y,p.r,0,Math.PI*2);ctx.fill();
    }
    frame=requestAnimationFrame(drawMotes);
  }
  function syncMotion(){
    document.documentElement.classList.toggle('motion-paused',motionPaused);
    $('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('#motion-toggle').textContent=motionPaused?'Ativar animações':'Pausar animações';
    cancelAnimationFrame(frame);lastFrame=0;
    if(motionPaused||document.hidden){ctx?.clearRect(0,0,canvasWidth,canvasHeight);}else frame=requestAnimationFrame(drawMotes);
  }
  $('.hero-visual').addEventListener('pointermove',event=>{const bounds=event.currentTarget.getBoundingClientRect();pointer={x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height};});
  $('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion();});
  reducedMotion.addEventListener('change',event=>{motionPaused=event.matches;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);window.addEventListener('resize',resizeCanvas);resizeCanvas();syncMotion();
})();
