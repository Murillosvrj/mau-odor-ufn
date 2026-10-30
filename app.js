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
  const intensityDescriptions = [
    'Odor sutil e quase imperceptível, sentido apenas com atenção ou em breves passagens de vento, sem causar desconforto relevante.',
    'Odor leve, reconhecível ao passar pelo local, mas facilmente tolerável no trajeto.',
    'Odor nítido e persistente no ar, que já causa incômodo moderado a quem circula ou permanece por perto.',
    'Odor intenso e desagradável que chama atenção imediata e dá vontade de prender a respiração ou apressar o passo.',
    'Odor extremo e sufocante, tornando muito desconfortável permanecer no local mesmo por poucos instantes.'
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
  const region = {latitude:-29.6868,longitude:-53.8149,radiusKm:45};
  let gpsGeneration=0, cameraGeneration=0, cameraPending=false, addressController=null, lastAddressRequest=0;
  const addressCache=new Map();
  const STORE_KEY = 'waind-relatos-local-v2';
  let records = [], publicRecords = [], mapStatus='Mapa coletivo ainda não consultado.', mapStarted=false, stopMap=null, syncing=false;
  let toastTimer, photoURL = null, photoGeneration = 0, weatherGeneration = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reducedMotion.matches;
  let lastFocused = null;
  try {
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (Array.isArray(stored)) records = stored.filter(r => r && typeof r.id === 'string' && Number.isInteger(r.intensity) && r.intensity >= 1 && r.intensity <= 5 && Array.isArray(r.categories));
  } catch { /* Browsers may disable storage; a save will explain that state. */ }

  $('#hero-art').innerHTML = OdorArt.hero();
  $('#wind-art').innerHTML = OdorArt.wind();
  $('#note-art').innerHTML = `<svg class="empty-illustration" viewBox="0 0 220 140" aria-hidden="true"><g stroke-width=".8"><ellipse cx="110" cy="76" rx="67" ry="50" stroke-dasharray="2 5"/><circle cx="110" cy="76" r="38"/><circle cx="110" cy="76" r="31"/><path d="M20 76h44m92 0h44M110 8v28m0 81v19M61 28l17 17m64 63 17 17M163 25l-17 18M57 122l19-18" stroke-dasharray="3 5"/><path d="M32 98C65 98 64 46 111 46c43 0 61 52 21 64-33 10-56-30-28-42 21-9 37 17 18 23-11 4-18-9-9-12" stroke-width="1.3"/><path d="M28 103C65 106 63 40 112 40c52 0 69 63 22 76-41 12-66-35-32-54 28-15 52 22 24 35M28 108C65 114 66 35 113 35c58 0 76 72 23 87M29 113C56 118 67 101 75 84M32 119c20 4 32-8 38-19"/><path d="m110 11-4 13h8Z" fill="#111"/><circle cx="34" cy="77" r="2"/><circle cx="183" cy="76" r="2"/><circle cx="64" cy="31" r="1"/><circle cx="169" cy="120" r="1"/><path d="m173 33 4 4m0-4-4 4M50 120l3 3m0-3-3 3"/></g></svg>`;
  $('#intensity-options').innerHTML = levels.map((level,i) => `<div class="intensity-card" style="--level-color:${level.color}"><label class="intensity-option"><input type="radio" name="intensity" value="${i+1}" aria-label="${i+1}. ${level.name}" required><span class="intensity-key"><span class="selected-mark" aria-hidden="true">✓</span><span class="slot-window" aria-hidden="true"><span class="slot-track"><span>${i+1}</span><span>${i+1}</span></span></span><span class="level-label">${level.name}</span><span class="level-tick" aria-hidden="true"></span></span></label><button type="button" class="info-button intensity-info" data-intensity-info="${i+1}" aria-label="Informações sobre intensidade ${i+1}: ${level.name}">i</button></div>`).join('');
  $('#odor-options').innerHTML = types.map((type,i) => `<div class="odor-card" data-kind="${type.id}"><label class="odor-choice"><input type="checkbox" name="odor" value="${type.id}"><span class="card-topline"><span class="card-index" aria-hidden="true">0${i+1}</span><span class="card-checkbox" aria-hidden="true"></span></span><span class="card-art" aria-hidden="true">${OdorArt.icon(type.id)}</span><span class="card-label">${type.label}</span>${type.sub?`<span class="card-sublabel">${type.sub}</span>`:''}</label><button type="button" class="info-button" data-info="${type.id}" aria-label="Informações sobre ${type.label}">i</button></div>`).join('');
  $('#context-tags').innerHTML = tags.map((tag,i) => `<label class="tag"><input type="checkbox" name="tag" value="${i}"><span>${tag}</span></label>`).join('');


  const infoContent = {
    invisible:{title:'Sentir não é o mesmo que enxergar.',body:'<p>O odor pode estar no ar mesmo quando a foto mostra um lugar aparentemente limpo. Marcar esta opção evita tratar a imagem como evidência visual de uma fonte de mau odor.</p><p>No futuro, essa informação poderá ajudar a interpretar as imagens usadas na pesquisa. Neste protótipo, nenhuma foto é analisada por IA.</p>'},
    method:{title:'Uma percepção. Muitas possibilidades.',body:'<p><strong>Relato:</strong> o que alguém sentiu em um lugar e momento.</p><p><strong>Hipótese:</strong> uma possível fonte, sugerida por observação ou por um modelo, que ainda exige investigação.</p><p><strong>Causa comprovada:</strong> exige evidências próprias e não é estabelecida por este formulário. Relatos isolados são preservados como “isolado / não confirmado”.</p>'},
    about:{title:'Uma escuta coletiva do território.',body:'<p>Sistema Participativo de Monitoramento e Análise de Mau Odor Urbano com IA em Santa Maria e região — RS.</p><p>Projeto de pesquisa de Murillo Viçosa, no curso de IA e Ciência de Dados da Universidade Franciscana, estruturado pela metodologia Design Science Research.</p><p>Esta é uma versão de avaliação do design, com mapa geográfico OpenStreetMap. Não há reconhecimento automático de fotos nem modelos treinados de IA em execução.</p><p>Ao enviar, o relato completo e a identificação são guardados no banco da pesquisa WAIND (Firebase/Firestore), com acesso restrito aos pesquisadores. O mapa coletivo mostra coordenadas, data, hora, intensidade, categorias e temperatura sem nome, e-mail, endereço ou textos livres. As coordenadas exatas podem revelar rotinas. Uma cópia com identificação fica neste navegador e na exportação JSON. Sem conexão, os relatos ficam pendentes e serão sincronizados ao reconectar. A foto é temporária e não é enviada; somente seus metadados integram o registro privado. O clima usa a <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo</a>, com coordenadas arredondadas. Ao solicitar o GPS, suas coordenadas também são usadas para consultar um endereço aproximado no OpenStreetMap / Nominatim. Nome, e-mail e conteúdo do relato não acompanham essas consultas.</p>'}
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
  $$('[data-intensity-info]').forEach(button=>{
    button.addEventListener('pointerdown',event=>{event.preventDefault();event.stopPropagation();button.focus({preventScroll:true});});
    button.addEventListener('pointerup',event=>event.stopPropagation());
    button.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    const i=Number(button.dataset.intensityInfo)-1;
    $('#info-title').textContent=`${i+1} — ${levels[i].name}`;
    $('#info-body').replaceChildren(Object.assign(document.createElement('p'),{textContent:intensityDescriptions[i]}));
    openDialog($('#info-dialog'));
    });
  });
  $$('[data-about]').forEach(button => button.addEventListener('click', () => showInfo('about')));

  function updateSummary() {
    $('#summary-intensity').textContent = state.intensity ? `${state.intensity} · ${levels[state.intensity-1].name}` : 'A escolher';
    $('#summary-types').textContent = state.types.size ? `${state.types.size} ${state.types.size===1?'categoria':'categorias'}` : 'Nenhuma';
    $('#summary-photo').textContent = state.photo ? 'Adicionada' : 'Opcional';
    const done = Number(!!state.intensity) + Number(state.types.size > 0);
    $('#form-progress').style.width = `${done*50}%`;
    $('#progress-text').textContent = done === 2 ? 'Pronto para revisar. Os detalhes são opcionais.' : `${2-done} escolhas essenciais para registrar`;
    window.dispatchEvent(new Event('waind:change'));
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
  let weatherRequest=null;
  async function fetchWeather(latitude,longitude,basis) {
    const key=`${latitude.toFixed(2)},${longitude.toFixed(2)},${basis}`;
    if(weatherRequest?.key===key&&(weatherRequest.loading||(state.weather&&Date.now()-weatherRequest.startedAt<300000)))return;
    weatherRequest={key,loading:true,startedAt:Date.now()};
    const generation = ++weatherGeneration;
    state.weather = null; $('#temperature').textContent='— °C'; $('#humidity').textContent='— %'; $('#wind').textContent='— km/h';
    $('#weather-status').textContent = basis==='study-area'?'Consultando condições para Santa Maria…':'Consultando condições para sua localização…';
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(),9000);
    try {
      const lat = Number(latitude.toFixed(2)), lon = Number(longitude.toFixed(2));
      const query = new URLSearchParams({latitude:String(lat),longitude:String(lon),current:'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',timezone:'America/Sao_Paulo',forecast_days:'1'});
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`,{signal:controller.signal});
      if(!response.ok) throw new Error('Weather unavailable');
      const data = await response.json(); const current = data.current;
      if(!current || ![current.temperature_2m,current.relative_humidity_2m,current.wind_speed_10m].every(Number.isFinite)) throw new Error('Incomplete weather');
      if(generation!==weatherGeneration) return;
      state.weather = {source:'Open-Meteo',basis,latitude:lat,longitude:lon,observedAt:current.time,timezone:'America/Sao_Paulo',temperatureC:current.temperature_2m,relativeHumidityPercent:current.relative_humidity_2m,windSpeedKmh:current.wind_speed_10m,conditionCode:Number.isInteger(current.weather_code)?current.weather_code:null};
      $('#temperature').textContent = `${Math.round(current.temperature_2m)} °C`;
      $('#humidity').textContent = `${Math.round(current.relative_humidity_2m)} %`;
      $('#wind').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
      $('#weather-status').textContent = `Open-Meteo · ${basis==='study-area'?'Santa Maria':basis==='manual-region'?'região do pin':'região do GPS'} · ${current.time.slice(11,16)} · Horário de Brasília`;
    } catch {
      if(generation!==weatherGeneration) return;
      state.weather = null; $('#weather-status').textContent = 'Clima indisponível · você pode continuar';
    } finally {clearTimeout(timeout);if(generation===weatherGeneration)weatherRequest.loading=false;window.dispatchEvent(new Event('waind:change'));}
  }
  fetchWeather(region.latitude,region.longitude,'study-area');
  function regionalDistance(latitude,longitude){
    const rad=Math.PI/180, dlat=(latitude-region.latitude)*rad, dlon=(longitude-region.longitude)*rad;
    const a=Math.sin(dlat/2)**2+Math.cos(latitude*rad)*Math.cos(region.latitude*rad)*Math.sin(dlon/2)**2;
    return 6371*2*Math.asin(Math.min(1,Math.sqrt(a)));
  }
  // User-triggered only, cached and spaced by at least 1.1 s in this browser.
  // A shared proxy/rate limiter is required before broad public use (see README).
  const configController=new AbortController(),configTimeout=setTimeout(()=>configController.abort(),3000);
  const geocodingConfig=fetch('geocoding-config.json',{signal:configController.signal})
    .then(r=>r.ok?r.json():null).catch(()=>null).finally(()=>clearTimeout(configTimeout));
  async function reverseAddress(location,generation){
    const {latitude,longitude}=location;
    const key=`${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    addressController?.abort();addressController=new AbortController();
    const controller=addressController;
    const timeout=setTimeout(()=>controller.abort(),9000);
    try{
      let address=addressCache.get(key);
      if(!address){
        const config=await geocodingConfig;
        if(generation!==gpsGeneration)return;
        if(config?.enabled===false)throw new Error('Address lookup disabled');
        const endpoint=config?.reverseUrl||'https://nominatim.openstreetmap.org/reverse';
        await new Promise(resolve=>setTimeout(resolve,Math.max(0,1100-(Date.now()-lastAddressRequest))));
        if(generation!==gpsGeneration)return;
        lastAddressRequest=Date.now();
        const query=new URLSearchParams({format:'jsonv2',lat:String(latitude),lon:String(longitude),'accept-language':'pt-BR',addressdetails:'1'});
        const response=await fetch(`${endpoint}?${query}`,{signal:controller.signal,referrerPolicy:'strict-origin-when-cross-origin'});
        if(!response.ok)throw new Error('Address unavailable');
        const data=await response.json();if(!data.address||data.error)throw new Error('Address not found');
        address=data.address;addressCache.set(key,address);
      }
      if(generation!==gpsGeneration)return;
      const road=address.road||address.pedestrian||address.residential||address.footway||address.path||'Logradouro não informado neste ponto';
      const city=address.city||address.town||address.municipality||address.village||'';
      const district=address.suburb||address.neighbourhood||address.quarter||'';
      const uf=address['ISO3166-2-lvl4']?.split('-').pop()||(address.state==='Rio Grande do Sul'?'RS':address.state||'');
      const place=[district,[city,uf].filter(Boolean).join(' - ')].filter(Boolean).join(', ');
      $('#location-street').textContent=`Rua / Logradouro: ${road}${place?' · '+place:''}`;
      $('#location-postcode').textContent=address.postcode?`CEP: ${address.postcode}`:'CEP não informado neste ponto';
      if(city)$('#location-value').textContent=[city,uf].filter(Boolean).join(', ');
      location.address={street:road,district,city,state:uf,postcode:address.postcode||null,source:'OpenStreetMap / Nominatim',approximate:true};
      window.dispatchEvent(new Event('waind:change'));
    }catch{
      if(generation!==gpsGeneration)return;
      $('#location-street').textContent='Endereço indisponível agora · coordenadas preservadas.';
      $('#location-postcode').textContent='CEP não informado neste ponto';
    }finally{clearTimeout(timeout);}
  }
  function gpsError(error){
    $('#locate').disabled=false;$('#locate').textContent='Tentar localização novamente ↗';
    $('#location-detail').textContent=state.gpsLocation?'Última localização capturada · atualização falhou':error.code===1?'GPS não autorizado · você pode continuar':'GPS indisponível · você pode continuar';
    $('#location-help').hidden=false;
    $('#location-help').textContent=error.code===1?'Localização bloqueada. Toque no cadeado ou nos ajustes ao lado do endereço do site, abra Permissões e permita Localização. Depois, tente novamente. Se necessário, libere também a localização nas configurações do aparelho.':error.code===3?'O GPS demorou a responder. Tente novamente em um local com melhor sinal ou indique o local no mapa.':'Não foi possível acessar o GPS. Confira as configurações de localização ou indique o local no mapa.';
    window.dispatchEvent(new Event('waind:gps-error'));
  }
  $('#locate').addEventListener('click', () => {
    if(!navigator.geolocation){gpsError({code:2});return;}
    const generation=++gpsGeneration;
    $('#locate').disabled = true; $('#locate').textContent='Localizando…';
    $('#location-help').hidden=true;
    // Keep this native request synchronous within the original click gesture.
    try{navigator.geolocation.getCurrentPosition(position => {
      if(generation!==gpsGeneration)return;
      const {latitude,longitude,accuracy}=position.coords;
      state.gpsLocation={latitude,longitude,accuracyMeters:Math.round(accuracy),capturedAt:new Date(position.timestamp).toISOString(),source:'device-gps',isGeographic:true};
      const distance=regionalDistance(latitude,longitude);
      state.gpsLocation.withinStudyRegion=distance<=region.radiusKm;
      $('#location-value').textContent=distance<=region.radiusKm?'Santa Maria e região, RS':'Localização capturada';
      $('#location-detail').textContent=`GPS capturado${distance>region.radiusKm?' · além da referência regional de ~45 km':''}`;
      $('#location-address').hidden=false;$('#location-street').textContent='Consultando rua e bairro…';$('#location-postcode').textContent='Consultando CEP…';
      $('#location-coordinates').textContent=`Lat: ${latitude.toFixed(5)} · Long: ${longitude.toFixed(5)} (±${Math.round(accuracy)} m)`;
      $('#locate').disabled=false; $('#locate').textContent='Atualizar localização ↗';
      fetchWeather(latitude,longitude,'device-region');
      window.dispatchEvent(new Event('waind:gps'));
      reverseAddress(state.gpsLocation,generation);
    }, error => {if(generation===gpsGeneration)gpsError(error);},{enableHighAccuracy:true,timeout:15000,maximumAge:0});}catch{gpsError({code:1});}
  });

  function requestCamera(){
    if(cameraPending)return;
    $('#photo-consent').checked=true;
    const generation=++cameraGeneration;
    const failed=error=>{
      if(generation!==cameraGeneration)return;
      cameraPending=false;$('#test-camera').disabled=false;
      const reason=error?.name==='NotFoundError'?'Câmera ausente neste aparelho':error?.name==='NotReadableError'?'Câmera indisponível ou em uso':'Permissão de câmera não concedida';
      $('#camera-status').textContent=`${reason} — você ainda poderá selecionar imagens da galeria na etapa 05 ou continuar sem foto.`;
      $('#camera-footnote').textContent='Para liberar a câmera, use o cadeado/ajustes do site e as permissões do aparelho. O acesso à galeria é solicitado pelo seletor de arquivos na etapa de fotografia.';
      $('#test-camera').textContent='Tentar autorizar câmera ↗';
    };
    if(!navigator.mediaDevices?.getUserMedia){failed();return;}
    cameraPending=true;$('#test-camera').disabled=true;
    $('#camera-status').textContent='Aguardando sua autorização no navegador… Você pode continuar sem foto.';
    $('#camera-footnote').textContent='O teste encerra a câmera assim que a permissão for concedida. Nenhuma foto é capturada agora.';
    try{
      // No await or permissions.query before the native permission request.
      navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false}).then(stream=>{
        stream.getTracks().forEach(track=>track.stop());
        if(generation!==cameraGeneration)return;
        cameraPending=false;$('#test-camera').disabled=false;
        $('#camera-status').textContent='Câmera autorizada ✓ · Acesso à galeria habilitado para a etapa de fotografia';
        $('#camera-footnote').textContent='Permissão de câmera solicitada. A câmera de teste já foi encerrada. Na galeria, você autoriza apenas a imagem escolhida no seletor do aparelho.';
        $('#test-camera').textContent='Testar câmera novamente ↗';
      }).catch(failed);
    }catch(error){failed(error);}
  }
  $('#photo-consent').addEventListener('change',()=>{
    if($('#photo-consent').checked){requestCamera();return;}
    ++cameraGeneration;cameraPending=false;$('#test-camera').disabled=false;
    $('#camera-status').textContent='Fotografia opcional · você pode continuar sem foto.';
    $('#camera-footnote').textContent='Desmarcar não revoga permissões do navegador. Na etapa de fotografia, você ainda pode escolher uma imagem pelo seletor do aparelho.';
  });
  $('#test-camera').addEventListener('click',requestCamera);

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
    state.photoLoading=true; $('.review-button').disabled=true; $('#summary-photo').textContent='Carregando…';window.dispatchEvent(new Event('waind:change'));
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
    studyArea:{name:'Santa Maria e região, RS',referenceLatitude:region.latitude,referenceLongitude:region.longitude,referenceRadiusKm:region.radiusKm,isUserLocation:false},
    photo:state.photo?{...state.photo}:null,noVisibleSource:$('#invisible-source').checked,
    visibleTags:[...state.tags].map(i=>tags[i]),observation:$('#observation').value.trim(),
    evidenceType:'citizen-perception',verificationStatus:'isolated-unconfirmed',causeProven:false,
    ai:{computerVisionExecuted:false,predictionExecuted:false},storage:'browser-local',prototype:true
  };}
  function renderRecords(){
    window.dispatchEvent(new Event('waind:records'));
    $('#local-count').textContent=String(records.length).padStart(2,'0');$('#export-records').disabled=!records.length;$('#clear-records').hidden=!records.length;
    const waiting=records.filter(r=>r.syncStatus==='pendente-sincronizacao').length;
    $('#records-description').textContent=records.length?`Cópias deste navegador · ${waiting} ${waiting===1?'pendente':'pendentes'} de sincronização · exportação disponível.`:'Os registros que você salvar ficam disponíveis aqui.';
    $('#local-record-list').innerHTML=records.slice(-3).reverse().map(report=>{
      let date;try{date=report.occurrence?.kind==='past'?`Ocorrência ${localDate(report.occurrence.occurredAt)} · registrado ${localDate(report.recordedAt)}`:localDate(report.recordedAt);}catch{date='Data não disponível';}
      const labels=report.categories.map(id=>types.find(t=>t.id===id)?.label||id).join(', ');
      const status=report.syncStatus==='pendente-sincronizacao'?'PENDENTE DE SINCRONIZAÇÃO':report.cloud?.confirmed?'ENVIADO AO BANCO':'SOMENTE NESTE NAVEGADOR';
      return `<div class="record-row"><div>${escape(labels)}<small>${escape(date)} · intensidade ${report.intensity} / 5 · ${status}</small></div><span>ISOLADO /<br>NÃO CONFIRMADO</span></div>`;
    }).join('');
  }
  $('#export-records').addEventListener('click',()=>{
    if(!records.length)return;
    const payload={project:'WAIND — UFN / Santa Maria',exportedAt:new Date().toISOString(),schemaVersion:2,notice:'Relatos locais de percepção. Sem comprovação de causa. Fotografias não incluídas; apenas metadados.',records};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=`waind-relatos-${new Date().toISOString().slice(0,10)}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1500);
  });
  $('#clear-records').addEventListener('click',()=>{
    $('#info-title').textContent='Apagar os relatos deste navegador?';
    $('#info-body').innerHTML='<p>Exporte o caderno antes de apagá-lo se quiser uma cópia. Registros pendentes serão perdidos e não poderão mais ser sincronizados. Os já enviados permanecem no banco da pesquisa.</p><button type="button" class="button button-outline" id="confirm-clear">Apagar relatos locais</button>';
    openDialog($('#info-dialog'));
    $('#confirm-clear').addEventListener('click',()=>{
      try{localStorage.removeItem(STORE_KEY);}catch{showToast('Não foi possível limpar o armazenamento.');return;}
      records=[];renderRecords();$('#info-dialog').close();showToast('Relatos locais apagados.');
    });
  });
  renderRecords(); updateSummary();

  function cache(next){
    // Never discard unsent reports when keeping the last 100 confirmed copies.
    const pending=next.filter(r=>r.syncStatus==='pendente-sincronizacao');
    const confirmed=next.filter(r=>r.syncStatus!=='pendente-sincronizacao').slice(-100);
    const keep=[...confirmed,...pending].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
    localStorage.setItem(STORE_KEY,JSON.stringify(keep));records=keep;
  }
  function remember(report){cache([...records.filter(r=>r.id!==report.id),report]);renderRecords();}
  function startMap(){
    mapStarted=true;stopMap?.();
    WaindCloud.listenMap(items=>{publicRecords=items;window.dispatchEvent(new Event('waind:records'));},text=>{mapStatus=text;window.dispatchEvent(new Event('waind:records'));}).then(stop=>{stopMap=stop;});
  }
  async function syncPending(){
    if(syncing||navigator.onLine===false)return;
    syncing=true;let sent=0;
    try{
      for(const report of records.filter(r=>r.syncStatus==='pendente-sincronizacao'&&r.consent?.publicMap)){
        try{
          const receipt=await WaindCloud.save(report);
          // Do not restore a local copy if the participant erased it while sending.
          if(!records.some(r=>r.id===report.id))continue;
          report.syncStatus='sincronizado';report.storage='firebase';report.cloud={...receipt,confirmed:true};delete report.syncError;
          try{remember(report);}catch{renderRecords();}
          sent++;
        }catch(error){report.syncError=String(error?.code||'network');try{remember(report);}catch{/* Preserve the existing durable pending copy. */}}
      }
    }finally{syncing=false;if(sent)showToast(`${sent} ${sent===1?'relato sincronizado':'relatos sincronizados'} com o banco da pesquisa.`);}
  }
  window.addEventListener('online',()=>{syncPending();if(mapStarted)startMap();});
  window.addEventListener('storage',event=>{
    if(event.key!==STORE_KEY)return;
    try{const next=JSON.parse(event.newValue||'[]');if(Array.isArray(next)){records=next;renderRecords();}}catch{/* Keep the current caderno if external data is invalid. */}
  });
  setTimeout(syncPending,1200);setInterval(syncPending,60000);

  window.WaindApp = {
    state, levels, types, showToast, showInfo, createReport, fetchWeather,
    startMap,syncPending,getMapStatus:()=>mapStatus,
    getLocalRecords:()=>records.map(r=>({...r})),
    getRecords:()=>[...new Map([...records.map(r=>({id:r.id,location:r.location,intensity:r.intensity,categories:r.categories,recordedAt:r.recordedAt,occurrence:r.occurrence})),...publicRecords].map(r=>[r.id,r])).values()],
    getPhotoURL:()=>photoURL,
    async save(report){
      report.syncStatus='pendente-sincronizacao';report.storage='browser-local';
      let durable=false;
      try{remember(report);durable=true;}catch{/* A confirmed cloud send can still succeed without local storage. */}
      try {
        const receipt=await WaindCloud.save(report);
        report.syncStatus='sincronizado';report.storage='firebase';report.cloud={...receipt,confirmed:true};delete report.syncError;
        try{remember(report);}catch{showToast('Enviado ao banco. Não foi possível atualizar a cópia neste navegador.');}
        return {status:'sincronizado',id:report.id};
      } catch(error) {
        report.syncError=String(error?.code||'network');
        try{remember(report);durable=true;}catch{/* Do not claim a local save without a durable copy. */}
        if(!durable){showToast('Não foi possível enviar nem salvar neste navegador. Mantenha esta tela aberta e tente novamente.');return false;}
        showToast(WaindCloud.message(error));return {status:'pendente-sincronizacao',id:report.id,message:WaindCloud.message(error)};
      }
    },
    reset(){
      ++gpsGeneration;++cameraGeneration;cameraPending=false;addressController?.abort();
      $('#odor-form').reset(); state.intensity=null;state.types.clear();state.tags.clear();state.location=null;state.pending=null;state.gpsLocation=null;removePhoto();
      $$('.odor-card').forEach(card=>card.classList.remove('is-selected','is-animating'));
      document.documentElement.style.setProperty('--intensity-color','#111');
      $('#intensity-readout').textContent='A intensidade começa na sua percepção.';
      $('.intensity-meter').setAttribute('aria-valuenow','0');$('.intensity-meter').setAttribute('aria-valuetext','Ainda não selecionada');
      $$('.intensity-meter>span').forEach(span=>span.classList.remove('is-active'));
      $('#other-field').hidden=true;$('#selection-count').textContent='Nenhuma categoria selecionada';$('#character-count').textContent='0 / 400';
      $('#location-value').textContent='Santa Maria, RS';$('#location-detail').textContent='Santa Maria e região · GPS ainda não capturado';
      $('#location-address').hidden=true;$('#location-help').hidden=true;$('#locate').disabled=false;$('#locate').textContent='Usar minha localização ↗';
      $('#test-camera').disabled=false;$('#test-camera').textContent='Autorizar / testar câmera ↗';$('#camera-status').textContent='A câmera será testada ao marcar esta opção.';
      $('#camera-footnote').textContent='Opcional. Na etapa de fotografia, a galeria abre o seletor do aparelho; você escolhe quais imagens compartilhar.';
      updateSummary();fetchWeather(region.latitude,region.longitude,'study-area');
    }
  };

  const canvas=$('#motes'),ctx=canvas.getContext('2d');
  let gustUntil=0;
  const heroInView=()=>{const r=canvas.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight;};
  window.addEventListener('waind:gust',event=>{gustUntil=performance.now()+(event.detail?.duration||800);});
  let frame=0, phase=0, lastFrame=0, canvasWidth=500, canvasHeight=224, pointer={x:.5,y:.5};
  function resizeCanvas(){const bounds=canvas.getBoundingClientRect();canvasWidth=bounds.width;canvasHeight=bounds.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=canvasWidth*dpr;canvas.height=canvasHeight*dpr;ctx?.setTransform(dpr,0,0,dpr,0,0);}
  const particles=Array.from({length:36},(_,i)=>({x:(i*.618033)%1,y:(i*.4142)%1,r:i%4===0?.9:.55,offset:i*1.9}));
  function drawMotes(time){
    if(!ctx)return;
    const delta=Math.min((time-lastFrame)||16,50);lastFrame=time;
    const gust=Math.max(0,(gustUntil-time)/800);
    phase+=delta*.000055*(1+(state.intensity||0)*.1)*(1+gust*4.5);
    ctx.clearRect(0,0,canvasWidth,canvasHeight);ctx.fillStyle=state.intensity?levels[state.intensity-1].color:'#111111';
    const count=18+(state.intensity||0)*3;
    for(const p of particles.slice(0,count)){
      const x=((p.x+phase)%1)*canvasWidth;
      const y=(.17+p.y*.64)*canvasHeight+Math.sin(phase*5+p.offset)*4+(pointer.y-.5)*p.r*6;
      ctx.globalAlpha=.18+p.r*.24;ctx.beginPath();ctx.arc(x+(pointer.x-.5)*p.r*7,y,p.r,0,Math.PI*2);ctx.fill();
    }
    frame=requestAnimationFrame(drawMotes);
  }
  function syncMotion(){
    document.documentElement.classList.toggle('motion-paused',motionPaused);
    $('#motion-toggle').setAttribute('aria-pressed',String(motionPaused));$('#motion-toggle').textContent=motionPaused?'Ativar animações':'Pausar animações';
    cancelAnimationFrame(frame);lastFrame=0;
    window.dispatchEvent(new CustomEvent('waind:motion',{detail:{paused:motionPaused}}));
    if(motionPaused||document.hidden||!heroInView()){ctx?.clearRect(0,0,canvasWidth,canvasHeight);}else frame=requestAnimationFrame(drawMotes);
  }
  $('.hero-visual').addEventListener('pointermove',event=>{const bounds=event.currentTarget.getBoundingClientRect();pointer={x:(event.clientX-bounds.left)/bounds.width,y:(event.clientY-bounds.top)/bounds.height};});
  $('#motion-toggle').addEventListener('click',()=>{motionPaused=!motionPaused;syncMotion();});
  reducedMotion.addEventListener('change',event=>{motionPaused=event.matches;syncMotion();});
  const heroObserver=new IntersectionObserver(()=>{resizeCanvas();syncMotion();});heroObserver.observe(canvas);
  window.addEventListener('waind:screen-settled',()=>{resizeCanvas();syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);window.addEventListener('resize',()=>{resizeCanvas();syncMotion();});resizeCanvas();syncMotion();
})();

