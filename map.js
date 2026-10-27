/* Atlas ilustrativo. Nenhuma coordenada cartográfica ou predição real é produzida aqui. */
(() => {
  'use strict';
  const colors=['#0D9488','#65A30D','#D97706','#EA580C','#DC2626'];
  const names=['Muito fraco','Fraco','Intermediário','Forte','Muito forte'];
  const points=[
    {id:'01',x:242,y:259,level:4,type:'Contentor de lixo',place:'Próximo à UFN · conjunto III'},
    {id:'02',x:296,y:254,level:3,type:'Resíduos',place:'Rua dos Andradas · posição ilustrativa'},
    {id:'03',x:332,y:285,level:5,type:'Esgoto',place:'Entorno da UFN · posição ilustrativa'},
    {id:'04',x:372,y:252,level:3,type:'Resíduos orgânicos',place:'Rua dos Andradas · posição ilustrativa'},
    {id:'05',x:562,y:386,level:2,type:'Valas a céu aberto',place:'Rua Silva Jardim · posição ilustrativa'},
    {id:'06',x:608,y:393,level:1,type:'Outros',place:'Rua Silva Jardim · posição ilustrativa'},
    {id:'07',x:659,y:361,level:2,type:'Resíduos',place:'Entorno da UFN · posição ilustrativa'},
    {id:'08',x:174,y:127,level:1,type:'Resíduos químicos',place:'Registro isolado · posição ilustrativa'}
  ];
  const sketchIcons={
    plus:'<path d="M8 2v12M2 8h12"/>',minus:'<path d="M2 8h12"/>',reset:'<path d="M3 5a5 5 0 1 1-.2 5M3 1v4h4"/>',expand:'<path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4"/>'
  };
  let host=null,localCount=0;
  function building(x,y,w,h){return `<rect class="map-building" x="${x}" y="${y}" width="${w}" height="${h}" rx="1"/><path d="M${x+3} ${y+3}h${w-6}v${h-6}h-${w-6}z" fill="none" stroke="#c9c0b3" stroke-width=".35"/>`;}
  function blocks(){
    let result='';
    const cols=[[-40,148],[182,143],[359,150],[543,144],[721,190]];
    const rows=[[-25,130],[141,91],[277,89],[409,94],[546,65]];
    cols.forEach(([x,w],ci)=>rows.forEach(([y,h],ri)=>{
      result+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" class="map-block-stroke"/>`;
      if((ci===2&&ri===1)||(ci===1&&ri===2)||(ci===4&&ri===3))return;
      const bw=(w-27)/3;
      for(let i=0;i<3;i++){
        result+=building(x+8+i*(bw+5),y+9,bw,h*.32);
        result+=building(x+8+i*(bw+5),y+h*.56,bw-3,h*.3);
      }
      result+=`<path d="M${x+7} ${y+h*.47}h${w-14}" fill="none" stroke="#ddd6ca" stroke-width=".5" stroke-dasharray="2 3"/>`;
    }));
    return result;
  }
  function contours(cx,cy,scale,levels,variant){
    let result='';
    const shape='M-113-13C-111-55-64-63-26-70C14-78 24-47 67-44C115-43 131-8 101 26C77 53 38 39 11 58C-18 77-69 64-73 34C-77 12-116 18-113-13Z';
    for(let i=0;i<levels.length;i++){
      const s=scale*(1-i*.17),col=colors[levels[i]-1];
      result+=`<path d="${shape}" transform="translate(${cx+i*(variant?6:2)},${cy-i*3}) rotate(${variant?-19:12}) scale(${s})" fill="${col}" fill-opacity="${i===0?'.045':'.055'}" stroke="${col}" stroke-width="${i===levels.length-1?'1.4':'.9'}" stroke-opacity=".75"/>`;
      result+=`<path d="${shape}" transform="translate(${cx+i*(variant?6:2)},${cy-i*3}) rotate(${variant?-19:12}) scale(${s*.94})" fill="none" stroke="${col}" stroke-width=".45" stroke-opacity=".25"/>`;
    }
    return result;
  }
  function citySvg(){
    return `<svg class="map-svg" viewBox="0 0 900 570" preserveAspectRatio="xMidYMid slice" tabindex="0" aria-label="Mapa esquemático do centro de Santa Maria. Oito relatos simulados podem ser inspecionados. Use os controles para ampliar e arraste para explorar." role="group" xmlns="http://www.w3.org/2000/svg">
      <title>Mapa esquemático do entorno da UFN, com oito relatos simulados</title>
      <defs>
        <pattern id="odor-map-building-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(-22)"><path d="M0 0v5" stroke="#b9b0a2" stroke-width=".45"/><rect width="5" height="5" fill="#c7bca8" opacity=".035"/></pattern>
        <pattern id="odor-map-campus-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(31)"><path d="M0 0v4" stroke="#888174" stroke-width=".5"/></pattern>
      </defs>
      <g class="map-world"><rect x="-1000" y="-1000" width="3000" height="2600" fill="#faf8f5"/>
        <g transform="rotate(-7 450 285)">
          ${blocks()}
          <g stroke="#dbd4c9" stroke-width=".6" fill="none">
            <path d="M-100 116H1000M-100 131H1000M-100 243H1000M-100 266H1000M-100 379H1000M-100 399H1000M-100 517H1000M-100 536H1000"/>
            <path d="M157-100V750M174-100V750M337-100V750M350-100V750M521-100V750M534-100V750M699-100V750M713-100V750"/>
          </g>
          <g class="map-street-label"><text x="326" y="126">R. VENÂNCIO AIRES</text><text x="91" y="258">R. DOS ANDRADAS</text><text x="494" y="258">R. DOS ANDRADAS</text><text x="190" y="393">R. SILVA JARDIM</text><text x="550" y="530">R. DR. BOZANO</text><text x="97" y="530">R. DR. BOZANO</text><text transform="translate(168 486) rotate(-90)">R. DUQUE DE CAXIAS</text><text transform="translate(347 192) rotate(-90)">R. CONDE DE PORTO ALEGRE</text><text transform="translate(531 498) rotate(-90)">R. SERAFIM VALANDRO</text></g>
          <g class="map-campus"><rect x="374" y="153" width="120" height="66" rx="2" fill="#eee9de" stroke="#6e675b" stroke-width=".8"/><rect x="382" y="162" width="104" height="49" fill="url(#odor-map-campus-hatch)" stroke="#aca18e" stroke-width=".5"/><rect x="392" y="170" width="84" height="33" fill="#faf8f5" stroke="#c6bbaa" stroke-width=".5"/><text x="434" y="184" text-anchor="middle" class="map-university-label">UFN</text><text x="434" y="196" text-anchor="middle" class="map-university-sub">CONJUNTO I</text></g>
          <g class="map-campus"><path d="M192 287h121v68H192z" fill="#eee9de" stroke="#6e675b" stroke-width=".8"/><path d="M199 294h107v53H199z" fill="url(#odor-map-campus-hatch)" stroke="#aca18e" stroke-width=".5"/><rect x="211" y="303" width="83" height="34" fill="#faf8f5" stroke="#c6bbaa" stroke-width=".5"/><text x="252" y="317" text-anchor="middle" class="map-university-label">UFN</text><text x="252" y="330" text-anchor="middle" class="map-university-sub">CONJUNTO III</text></g>
          <g fill="none" stroke="#b9b19f" stroke-width=".55"><path d="M736 423h159v66H736zM738 425l155 62M893 425l-155 62"/><ellipse cx="815" cy="456" rx="43" ry="24"/><ellipse cx="815" cy="456" rx="37" ry="19"/>${[744,764,786,845,867,886].map((x,i)=>`<circle cx="${x}" cy="${i%2?477:434}" r="5"/><circle cx="${x}" cy="${i%2?477:434}" r="3" stroke-dasharray="1 2"/>`).join('')}</g><rect x="760" y="442" width="112" height="27" fill="#faf8f5"/><text x="815" y="453" text-anchor="middle" class="map-university-sub">PRAÇA SALDANHA</text><text x="815" y="464" text-anchor="middle" class="map-university-sub">MARINHO</text>
          <g class="map-contours">${contours(306,268,1,[3,4,4,5],false)}${contours(619,380,.68,[1,1,2],true)}</g>
          <g class="map-reports">${points.map(p=>`<g class="map-point" tabindex="0" role="button" data-point="${p.id}" aria-label="Inspecionar relato simulado ${p.id}: ${p.type}, intensidade ${p.level}, ${names[p.level-1]}" transform="translate(${p.x} ${p.y})"><circle class="map-point-halo" r="10" fill="${colors[p.level-1]}" fill-opacity=".1"/><circle class="map-point-focus" r="13"/><circle class="map-point-center" r="4.5" fill="${colors[p.level-1]}"/></g>`).join('')}</g>
        </g>
      </g>
    </svg>`;
  }
  function mount(element){
    host=typeof element==='string'?document.querySelector(element):element;
    if(!host)return;
    localCount=0;
    host.innerHTML=`<section class="cartography-section" aria-labelledby="map-heading">
      <div class="map-section-top"><div><p class="map-kicker">05 / Uma leitura coletiva</p><h2 id="map-heading" class="map-section-title">O ar também conta<br><em>uma história.</em></h2></div><p class="map-section-description">Cada percepção ajuda a desenhar o que os olhos não veem. Explore as linhas, os lugares e os relatos de uma cidade compartilhada.</p></div>
      <div class="map-frame"><div class="map-toolbar"><p class="map-place">Entorno da UFN · Santa Maria, RS<span>ATLAS DE PERCEPÇÕES / EDIÇÃO EXPERIMENTAL</span></p><span class="map-demo-label">Mapa ilustrativo · dados simulados</span></div>
        <div class="map-stage">${citySvg()}
          <div class="map-engraving-signature">SANTA MARIA / RS<br>ESTUDO DE TERRITÓRIO Nº 01</div>
          <svg class="map-orientation" viewBox="0 0 44 55" aria-hidden="true"><circle cx="22" cy="29" r="16" fill="none" stroke="#797267" stroke-width=".6" stroke-dasharray="2 3"/><circle cx="22" cy="29" r="12" fill="none" stroke="#797267" stroke-width=".5"/><path d="M22 11v36M4 29h36M22 15l4 14h-8z" fill="none" stroke="#39352e" stroke-width=".7"/><path d="M22 15v14h4z" fill="#39352e"/><text x="22" y="7" text-anchor="middle" font-family="Georgia,serif" font-size="7" fill="#39352e">N*</text></svg>
          <div class="map-controls" aria-label="Controles do mapa">${[['plus','Aproximar'],['minus','Afastar'],['reset','Restaurar visão'],['expand','Tela inteira']].map(([action,label])=>`<button type="button" class="map-control" data-map-action="${action}" title="${label}" aria-label="${label}"><svg viewBox="0 0 16 16" aria-hidden="true">${sketchIcons[action]}</svg></button>`).join('')}</div>
          <div class="map-layer-panel"><p class="map-panel-title"><span>Camadas</span><span>02</span></p><button type="button" class="map-layer-button" data-layer="reports" aria-pressed="true"><span class="map-layer-check" aria-hidden="true">✓</span><span class="map-layer-label">Relatos simulados</span><span class="map-layer-count">08</span></button><button type="button" class="map-layer-button" data-layer="contours" aria-pressed="true"><span class="map-layer-check" aria-hidden="true">✓</span><span class="map-layer-label">Hipóteses · demonstração</span></button><label class="map-model-label">Visualizar cenário de modelo<select class="map-model-select" aria-label="Cenário ilustrativo do modelo"><option value="rf">Random Forest</option><option value="dt">Decision Tree</option></select></label><p class="map-model-note">Isolinhas desenhadas para demonstrar a interface. Nenhum modelo foi executado.</p></div>
          <div class="map-inspection-hint">Toque em um ponto<br>para ler sua percepção.<span>Arraste para explorar · + / − para zoom</span></div>
          <aside class="map-popup" hidden aria-label="Detalhes do relato simulado"><button type="button" class="map-popup-close" aria-label="Fechar detalhes">×</button><p class="map-popup-eyebrow"></p><h3 class="map-popup-title"></h3><div class="map-popup-intensity"></div><p class="map-popup-detail"></p><span class="map-popup-badge">Percepção · causa não comprovada</span></aside>
        </div>
        <div class="map-bottom"><div class="map-legend" aria-label="Legenda da intensidade"><span class="map-legend-label">INTENSIDADE</span>${names.map((n,i)=>`<span class="map-legend-item" title="${i+1}. ${n}"><i class="map-legend-dot" style="--level-color:${colors[i]}" aria-hidden="true"></i>${i+1}<span class="map-legend-word"> ${n}</span></span>`).join('')}</div><p class="map-cartographic-note">Traçado esquemático, sem precisão cartográfica.<br>*Orientação ilustrativa · sem escala geográfica.</p></div>
      </div>
      <p class="map-method-note"><strong>Percepção não é comprovação.</strong> As cores representam intensidades declaradas no cenário de exemplo. Uma hipótese de fonte exige investigação; relatos isolados permanecem como “isolado / não confirmado”.</p>
      <div class="map-local-summary" hidden></div><p class="map-live-status" role="status" aria-live="polite"></p>
    </section>`;
    // The map deliberately uses schematic positions, never user's GPS as display coordinates.
    const svg=host.querySelector('.map-svg'),world=host.querySelector('.map-world'),popup=host.querySelector('.map-popup'),frame=host.querySelector('.map-frame'),live=host.querySelector('.map-live-status');
    let zoom=1,panX=0,panY=0,drag=null,lastPoint=null;
    function transform(){world.setAttribute('transform',`translate(${450+panX} ${285+panY}) scale(${zoom}) translate(-450 -285)`);}
    function closePopup(focus=false){popup.hidden=true;host.querySelectorAll('.map-point.is-active').forEach(p=>p.classList.remove('is-active'));if(focus&&lastPoint)lastPoint.focus();}
    function showPoint(node){
      const p=points.find(item=>item.id===node.dataset.point);if(!p)return;
      host.querySelectorAll('.map-point.is-active').forEach(p=>p.classList.remove('is-active'));node.classList.add('is-active');lastPoint=node;
      popup.style.setProperty('--point-color',colors[p.level-1]);popup.querySelector('.map-popup-eyebrow').textContent=`RELATO ${p.id} / SIMULAÇÃO`;
      popup.querySelector('.map-popup-title').textContent=p.type;popup.querySelector('.map-popup-intensity').textContent=`${p.level} / 5 — ${names[p.level-1]}`;
      popup.querySelector('.map-popup-detail').textContent=p.place;popup.querySelector('.map-popup-badge').textContent=p.id==='08'?'Isolado / não confirmado':'Percepção · causa não comprovada';popup.hidden=false;
      live.textContent=`Relato simulado ${p.id}, ${p.type}, intensidade ${p.level}. ${p.id==='08'?'Isolado, não confirmado.':'Causa não comprovada.'}`;
    }
    host.querySelectorAll('.map-point').forEach(node=>{
      node.addEventListener('click',()=>showPoint(node));
      node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showPoint(node);}if(e.key==='Escape')closePopup();});
    });
    popup.querySelector('.map-popup-close').addEventListener('click',()=>closePopup(true));
    host.addEventListener('keydown',e=>{if(e.key==='Escape')closePopup(true);});
    host.querySelectorAll('[data-layer]').forEach(btn=>btn.addEventListener('click',()=>{
      const enabled=btn.getAttribute('aria-pressed')!=='true';btn.setAttribute('aria-pressed',String(enabled));host.querySelector(`.map-${btn.dataset.layer}`).classList.toggle('is-hidden',!enabled);
      if(btn.dataset.layer==='reports'&&!enabled)closePopup();if(btn.dataset.layer==='contours')host.querySelector('.map-model-select').disabled=!enabled;
    }));
    host.querySelector('.map-model-select').addEventListener('change',e=>{
      host.querySelector('.map-contours').innerHTML=e.target.value==='dt'?contours(325,275,.93,[3,4,5],true)+contours(600,377,.8,[1,2],false):contours(306,268,1,[3,4,4,5],false)+contours(619,380,.68,[1,1,2],true);
      live.textContent=`Cenário visual ${e.target.value==='dt'?'Decision Tree':'Random Forest'}. Demonstração sem execução de modelo.`;
    });
    host.querySelectorAll('[data-map-action]').forEach(btn=>btn.addEventListener('click',async()=>{
      const a=btn.dataset.mapAction;
      if(a==='plus')zoom=Math.min(3,zoom+.25);if(a==='minus')zoom=Math.max(.75,zoom-.25);if(a==='reset'){zoom=1;panX=0;panY=0;closePopup();}
      if(a==='expand'){
        try{if(document.fullscreenElement)await document.exitFullscreen();else if(frame.requestFullscreen)await frame.requestFullscreen();else live.textContent='Tela inteira não está disponível neste navegador.';}catch{live.textContent='O navegador não permitiu tela inteira. O mapa permanece disponível nesta página.';}
      }
      transform();if(a!=='expand')live.textContent=`Zoom ${Math.round(zoom*100)} por cento.`;
    }));
    svg.addEventListener('pointerdown',e=>{if(e.target.closest('.map-point'))return;drag={x:e.clientX,y:e.clientY,px:panX,py:panY};svg.setPointerCapture(e.pointerId);svg.classList.add('map-is-dragging');});
    svg.addEventListener('pointermove',e=>{if(!drag)return;const rect=svg.getBoundingClientRect(),scale=Math.min(900/rect.width,570/rect.height);panX=Math.max(-600,Math.min(600,drag.px+(e.clientX-drag.x)*scale));panY=Math.max(-400,Math.min(400,drag.py+(e.clientY-drag.y)*scale));transform();});
    function stopDrag(){drag=null;svg.classList.remove('map-is-dragging');}svg.addEventListener('pointerup',stopDrag);svg.addEventListener('pointercancel',stopDrag);
    host.addEventListener('keydown',e=>{if(e.target===svg&&(e.key==='+'||e.key==='-')){e.preventDefault();zoom=Math.max(.75,Math.min(3,zoom+(e.key==='+'?.25:-.25)));transform();}});
  }
  function addReport(){
    if(!host)return;localCount++;const el=host.querySelector('.map-local-summary');el.hidden=false;
    el.textContent=`${localCount} ${localCount===1?'relato salvo':'relatos salvos'} nesta sessão. O mapa acima continua demonstrativo; seus registros não foram posicionados neste traçado esquemático.`;
  }
  window.OdorMap={mount,addReport};
})();
