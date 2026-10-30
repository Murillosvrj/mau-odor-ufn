/* Real vector geography; local-only heat and markers. MapLibre GL JS / OpenFreeMap. */
(() => {
  'use strict';
  const HOME={latitude:-29.6868,longitude:-53.8149},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const valid=p=>p&&Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)&&Math.abs(p.latitude)<=85&&Math.abs(p.longitude)<=180;
  const xy=(p,z)=>{const n=512*2**z,s=Math.sin(p.latitude*Math.PI/180);return{x:(p.longitude+180)/360*n,y:(.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n};};
  const ll=(p,z)=>{const n=512*2**z;return{longitude:((p.x/n*360)%360+360)%360-180,latitude:Math.atan(Math.sinh(Math.PI*(1-2*clamp(p.y,0,n)/n)))*180/Math.PI};};
  function style(){
    const source='openmaptiles',roadFilter=['match',['get','class'],['motorway','trunk','primary','secondary','tertiary','minor','service','track','path'],true,false];
    const roadWidth=['interpolate',['linear'],['zoom'],10,.6,14,2,16,7,19,26];
    // Explicit allowlist: no inherited POI, shield, house number, building label,
    // sprite or icon layers can leak through a provider style update.
    return {version:8,glyphs:'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',sources:{openmaptiles:{type:'vector',url:'https://tiles.openfreemap.org/planet'}},layers:[
      {id:'paper',type:'background',paint:{'background-color':'#FAF8F5'}},
      {id:'blocks',type:'fill',source,'source-layer':'landuse',paint:{'fill-color':'#F6F3EE','fill-opacity':.8}},
      {id:'landcover',type:'fill',source,'source-layer':'landcover',paint:{'fill-color':'#EFEBE3','fill-opacity':.28}},
      {id:'parks',type:'fill',source,'source-layer':'park',paint:{'fill-color':'#EAE7DF','fill-opacity':.5}},
      {id:'water-paper',type:'fill',source,'source-layer':'water',paint:{'fill-color':'#E3E0D8','fill-outline-color':'#B8B2A8'}},
      {id:'water-lines',type:'line',source,'source-layer':'waterway',paint:{'line-color':'#B8B2A8','line-width':.7}},
      {id:'building-paper',type:'fill',source,'source-layer':'building',minzoom:13,paint:{'fill-color':'#F1EDE5'}},
      {id:'building-hatch',type:'fill',source,'source-layer':'building',minzoom:14,paint:{'fill-pattern':'odor-map-building-hatch','fill-opacity':.65}},
      {id:'building-outline',type:'line',source,'source-layer':'building',minzoom:13,paint:{'line-color':'#8F887C','line-opacity':.65,'line-width':['interpolate',['linear'],['zoom'],13,.35,17,.8]}},
      {id:'street-edges',type:'line',source,'source-layer':'transportation',filter:roadFilter,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#B8B2A8','line-width':['interpolate',['linear'],['zoom'],10,1.6,14,3,16,8,19,27]}},
      {id:'street-paper',type:'line',source,'source-layer':'transportation',filter:roadFilter,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#FAF8F5','line-width':roadWidth}},
      {id:'street-names',type:'symbol',source,'source-layer':'transportation_name',minzoom:15,filter:['all',['has','name'],roadFilter],layout:{'symbol-placement':'line','text-field':['coalesce',['get','name:pt'],['get','name']],'text-font':['Noto Sans Regular'],'text-size':['interpolate',['linear'],['zoom'],15,10,18,12],'text-letter-spacing':.035,'text-max-angle':30,'text-padding':12},paint:{'text-color':'#5C564C','text-halo-color':'#FAF8F5','text-halo-width':1.5}}
    ]};
  }
  function hatch(){
    const c=document.createElement('canvas');c.width=40;c.height=16;const ctx=c.getContext('2d');ctx.strokeStyle='#8F887C';ctx.lineWidth=.55;
    for(let y=-16;y<=48;y+=4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(40,y-16);ctx.stroke();}return ctx.getImageData(0,0,40,16);
  }
  function mount(element,options={}){
    if(typeof element==='string')element=document.querySelector(element);if(!element)throw new Error('Elemento do mapa não encontrado.');
    const host=document.createElement('section');host.className='waind-pin';host.setAttribute('aria-label','Mapa de percepções em Santa Maria e região');
    host.innerHTML=`<div class="pin-heading"><strong>Um ponto no território.</strong><span>SANTA MARIA E REGIÃO / RS</span></div>
      <div class="pin-viewport" role="region" tabindex="0" aria-label="Mapa geográfico: arraste, use a roda ou faça pinça para ampliar">
        <div class="pin-vector"></div><canvas class="pin-heat" aria-hidden="true"></canvas><div class="pin-record-points"></div><p class="pin-gps-wait" role="status" hidden>Localizando sua posição…<br><small>Você também pode informar coordenadas conhecidas abaixo.</small></p>
        <div class="pin-crosshair" aria-hidden="true"></div><div class="pin-north" aria-hidden="true"><svg viewBox="0 0 38 55"><circle cx="19" cy="30" r="15" stroke-dasharray="2 3"/><path d="M19 13v34M2 30h34M19 16l4 14h-8z"/><text x="19" y="8" text-anchor="middle">N</text></svg></div>
        <div class="pin-controls" aria-label="Controles do mapa"><button type="button" data-pin-action="plus" aria-label="Ampliar mapa">+</button><button type="button" data-pin-action="minus" aria-label="Reduzir mapa">−</button><button type="button" data-pin-action="home" aria-label="Voltar à minha localização ou a Santa Maria">⌂</button></div>
        <button type="button" class="pin-marker" aria-label="Abrir resumo do pino atual" aria-expanded="false" hidden><svg viewBox="0 0 48 55" aria-hidden="true"><ellipse class="pin-ring" cx="24" cy="49" rx="16" ry="4"/><path d="M24 49C19 40 9 31 9 21a15 15 0 0 1 30 0c0 10-10 19-15 28Z" fill="#fff" stroke="currentColor" stroke-width="1.6"/><path d="M13 22c1 8 7 16 11 23M16 23c1 6 5 13 8 18M19 24c1 5 3 9 5 13" fill="none" stroke="currentColor" stroke-width=".65"/><circle cx="24" cy="20" r="5" fill="currentColor"/></svg></button>
        <aside class="pin-popup" hidden><button type="button" class="pin-popup-close" aria-label="Fechar resumo do pin">×</button><p class="pin-caption"></p><h3>O que foi percebido.</h3><dl></dl><img alt="Fotografia deste relato na sessão" hidden></aside>
        <p class="pin-error" role="status" hidden></p><div class="pin-attribution"><a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></div>
      </div><div class="pin-legend" aria-label="Legenda de intensidade">${['Muito fraco','Fraco','Intermediário','Forte','Muito forte'].map((label,i)=>`<span title="${i+1} — ${label}"><i style="--heat-color:${OdorHeat.colors[i]}"></i>${i+1}<span class="sr-only"> — ${label}</span></span>`).join('')}<small>INTENSIDADE / 1–5</small></div>
      <p class="pin-heat-status" role="status"></p><div class="pin-actions"><button type="button" class="button button-ink" data-pin-action="place">Marcar no centro da mira</button><span class="pin-coordinates">Nenhum pin confirmado.</span></div>
      <p class="pin-help">Toque para marcar. Arraste para mover; use a roda do mouse ou pinça com dois dedos para ampliar. Com o mapa em foco, setas movem e Enter confirma a mira. Toque nos pontos para ler os relatos.</p>
      <details class="pin-coordinate-entry"><summary>Informar coordenadas manualmente</summary><p>Use coordenadas conhecidas se a cartografia estiver indisponível.</p><div><label>Latitude<input data-coordinate="lat" type="number" step="any" min="-85" max="85" inputmode="decimal" placeholder="−29.68680"></label><label>Longitude<input data-coordinate="lon" type="number" step="any" min="-180" max="180" inputmode="decimal" placeholder="−53.81490"></label></div><button class="button button-outline" type="button" data-pin-action="coordinates">Confirmar coordenadas</button></details>
      <p class="pin-map-status" role="status" aria-live="polite"></p><p class="pin-method">DSR · O calor reúne os relatos públicos do WAIND (até 500 mais recentes), os deste navegador e a prévia atual, sem duplicar pontos. Não representa medição química, confirmação de fonte ou previsão por IA. Sem dados, não há manchas demonstrativas.</p>`;
    if(options.readOnly){host.classList.add('is-read-only');host.querySelector('.pin-help').textContent='Arraste, amplie e toque nos pontos para consultar os relatos. Este mapa é apenas de leitura.';}
    if(options.methodText)host.querySelector('.pin-method').textContent=options.methodText;
    element.replaceChildren(host);const find=s=>host.querySelector(s),viewport=find('.pin-viewport'),base=find('.pin-vector'),canvas=find('.pin-heat'),marker=find('.pin-marker'),popup=find('.pin-popup'),error=find('.pin-error'),status=find('.pin-map-status');
    const latInput=find('[data-coordinate="lat"]'),lonInput=find('[data-coordinate="lon"]');
    const initial=valid(options.initialCenter)?options.initialCenter:HOME;
    let zoom=valid(options.initialCenter)?16.5:12,center={...initial},location=null,map=null,destroyed=false,frame=0,width=0,height=0,activePopup=null,cartographyError=false;
    const buttons=new Map();let allRecords=[];
    const date=iso=>{try{return new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'}).format(new Date(iso))+' · Horário de Brasília';}catch{return 'Horário não informado';}};
    function records(){return (options.getRecords?.()||[]).filter(r=>valid(r.location)&&Number.isInteger(r.intensity)&&r.intensity>=1&&r.intensity<=5);}
    function project(p){if(map)return map.project([p.longitude,p.latitude]);const q=xy(p,zoom),c=xy(center,zoom);return {x:q.x-c.x+width/2,y:q.y-c.y+height/2};}
    function camera(){if(map){const c=map.getCenter();center={latitude:c.lat,longitude:c.lng};zoom=map.getZoom();}return {center,zoom};}
    function closePopup(){popup.hidden=true;activePopup=null;marker.setAttribute('aria-expanded','false');}
    function fillPopup(){
      if(!activePopup)return;const r=activePopup.record;
      const rows=r?[['Intensidade',`${r.intensity}/5 — ${options.getLevels?.()[r.intensity-1]?.name||''}`],['Percepção',(r.categories||[]).map(id=>options.categoryLabel?.(id)||id).join(', ')||'Não informada'],['Quando',date(r.occurrence?.occurredAt||r.recordedAt)],['Registro','Percepção relatada · não confirmada']]:options.getSummary?.()||[];
      find('.pin-caption').textContent=r?(r.public?'RELATO COLETIVO / NESTE PONTO':'RELATO LOCAL / NESTE PONTO'):'PRÉVIA / PINO ATUAL';
      popup.querySelector('dl').replaceChildren(...rows.map(([key,value])=>{const d=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=key;dd.textContent=String(value??'—');d.append(dt,dd);return d;}));
      const photo=r?null:options.getPhotoURL?.(),img=popup.querySelector('img');img.hidden=!photo;if(photo)img.src=photo;else img.removeAttribute('src');
    }
    function positionPopup(){if(popup.hidden||!activePopup)return;const p=project(activePopup.record?.location||location);const w=popup.offsetWidth,h=popup.offsetHeight;popup.style.left=`${clamp(p.x-w/2,12,Math.max(12,width-w-12))}px`;popup.style.top=`${clamp(p.y-h-58,10,Math.max(10,height-h-10))}px`;}
    function showPopup(record=null){activePopup={record};fillPopup();popup.hidden=false;marker.setAttribute('aria-expanded',String(!record));positionPopup();}
    function updateCoordinates(){find('.pin-coordinates').textContent=location?`Lat: ${location.latitude.toFixed(5)} · Long: ${location.longitude.toFixed(5)} · ${location.source==='device-gps'?'GPS':'pin manual'}`:'Nenhum pin confirmado.';latInput.value=location?.latitude.toFixed(6)||'';lonInput.value=location?.longitude.toFixed(6)||'';}
    function place(latitude,longitude,source='manual-map'){
      if(options.readOnly)return;
      location={latitude,longitude,source,isGeographic:true,accuracyMeters:null,capturedAt:new Date().toISOString()};updateCoordinates();closePopup();options.onChange?.({...location});status.textContent='Local marcado. Toque no pin para conferir seu relato.';queue();
    }
    function paint(){
      frame=0;if(destroyed||!host.isConnected||!host.getClientRects().length)return;
      const rect=viewport.getBoundingClientRect();width=rect.width;height=rect.height;if(!width||!height)return;camera();
      const gpsPending=!!options.getGpsPending?.()&&!valid(options.getGpsLocation?.());host.classList.toggle('pin-gps-pending',gpsPending);find('.pin-gps-wait').hidden=!gpsPending;
      find('[data-pin-action="place"]').disabled=gpsPending;
      const points=[];allRecords=records();const ids=new Set();
      for(const r of allRecords){
        const id=String(r.id);ids.add(id);let b=buttons.get(id);
        if(!b){b=document.createElement('button');b.type='button';b.className='pin-saved-marker';b.addEventListener('click',e=>{e.stopPropagation();const current=allRecords.find(p=>String(p.id)===id);if(current)showPopup(current);});find('.pin-record-points').append(b);buttons.set(id,b);}
        b.setAttribute('aria-label',`Relato de intensidade ${r.intensity}, ${date(r.occurrence?.occurredAt||r.recordedAt)}`);b.style.setProperty('--record-color',OdorHeat.colors[r.intensity-1]);b.dataset.recordId=id;
        const p=project(r.location);b.style.left=`${p.x}px`;b.style.top=`${p.y}px`;b.hidden=p.x< -20||p.y< -20||p.x>width+20||p.y>height+20;
        points.push({...p,intensity:r.intensity});
      }
      for(const [id,b]of buttons)if(!ids.has(id)){b.remove();buttons.delete(id);if(activePopup?.record&&String(activePopup.record.id)===id)closePopup();}
      const preview=options.getPreview?.();if(valid(preview?.location)&&preview.intensity>=1&&preview.intensity<=5)points.push({...project(preview.location),intensity:preview.intensity});
      marker.hidden=!location;if(location){const p=project(location);marker.style.left=`${p.x}px`;marker.style.top=`${p.y}px`;marker.hidden=p.x< -25||p.y<0||p.x>width+25||p.y>height+55;marker.style.color=OdorHeat.colors[(preview?.intensity||1)-1];}
      const heat=OdorHeat.render(canvas,width,height,points,78271.51696*Math.cos(center.latitude*Math.PI/180)/2**zoom);
      host.dataset.heatPoints=String(heat.points);host.dataset.maxDensity=String(heat.maxDensity);host.dataset.zoom=zoom.toFixed(2);host.dataset.centerLat=center.latitude.toFixed(6);host.dataset.centerLon=center.longitude.toFixed(6);
      find('.pin-heat-status').textContent=`${allRecords.length} ${allRecords.length===1?'relato':'relatos'}${preview?.location?' · prévia do pino incluída':''}${points.length?'':' · sem pontos geográficos para exibir'} · ${options.getMapStatus?.()||''}`;
      find('[data-pin-action="plus"]').disabled=zoom>=19;find('[data-pin-action="minus"]').disabled=zoom<=10;positionPopup();
    }
    function queue(){if(!frame&&!destroyed)frame=requestAnimationFrame(paint);}
    function fly(p,z=16.5){if(!valid(p))return false;center={latitude:p.latitude,longitude:p.longitude};zoom=z;if(map)map.jumpTo({center:[center.longitude,center.latitude],zoom});queue();return true;}
    function changeZoom(delta){if(map)map.zoomTo(clamp(map.getZoom()+delta,10,19),{duration:180});else{zoom=clamp(zoom+delta,10,19);queue();}}
    function fallback(message){base.classList.add('pin-vector-fallback');error.textContent=message;error.hidden=false;queue();}
    try{
      if(!window.maplibregl)throw new Error('MapLibre unavailable');
      map=new maplibregl.Map({container:base,style:style(),center:[center.longitude,center.latitude],zoom,minZoom:10,maxZoom:19,attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false,scrollZoom:true,touchZoomRotate:true,cooperativeGestures:false,renderWorldCopies:false,canvasContextAttributes:{preserveDrawingBuffer:true}});
      map.touchZoomRotate.disableRotation();
      map.on('styleimagemissing',event=>{if(event.id==='odor-map-building-hatch'&&!map.hasImage(event.id))map.addImage(event.id,hatch());});
      map.on('load',()=>{if(destroyed)return;if(!map.hasImage('odor-map-building-hatch'))map.addImage('odor-map-building-hatch',hatch());host.dataset.cartography=cartographyError?'unavailable':'loaded';error.hidden=!cartographyError;queue();});
      map.on('error',event=>{cartographyError=true;host.dataset.cartography='unavailable';host.dataset.mapError=event.error?.message||'Cartografia indisponível';error.textContent=options.readOnly?'Cartografia indisponível ou incompleta. As contagens e os gráficos continuam disponíveis; confira sua conexão.':'Cartografia indisponível ou incompleta. Confira a conexão; você pode informar coordenadas conhecidas abaixo.';error.hidden=false;});
      map.on('idle',()=>{if(!cartographyError)return;try{if(map.querySourceFeatures('openmaptiles',{sourceLayer:'transportation'}).length){cartographyError=false;error.hidden=true;host.dataset.cartography='loaded';}}catch{/* Keep the fallback guidance until real cartography returns. */}});
      map.on('move',queue);map.on('resize',queue);map.on('click',e=>{if(!destroyed)place(e.lngLat.lat,e.lngLat.lng);});
    }catch{map?.remove();map=null;fallback(options.readOnly?'Cartografia indisponível neste navegador. Consulte os gráficos e a tabela de contagens.':'Cartografia indisponível neste navegador. Informe coordenadas conhecidas abaixo. A mira mantém a localização de referência.');}
    marker.addEventListener('click',e=>{e.stopPropagation();if(location)showPopup();});find('.pin-popup-close').addEventListener('click',closePopup);popup.addEventListener('pointerdown',e=>e.stopPropagation());popup.querySelector('img').addEventListener('load',positionPopup);
    host.querySelectorAll('[data-pin-action]').forEach(b=>b.addEventListener('click',()=>{
      const action=b.dataset.pinAction;if(action==='plus')changeZoom(1);if(action==='minus')changeZoom(-1);
      if(action==='home'){const gps=options.getGpsLocation?.();fly(valid(gps)?gps:HOME,valid(gps)?16.5:12);closePopup();status.textContent=valid(gps)?'Mapa centralizado na sua localização. Seu pin foi preservado.':'Visão geral de Santa Maria. Seu pin foi preservado.';}
      if(action==='place'){camera();place(center.latitude,center.longitude);}
      if(action==='coordinates'){const p={latitude:latInput.valueAsNumber,longitude:lonInput.valueAsNumber};if(!valid(p)){status.textContent='Informe latitude entre −85 e 85 e longitude entre −180 e 180.';latInput.focus();return;}fly(p);place(p.latitude,p.longitude,'manual-coordinates');}
    }));
    viewport.addEventListener('keydown',e=>{if(e.target.closest('button,input,.pin-popup'))return;if(e.key==='Enter'){e.preventDefault();camera();place(center.latitude,center.longitude);}if(e.key==='Escape')closePopup();});
    [latInput,lonInput].forEach(i=>i.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();find('[data-pin-action="coordinates"]').click();}}));
    const resize=new ResizeObserver(()=>{if(host.getClientRects().length)map?.resize();queue();});resize.observe(viewport);
    const online=()=>{if(!map)return;map.triggerRepaint();queue();};window.addEventListener('online',online);
    queue();
    return {refresh(){if(destroyed)return;if(host.getClientRects().length)map?.resize();if(activePopup?.record&&!records().some(r=>r.id===activePopup.record.id))closePopup();if(activePopup)fillPopup();queue();},
      setLocation(value){if(value&&!valid(value))return false;location=value?{...value}:null;updateCoordinates();closePopup();queue();return true;},
      centerOn(value){return fly(value);},getLocation(){return location?{...location}:null;},
      destroy(){destroyed=true;cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('online',online);map?.remove();buttons.clear();host.remove();}
    };
  }
  window.WaindPin=Object.freeze({mount,style});
})();
