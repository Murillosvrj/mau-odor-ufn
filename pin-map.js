/* WAIND: seleção geográfica real. Tiles OSM somente para a área visível.
   API: mount(element,{onChange,getSummary,getPhotoURL}) → refresh/setLocation/getLocation/destroy.
   setLocation é silencioso, preserva a precisão do GPS. O pin manual não tem precisão medida. */
(() => {
  'use strict';
  let serial = 0;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const radians = Math.PI / 180;
  const home = {latitude:-29.6838, longitude:-53.8105};
  function project(latitude, longitude, zoom) {
    const size = 256 * 2 ** zoom, sin = Math.sin(clamp(latitude,-85.05112878,85.05112878) * radians);
    return {x:(longitude + 180) / 360 * size, y:(.5 - Math.log((1 + sin)/(1 - sin)) / (4 * Math.PI)) * size};
  }
  function unproject(x, y, zoom) {
    const size = 256 * 2 ** zoom;
    return {latitude:Math.atan(Math.sinh(Math.PI * (1 - 2 * clamp(y,0,size)/size))) / radians,
      longitude:((x / size * 360) % 360 + 360) % 360 - 180};
  }
  function mount(element, options = {}) {
    if (typeof element === 'string') element = document.querySelector(element);
    if (!element) throw new Error('WAIND: elemento do mapa não encontrado.');
    const uid = `waind-pin-${++serial}`;
    const host = document.createElement('section'); host.className = 'waind-pin';
    host.setAttribute('aria-label','Escolher o local da ocorrência no mapa');
    host.innerHTML = `<div class="pin-heading"><strong>Um ponto no território.</strong><span>ENTORNO DA UFN<br>SANTA MARIA / RS</span></div>
      <div class="pin-viewport" role="region" tabindex="0" aria-label="Mapa geográfico para posicionar o pin" aria-describedby="${uid}-help">
        <div class="pin-base pin-tiles" aria-hidden="true"></div>
        <div class="pin-crosshair" aria-hidden="true"></div>
        <div class="pin-north" aria-hidden="true"><svg viewBox="0 0 38 55"><circle cx="19" cy="30" r="15" stroke-dasharray="2 3"/><circle cx="19" cy="30" r="11"/><path d="M19 13v34M2 30h34M19 16l4 14h-8z"/><path d="M19 16v14h4z" fill="#49443c"/><text x="19" y="8" text-anchor="middle">N</text></svg></div>
        <div class="pin-controls" aria-label="Controles do mapa"><button type="button" data-pin-action="plus" aria-label="Ampliar mapa">+</button><button type="button" data-pin-action="minus" aria-label="Reduzir mapa">−</button><button type="button" data-pin-action="home" aria-label="Voltar à área da UFN">⌂</button></div>
        <button type="button" class="pin-marker" aria-label="Abrir resumo no pin da ocorrência" aria-expanded="false" aria-controls="${uid}-popup" hidden><svg viewBox="0 0 48 55" aria-hidden="true"><ellipse class="pin-ring" cx="24" cy="49" rx="16" ry="4"/><path d="M24 49C19 40 9 31 9 21a15 15 0 0 1 30 0c0 10-10 19-15 28Z" fill="#fff" stroke="currentColor" stroke-width="1.6"/><path d="M13 22c1 8 7 16 11 23M16 23c1 6 5 13 8 18M19 24c1 5 3 9 5 13" fill="none" stroke="currentColor" stroke-width=".65"/><circle cx="24" cy="20" r="5" fill="currentColor"/><circle cx="24" cy="20" r="9" fill="none" stroke="currentColor" stroke-width=".6"/></svg></button>
        <aside class="pin-popup" id="${uid}-popup" aria-label="Resumo da ocorrência neste pin" hidden><button type="button" class="pin-popup-close" aria-label="Fechar resumo do pin">×</button><p class="pin-caption">SEU RELATO / NESTE PONTO</p><h3>O que você percebeu.</h3><dl></dl><img alt="Foto selecionada para esta ocorrência" hidden></aside>
        <p class="pin-error" hidden></p>
        <div class="pin-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors</div>
      </div>
      <div class="pin-actions"><button type="button" class="button button-ink" data-pin-action="place">Marcar no centro da mira</button><span class="pin-coordinates">Nenhum pin confirmado.</span></div>
      <p class="pin-help" id="${uid}-help">Toque no mapa para marcar. Arraste para mover; use + e − para ampliar. Com o mapa em foco, use as setas e Enter para marcar na mira. Toque no pin para ler seu resumo.</p>
      <details class="pin-coordinate-entry"><summary>Informar coordenadas manualmente</summary><p>Use coordenadas conhecidas do local, inclusive quando o mapa estiver indisponível.</p><div><label for="${uid}-lat">Latitude<input id="${uid}-lat" type="number" step="any" min="-85" max="85" placeholder="−29.68380" inputmode="decimal"></label><label for="${uid}-lon">Longitude<input id="${uid}-lon" type="number" step="any" min="-180" max="180" placeholder="−53.81050" inputmode="decimal"></label></div><button class="button button-outline" type="button" data-pin-action="coordinates">Confirmar coordenadas</button></details>
      <p class="pin-map-status" role="status" aria-live="polite"></p>`;
    element.replaceChildren(host);
    const find = q => host.querySelector(q);
    const viewport=find('.pin-viewport'), tiles=find('.pin-tiles'), marker=find('.pin-marker'), popup=find('.pin-popup'), status=find('.pin-map-status'), error=find('.pin-error');
    const latitudeInput=find(`#${uid}-lat`), longitudeInput=find(`#${uid}-lon`);
    let zoom=16, center=project(home.latitude,home.longitude,zoom), width=0, height=0, location=null, drag=null, frame=0, destroyed=false;
    const tileCache=new Map();
    function visible() {return !destroyed && host.isConnected && host.getClientRects().length>0 && !document.hidden;}
    function tileHealth() {
      if(!visible())return;
      const shown=[...tiles.children];
      const loaded=shown.filter(img=>img.dataset.state==='loaded').length;
      const failed=shown.filter(img=>img.dataset.state==='error').length;
      error.hidden = failed===0 || loaded===shown.length;
      error.textContent = loaded ? 'Parte do mapa não carregou. Confira o local antes de marcar.' : 'Mapa indisponível. Verifique a conexão ou informe coordenadas conhecidas abaixo.';
    }
    function updateTiles(load=true) {
      const left=center.x-width/2, top=center.y-height/2, n=2**zoom, required=new Set();
      for(let tx=Math.floor(left/256);tx<=Math.floor((left+width)/256);tx++)for(let ty=Math.floor(top/256);ty<=Math.floor((top+height)/256);ty++){
        if(ty<0||ty>=n)continue;
        const x=(tx%n+n)%n, key=`${zoom}/${x}/${ty}`;required.add(key);
        let img=tileCache.get(key);
        if(!img && load){
          img=document.createElement('img');img.className='pin-tile';img.alt='';img.draggable=false;img.dataset.state='loading';img.decoding='async';
          img.addEventListener('load',()=>{img.dataset.state='loaded';tileHealth();});
          img.addEventListener('error',()=>{img.dataset.state='error';tileHealth();});
          // Browser cache defaults preserve the provider's HTTP caching directives.
          img.referrerPolicy='strict-origin-when-cross-origin';
          img.src=`https://tile.openstreetmap.org/${key}.png`;tileCache.set(key,img);
        }
        if(img){img.style.left=`${Math.round(tx*256-left)}px`;img.style.top=`${Math.round(ty*256-top)}px`;if(img.parentElement!==tiles)tiles.append(img);}
      }
      for(const [key,img] of tileCache){if(!required.has(key)&&img.parentElement===tiles)img.remove();}
      // Keep a modest in-memory tile set; normal HTTP caching handles revisits.
      if(tileCache.size>100)for(const [key] of tileCache){if(!required.has(key))tileCache.delete(key);if(tileCache.size<=70)break;}
      tileHealth();
    }
    function fillPopup() {
      const list=popup.querySelector('dl');list.replaceChildren();
      const rows=options.getSummary?.()||[];
      for(const [label,value] of rows){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=String(label??'');dd.textContent=String(value??'—');row.append(dt,dd);list.append(row);}
      const photo=options.getPhotoURL?.(),image=popup.querySelector('img');
      image.hidden=!photo;if(photo)image.src=photo;else image.removeAttribute('src');
    }
    function markerPosition() {
      if(!location){marker.hidden=true;popup.hidden=true;return;}
      const point=project(location.latitude,location.longitude,zoom), x=point.x-center.x+width/2, y=point.y-center.y+height/2;
      marker.hidden=x<-25||x>width+25||y<0||y>height+50;
      marker.style.left=`${x}px`;marker.style.top=`${y}px`;
      if(!popup.hidden){
        if(marker.hidden){closePopup();return;}
        const pw=popup.offsetWidth,ph=popup.offsetHeight, px=clamp(x-pw/2,12,Math.max(12,width-pw-12));
        const above=y-62-ph>=10,py=above?y-62-ph:clamp(y+12,10,Math.max(10,height-ph-10));
        popup.style.left=`${px}px`;popup.style.top=`${py}px`;popup.style.setProperty('--pin-tail',`${clamp(x-px,18,pw-18)}px`);popup.dataset.side=above?'above':'below';
      }
    }
    function render(load=true) {
      if(!visible())return;
      const rect=viewport.getBoundingClientRect();width=rect.width;height=rect.height;
      if(!width||!height)return;
      updateTiles(load);markerPosition();
      find('[data-pin-action="plus"]').disabled=zoom>=19;find('[data-pin-action="minus"]').disabled=zoom<=12;
    }
    function queueRender(load=true){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>render(load));}
    function closePopup(focus=false){popup.hidden=true;marker.setAttribute('aria-expanded','false');if(focus&&!marker.hidden)marker.focus({preventScroll:true});}
    function showPopup(){if(!location)return;fillPopup();popup.hidden=false;marker.setAttribute('aria-expanded','true');markerPosition();}
    function showCoordinates(){
      find('.pin-coordinates').textContent=location?`${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}${location.source==='device-gps'?' · GPS':' · pin manual'}`:'Nenhum pin confirmado.';
      if(location){latitudeInput.value=location.latitude.toFixed(6);longitudeInput.value=location.longitude.toFixed(6);}else{latitudeInput.value='';longitudeInput.value='';}
    }
    function selectAt(latitude,longitude,source='manual-map'){
      location={latitude,longitude,source,isGeographic:true,accuracyMeters:null,capturedAt:new Date().toISOString()};
      showCoordinates();closePopup();render();status.textContent='Local marcado. Toque no pin para conferir seu relato.';options.onChange?.({...location});
    }
    function atScreen(x,y){return unproject(center.x+x-width/2,center.y+y-height/2,zoom);}
    function placeCenter(){const p=unproject(center.x,center.y,zoom);selectAt(p.latitude,p.longitude);}
    function changeZoom(change){const next=clamp(zoom+change,12,19);if(next===zoom)return;const ratio=2**(next-zoom);center={x:center.x*ratio,y:center.y*ratio};zoom=next;render();status.textContent=`Ampliação ${zoom}.`;}
    viewport.addEventListener('pointerdown',event=>{
      if(event.target.closest('button,a,.pin-popup,.pin-controls')||event.button!==0||!event.isPrimary)return;
      drag={x:event.clientX,y:event.clientY,startX:center.x,startY:center.y,moved:false,pointerId:event.pointerId};
      viewport.setPointerCapture(event.pointerId);closePopup();
    });
    viewport.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(Math.hypot(dx,dy)>6)drag.moved=true;
      if(drag.moved){center={x:drag.startX-dx,y:clamp(drag.startY-dy,0,256*2**zoom)};viewport.classList.add('is-dragging');queueRender(false);}
    });
    viewport.addEventListener('pointerup',event=>{
      if(!drag||event.pointerId!==drag.pointerId)return;
      const moved=drag.moved;drag=null;viewport.classList.remove('is-dragging');
      if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
      cancelAnimationFrame(frame);
      if(!moved){const rect=viewport.getBoundingClientRect(),p=atScreen(event.clientX-rect.left,event.clientY-rect.top);selectAt(p.latitude,p.longitude);}else render();
    });
    viewport.addEventListener('pointercancel',()=>{drag=null;viewport.classList.remove('is-dragging');queueRender();});
    viewport.addEventListener('keydown',event=>{
      if(event.key==='Escape'){closePopup(true);return;}
      if(event.target!==viewport)return;
      const delta=event.shiftKey?140:40;
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','+','=','-'].includes(event.key))event.preventDefault();
      if(event.key==='Enter'){placeCenter();return;}
      if(event.key==='+'||event.key==='='){changeZoom(1);return;}if(event.key==='-'){changeZoom(-1);return;}
      if(event.key==='ArrowLeft')center.x-=delta;else if(event.key==='ArrowRight')center.x+=delta;else if(event.key==='ArrowUp')center.y-=delta;else if(event.key==='ArrowDown')center.y+=delta;else return;
      center.y=clamp(center.y,0,256*2**zoom);closePopup();render();status.textContent='Mira reposicionada. Pressione Enter para confirmar o pin.';
    });
    marker.addEventListener('click',()=>popup.hidden?showPopup():closePopup());
    popup.querySelector('img').addEventListener('load',()=>{if(!popup.hidden)markerPosition();});
    popup.querySelector('.pin-popup-close').addEventListener('click',()=>closePopup(true));
    [latitudeInput,longitudeInput].forEach(input=>input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();find('[data-pin-action="coordinates"]').click();}}));
    host.querySelectorAll('[data-pin-action]').forEach(button=>button.addEventListener('click',()=>{
      const action=button.dataset.pinAction;
      if(action==='plus')changeZoom(1);if(action==='minus')changeZoom(-1);
      if(action==='home'){zoom=16;center=project(home.latitude,home.longitude,zoom);closePopup();render();status.textContent='Mapa centralizado no entorno da UFN. Seu pin foi preservado.';}
      if(action==='place')placeCenter();
      if(action==='coordinates'){
        const lat=latitudeInput.valueAsNumber,lon=longitudeInput.valueAsNumber;
        if(!Number.isFinite(lat)||!Number.isFinite(lon)||lat< -85||lat>85||lon< -180||lon>180){status.textContent='Informe latitude entre −85 e 85 e longitude entre −180 e 180.';(!Number.isFinite(lat)||lat< -85||lat>85?latitudeInput:longitudeInput).focus();return;}
        center=project(lat,lon,zoom);selectAt(lat,lon,'manual-coordinates');
      }
    }));
    const resize=new ResizeObserver(()=>queueRender());resize.observe(viewport);
    const handleVisible=()=>{if(visible())queueRender();};document.addEventListener('visibilitychange',handleVisible);
    const handleOnline=()=>{for(const [key,img] of tileCache)if(img.dataset.state==='error'){img.remove();tileCache.delete(key);}queueRender();};window.addEventListener('online',handleOnline);
    render();
    return {
      refresh(){if(!popup.hidden)fillPopup();queueRender();},
      setLocation(value){
        if(!value){location=null;showCoordinates();closePopup();queueRender();return true;}
        if(!Number.isFinite(value.latitude)||!Number.isFinite(value.longitude)||Math.abs(value.latitude)>85.05112878||Math.abs(value.longitude)>180)return false;
        location={...value,isGeographic:true};center=project(value.latitude,value.longitude,zoom);showCoordinates();closePopup();queueRender();return true;
      },
      getLocation(){return location?{...location}:null;},
      destroy(){destroyed=true;cancelAnimationFrame(frame);resize.disconnect();document.removeEventListener('visibilitychange',handleVisible);window.removeEventListener('online',handleOnline);tileCache.clear();host.remove();}
    };
  }
  window.WaindPin={mount};
})();
