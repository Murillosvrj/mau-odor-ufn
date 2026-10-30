(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)], app=window.WaindApp;
  let step='0', pinMap=null, manualLocation=null, mode=null, pending=null, saved=false, savedId=null, resetting=false, mapGpsAttempted=false, submitting=false;
  const value=name=>$(`input[name="${name}"]:checked`)?.value;
  const isPast=()=>value('screening')==='no'&&value('past-choice')==='yes';
  const exploring=()=>value('screening')==='no'&&value('past-choice')==='no';
  const dateLocal=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replace(' ','T');
  const route=()=>value('screening')==='no' ? (exploring()?['1','2','past','7']:['1','2','past','3','4','5','6','7']) : ['1','2','3','4','5','6','7'];
  const names={'1':'Início e contexto','2':'Sua percepção',past:'Uma ocorrência anterior','3':'Intensidade','4':'Tipo de odor','5':'Fotografia','6':'Por perto','7':'Localização e revisão'};
  WaindBrand.mount($('#enter-waind'));
  $('.screening-art').innerHTML=OdorArt.wind();
  $('#occurred-at').max=dateLocal();
  function validIdentity(){return $('#participant-name').value.trim().length>0&&$('#participant-email').value.trim().length>0&&$('#participant-email').validity.valid&&$('#context-confirm').checked&&$('#data-consent').checked;}
  function locationValid(){return mode==='pin'?!!manualLocation:mode==='gps'&&!!app.state.gpsLocation&&(!isPast()||$('#past-gps-confirm').checked);}
  function valid(){
    switch(step){case '1':return validIdentity();case '2':return !!value('screening');case 'past':return value('past-choice')==='no'||(value('past-choice')==='yes'&&!!$('#occurred-at').value&&$('#occurred-at').value<=dateLocal());case '3':return !!app.state.intensity;case '4':return app.state.types.size>0&&(!app.state.types.has('other')||!!$('#other-text').value.trim());case '5':return !app.state.photoLoading;case '7':return exploring()||saved||locationValid();default:return true;}
  }
  const hints={'1':'Preencha nome e e-mail e confirme os dados.','2':'Escolha a opção que descreve este momento.',past:'Escolha uma opção e, se for registrar, indique quando aconteceu.','3':'Selecione uma intensidade para continuar.','4':'Selecione um tipo; para Outros, descreva o cheiro.','5':'Aguarde o carregamento da fotografia.','7':'Escolha GPS ou marque um local no mapa.'};
  function updateNavigation(){
    $('#nav-caption').hidden=step==='1';
    if(step==='0')return;
    const okay=valid();$('#next-step').disabled=!okay||submitting;
    $('#step-hint').textContent=okay?(step==='7'?(exploring()?'Explore livremente. Nenhum relato será criado.':saved?'Confira abaixo a situação do registro.':'Revise os dados antes de enviar.'): 'Suas escolhas são mantidas ao voltar.'):hints[step]||'';
    $('#next-step').textContent=submitting?'Enviando relato…':'Continuar →';
    $('#next-step').setAttribute('aria-label',step==='7'?(saved?'Continuar para um novo relato':exploring()?'Continuar para o início':$('#review-panel').hidden?'Continuar para revisar o relato':'Continuar para enviar o relato'):'Continuar para a próxima etapa');
    $('#nav-caption').textContent=step==='7'?(saved?'REGISTRO CONCLUÍDO':exploring()?'EXPLORAR O TERRITÓRIO':$('#review-panel').hidden?'REVISAR RELATO':'ENVIAR RELATO'):names[step];
    $('#review-open').disabled=!locationValid()||app.state.photoLoading;
  }
  function currentView(){
    if(step==='0')return $('#splash');
    if(step==='7')return !$('#success-panel').hidden?$('#success-panel'):!$('#review-panel').hidden?$('#review-panel'):$('#location-panel');
    return $(`[data-step="${step}"]`);
  }
  function withWind(change){
    if(WaindMotion.busy)return;
    return WaindMotion.run(currentView(),change,currentView).then(()=>{
      const view=currentView(),target=step==='0'?$('#enter-waind'):view.querySelector('h1,h2')||view;
      if(target?.tagName!=='BUTTON')target?.setAttribute('tabindex','-1');target?.focus({preventScroll:true});
    });
  }
  function navigate(next,{historyWrite=true,animated=true}={}){
    if(animated)return withWind(()=>navigate(next,{historyWrite,animated:false}));
    if(saved&&String(next)!=='7'){saved=false;$('#success-panel').hidden=true;$('#location-panel').hidden=false;}
    step=String(next);if(step!=='0'&&!names[step])step='0';
    $('#splash').hidden=step!=='0';$('#app-frame').hidden=step==='0';
    $$('.wizard-screen').forEach(el=>{el.hidden=el.dataset.step!==step;});
    $('#records-wrap').hidden=step!=='7'||!(saved||validIdentity());
    if(step!=='0'){
      const n=step==='past'?2:Number(step);$('#step-label').textContent=`PASSO ${String(n).padStart(2,'0')} / 07${step==='past'?' · MEMÓRIA':''}`;
      $('#wizard-progress').setAttribute('aria-valuenow',n);$('#wizard-progress span').style.transform=`scaleX(${n/7})`;
      if(step==='7')setupLocation();
    }
    document.title=step==='0'?'WAIND — Caderno de campo urbano':`WAIND · ${names[step]}`;
    if(historyWrite)history.pushState({waindStep:step},'',`#${step==='0'?'inicio':'passo-'+step}`);
    window.scrollTo({top:0,behavior:'instant'});window.dispatchEvent(new Event('resize'));updateNavigation();
  }
  function back(){
    if(WaindMotion.busy||submitting)return;
    if(step==='7'&&!$('#review-panel').hidden){closeReview();return;}
    const r=route(),i=r.indexOf(step);navigate(i>0?r[i-1]:'0');
  }
  function advance(){
    if(WaindMotion.busy||submitting)return;
    if(!valid())return;
    if(step==='7'){if(saved){restart();return;}if(exploring()){navigate('0');return;}if(!$('#review-panel').hidden){save();return;}review();return;}
    const r=route(),next=r[r.indexOf(step)+1]||'7';if(next==='7')requestMapGps();navigate(next);
  }
  function closeReview(animated=true){
    const change=()=>{pending=null;$('#review-panel').hidden=true;$('#location-panel').hidden=false;updateNavigation();pinMap?.refresh();};
    if(animated&&!$('#review-panel').hidden)return withWind(change);
    change();
  }
  function weatherText(){const w=app.state.weather;return w?`${Math.round(w.temperatureC)} °C · ${w.relativeHumidityPercent}% umidade · ${Math.round(w.windSpeedKmh)} km/h vento — ${w.basis==='study-area'?'Santa Maria':w.basis==='manual-region'?'região do pin':'região do GPS'}, ${w.observedAt.replace('T',' ')} · Horário de Brasília${isPast()?' (atual; não corresponde à ocorrência anterior)':''}`:'Clima indisponível';}
  function locationText(loc){
    if(!loc)return 'Local ainda não confirmado';
    const a=loc.address,address=a?`${a.street} · ${[a.district,a.city,a.state].filter(Boolean).join(', ')} · ${a.postcode?'CEP: '+a.postcode:'CEP não informado neste ponto'} · `:'';
    return `${address}Lat: ${loc.latitude.toFixed(5)} · Long: ${loc.longitude.toFixed(5)} · ${loc.source==='device-gps'?`GPS, precisão estimada ±${loc.accuracyMeters} m`:'pin indicado no mapa'}`;
  }
  function summary(){return [['Quando',isPast()?$('#occurred-at').value.replace('T',' ')+' · ocorrência anterior':'Percepção neste momento'],['Intensidade',app.state.intensity?`${app.state.intensity}/5 — ${app.levels[app.state.intensity-1].name}`:'A escolher'],['Tipo de odor',app.types.filter(t=>app.state.types.has(t.id)).map(t=>t.label).join(', ')||'A escolher'],...app.state.types.has('other')?[['Outro odor',$('#other-text').value.trim()]]:[],['Fotografia',app.state.photo?'Foto preparada · envio ao acervo privado':'Sem fotografia'],['Odor no ar',$('#invisible-source').checked?'Sem foco visível informado':'Não especificado'],['Por perto',[...app.state.tags].map(i=>['Lixo acumulado','Contentor próximo','Bueiro / ralo','Água parada','Vala aberta','Restos de alimentos','Animais por perto','Nada aparente'][i]).join(', ')||'Não informado'],['Observação',$('#observation').value.trim()||'Sem observação'],['Clima',weatherText()]];}
  function requestMapGps(){if(mapGpsAttempted||app.state.gpsLocation||$('#locate').disabled)return;mapGpsAttempted=true;$('#locate').click();}
  function ensureMap(){
    if(!pinMap){app.startMap();pinMap=WaindPin.mount($('#pin-map'),{
      initialCenter:app.state.gpsLocation,getGpsLocation:()=>app.state.gpsLocation,getGpsPending:()=>$('#locate').disabled&&!app.state.location,
      getRecords:()=>app.getRecords(),getLevels:()=>app.levels,
      getMapStatus:()=>app.getMapStatus(),
      getPreview:()=>!saved&&!exploring()&&app.state.intensity&&!app.getLocalRecords().some(r=>r.id===pending?.id)?{intensity:app.state.intensity,location:app.state.location}:null,
      onChange(loc){if(!exploring()){mode='pin';$('input[name="location-mode"][value="pin"]').checked=true;manualLocation=loc;app.state.location=loc;pending=null;$('#location-error').hidden=true;updateNavigation();app.fetchWeather(loc.latitude,loc.longitude,'manual-region');}},
      getSummary:()=>exploring()?[['Exploração','Nenhum relato será salvo.']]:summary(),getPhotoURL:()=>exploring()?null:app.getPhotoURL(),
      categoryLabel:id=>app.types.find(t=>t.id===id)?.label||id
    });}
    pinMap.refresh();requestMapGps();
  }
  function setupLocation(){
    const explore=exploring();$('.location-choices').hidden=explore;$('#review-open').hidden=explore;$('#location-intro').textContent=explore?'Explore Santa Maria e região. Para registrar uma percepção, volte às perguntas.':isPast()?'Marque onde aconteceu a ocorrência anterior em Santa Maria e região. Sua localização atual pode ser diferente.':'Confirme onde você percebeu o odor em Santa Maria e região.';
    $('#place-title').innerHTML=explore?'Um olhar sobre <em>o território.</em>':'Onde o ar contou <em>essa história?</em>';
    $('#past-place-confirm').hidden=!isPast();$('#gps-final').hidden=explore||mode!=='gps';$('#manual-map-panel').hidden=false;
    const gps=app.state.gpsLocation;$('#gps-final-status').textContent=locationText(gps);$('#gps-choice-detail').textContent=gps?locationText(gps):'Capturar ou usar o GPS autorizado.';
    if(mode==='gps')app.state.location=gps||null;else if(mode==='pin')app.state.location=manualLocation;
    ensureMap();if(mode==='gps')pinMap.setLocation(gps||null);else if(mode==='pin')pinMap.setLocation(manualLocation);else pinMap.setLocation(null);
    const loc=app.state.location;if(!explore&&loc)app.fetchWeather(loc.latitude,loc.longitude,mode==='gps'?'device-region':'manual-region');
  }
  function review(){
    if(WaindMotion.busy)return;
    if(!validIdentity()||!app.state.intensity||!app.state.types.size||(app.state.types.has('other')&&!$('#other-text').value.trim())){app.showToast('Confira seus dados e as escolhas antes de revisar.');navigate(!validIdentity()?'1':!app.state.intensity?'3':'4');return;}
    if(!locationValid()||app.state.photoLoading){$('#location-error').hidden=false;return;}
    if(isPast()&&(!$('#occurred-at').value||$('#occurred-at').value>dateLocal())){navigate('past');return;}
    pending=app.createReport();pending.schemaVersion=6;pending.project='WAIND';pending.participant={name:$('#participant-name').value.trim(),email:$('#participant-email').value.trim()};pending.consent={cloudStorage:true,publicMap:true,localStorage:true,contextConfirmed:true,photoIntended:$('#photo-consent').checked,acceptedAt:new Date().toISOString(),version:'waind-pesquisa-mapa-0.6'};
    pending.occurrence={kind:isPast()?'past':'current',occurredAt:isPast()?new Date($('#occurred-at').value+':00-03:00').toISOString():pending.recordedAt,timezone:'America/Sao_Paulo',approximate:isPast()};
    pending.weatherContext={relationship:isPast()?'current-context-not-historical':'current-regional-context',notMeasuredAtSource:true};
    const rows=[['Nome',pending.participant.name],['E-mail',pending.participant.email],['Fuso horário','Horário de Brasília'],...summary(),['Localização',locationText(pending.location)]];
    $('#review-details').replaceChildren(...rows.map(([key,text])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=text;row.append(dt,dd);return row;}));
    $('#review-photo').hidden=!app.getPhotoURL();if(app.getPhotoURL())$('#review-photo').src=app.getPhotoURL();else $('#review-photo').removeAttribute('src');
    withWind(()=>{$('#review-panel').hidden=false;$('#location-panel').hidden=true;window.scrollTo({top:0,behavior:'instant'});updateNavigation();});
  }
  async function save(){
    if(WaindMotion.busy||!pending||saved||submitting)return;
    submitting=true;
    const buttons=$$('#review-panel button, #back-step, #home-waind');
    buttons.forEach(b=>b.disabled=true);$('#save-report').textContent='Enviando relato…';
    $('#send-status').hidden=false;$('#send-status').textContent='Enviando relato ao banco da pesquisa WAIND…';updateNavigation();
    try {
      const result=await app.save(pending);
      if(result)await withWind(()=>{
        saved=true;savedId=pending.id;showSaved(result.status,result.message);
        pending=null;$('#review-panel').hidden=true;$('#location-panel').hidden=true;$('#success-panel').hidden=false;
        $('#records-wrap').hidden=false;window.scrollTo({top:0,behavior:'instant'});updateNavigation();
      });
      else $('#send-status').textContent='Envio não confirmado. Seus dados continuam aqui para tentar novamente.';
    } finally {
      submitting=false;buttons.forEach(b=>b.disabled=false);$('#save-report').textContent='Enviar Relato ↗';updateNavigation();
    }
  }
  function showSaved(status,message){
    const confirmed=status==='sincronizado';
    $('#success-caption').textContent=confirmed?'PERCEPÇÃO REGISTRADA NO BANCO':'SALVO NESTE NAVEGADOR';
    $('#success-description').textContent=confirmed?'Seu relato foi confirmado no banco da pesquisa WAIND. O ponto sem nome e e-mail participa do mapa coletivo. A cópia deste navegador pode ser exportada em JSON.':message||'Seu relato está pendente de sincronização. Ele foi salvo neste navegador e será enviado automaticamente quando a conexão voltar. Você também pode exportar o JSON.';
    $('#saved-reference').textContent=`Registro ${savedId.slice(0,8)} · ${confirmed?'confirmado no Firebase':'pendente de sincronização'}`;
  }
  window.addEventListener('waind:records',()=>{
    if(!savedId||!saved)return;
    const record=app.getLocalRecords().find(r=>r.id===savedId);if(record)showSaved(record.syncStatus);
  });
  function restart(){withWind(()=>{resetting=true;mapGpsAttempted=false;pinMap?.destroy?.();pinMap=null;manualLocation=null;mode=null;pending=null;saved=false;app.reset();$('#past-time-field').hidden=true;$('#success-panel').hidden=true;$('#review-panel').hidden=true;$('#location-panel').hidden=false;resetting=false;navigate('1',{animated:false});});}
  $('#enter-waind').addEventListener('click',()=>navigate('1'));$('#home-waind').addEventListener('click',()=>navigate('0'));$('#back-step').addEventListener('click',back);$('#next-step').addEventListener('click',advance);
  $('#odor-form').addEventListener('submit',e=>{e.preventDefault();advance();});
  $('#odor-form').addEventListener('input',()=>{if(!resetting){pending=null;updateNavigation();}});
  $$('input[name="screening"],input[name="past-choice"]').forEach(el=>el.addEventListener('change',()=>{$('#past-time-field').hidden=value('past-choice')!=='yes';closeReview();updateNavigation();}));
  $$('input[name="location-mode"]').forEach(el=>el.addEventListener('change',()=>{mode=el.value;closeReview();setupLocation();updateNavigation();}));
  $('#gps-final-button').addEventListener('click',()=>$('#locate').click());
  window.addEventListener('waind:gps',()=>{if(mode==='gps')app.state.location=app.state.gpsLocation;if(!manualLocation)pinMap?.centerOn(app.state.gpsLocation);if(step==='7')setupLocation();updateNavigation();});
  window.addEventListener('waind:gps-error',()=>{
    $('#gps-final-help').hidden=$('#location-help').hidden;$('#gps-final-help').textContent=$('#location-help').textContent;
    pinMap?.refresh();
  });
  window.addEventListener('waind:records',()=>pinMap?.refresh());
  window.addEventListener('waind:change',()=>{updateNavigation();if(step==='7')pinMap?.refresh();});
  function editStep(dest){withWind(()=>{closeReview(false);navigate(dest,{animated:false});});}
  $('#review-open').addEventListener('click',review);$('#edit-report').addEventListener('click',()=>editStep('3'));$('#save-report').addEventListener('click',save);$('#new-report').addEventListener('click',restart);
  $$('[data-edit]').forEach(b=>b.addEventListener('click',()=>editStep(b.dataset.edit)));
  ['camera-button','gallery-button'].forEach(id=>$('#'+id).addEventListener('click',()=>{$('#photo-consent').checked=true;}));
  $('#other-text').required=true;$('#other-field label .optional').textContent='DESCREVA SUA PERCEPÇÃO';
  window.addEventListener('popstate',e=>{if(submitting){history.pushState({waindStep:'7'},'','#passo-7');return;}let dest=e.state?.waindStep||'0';if(dest!=='0'&&!route().includes(dest))dest='2';WaindMotion.finish();withWind(()=>{closeReview(false);navigate(dest,{historyWrite:false,animated:false});});});
  history.replaceState({waindStep:'0'},'','#inicio');navigate('0',{historyWrite:false,animated:false});
})();

