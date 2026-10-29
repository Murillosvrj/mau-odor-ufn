(() => {
  'use strict';
  // An original engraved wind emblem, kept as vector markup at every size.
  function mark() {
    let ribbons = '', rising = '', ticks = '';
    for (let i=0;i<9;i++) {
      ribbons += `<path d="M${49+i*2} ${183+i*2}C${115+i*2} ${132+i} ${168+i} ${208-i} ${211+i*2} ${151-i}C${245+i} ${105-i*2} ${212+i} ${75-i} ${185+i} ${102-i}C${167+i} ${123-i} ${197+i} ${145-i} ${210+i} ${123-i}"/>`;
      rising += `<path d="M${202+i*2} ${192-i*2}C${266+i} ${193-i*2} ${264+i} ${146-i*2} ${319+i} ${151-i*2}C${371+i} ${157-i*2} ${386+i} ${109-i*2} ${354+i} ${94-i}C${324+i} ${80-i} ${314+i} ${114-i} ${336+i} ${120-i}C${349+i} ${124-i} ${355+i} ${109-i} ${344+i} ${105-i}"/>`;
    }
    for (let i=0;i<40;i++) {
      const a=i*Math.PI/20, inner=i%5===0?41:45;
      ticks += `<path d="M${240+Math.cos(a)*inner} ${75+Math.sin(a)*inner}L${240+Math.cos(a)*49} ${75+Math.sin(a)*49}"/>`;
    }
    const markup = `<span class="brand-plate" aria-hidden="true"><svg class="waind-emblem" viewBox="0 0 480 225" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g class="brand-diagram" stroke-width=".65"><circle cx="240" cy="75" r="55" stroke-dasharray="2 5"/><circle cx="240" cy="75" r="37"/>${ticks}<path d="M240 8v132M174 75h132" stroke-dasharray="3 6"/><path d="m240 46 7 29-7 28-7-28Z"/><path d="M240 46v57M233 75h14"/><circle cx="240" cy="75" r="3"/></g><g class="brand-ribbons" stroke-width=".95">${ribbons}${rising}</g><g stroke-width=".9"><path d="M116 84c-14 8-18-12-6-15 10-3 12 11 4 11M375 54c-13 3-15-15-3-16 8-1 12 10 4 11M400 157c14-7 18 14 6 15-8 1-10-10-3-11M71 143c-9 4-12-9-4-11 6-2 10 5 4 7"/><path d="M47 211h72m12 0h25m173 0h54m13 0h38"/></g><g fill="currentColor" stroke="none"><circle cx="148" cy="50" r="1"/><circle cx="153" cy="57" r=".8"/><circle cx="144" cy="59" r=".7"/><circle cx="301" cy="28" r="1"/><circle cx="307" cy="36" r=".7"/><circle cx="298" cy="36" r=".8"/><circle cx="409" cy="113" r=".8"/><circle cx="415" cy="120" r="1"/></g></svg><span class="waind-logotype">${[..."WAIND"].map((char,i)=>`<span class="brand-char${i===1||i===2?" brand-char-ai":""}" style="--char-i:${i}"><span class="brand-glyph">${char}</span></span>`).join('')}<span class="brand-ai-line"></span></span><span class="brand-definition">ARTIFICIAL INTELLIGENCE + WIND</span></span>`;
    return markup;
  }
  function mount(button) {
    button.innerHTML = mark();
    const svg = button.querySelector('svg');
    const dotGroup = svg.querySelector('g[fill="currentColor"]');
    dotGroup?.classList.add('brand-dots');
    svg.querySelectorAll('.brand-ribbons,.brand-diagram,.brand-dots').forEach(layer => {
      const wrapper = document.createElementNS('http://www.w3.org/2000/svg','g');
      wrapper.setAttribute('class','brand-parallax '+(layer.classList.contains('brand-diagram')?'brand-depth-back':'brand-depth-front'));
      layer.before(wrapper); wrapper.append(layer);
    });
    svg.querySelectorAll('.brand-ribbons path,.brand-diagram path,.brand-diagram circle').forEach((line,i) => {
      line.setAttribute('pathLength','1'); line.classList.add('brand-draw');
      line.style.setProperty('--draw-i', i%9);
    });
    button.closest('#splash').classList.add('wind-boot');
    let frame = 0, x = 0, y = 0;
    const paused = () => document.documentElement.classList.contains('motion-paused') || matchMedia('(prefers-reduced-motion: reduce)').matches;
    function paint() {frame=0;button.style.setProperty('--wind-x',paused()?0:x);button.style.setProperty('--wind-y',paused()?0:y);}
    button.addEventListener('pointermove', event => {
      if (event.pointerType==='touch' || paused()) return;
      const r=button.getBoundingClientRect(); x=((event.clientX-r.left)/r.width-.5)*10; y=((event.clientY-r.top)/r.height-.5)*7;
      if(!frame) frame=requestAnimationFrame(paint);
    });
    const reset=()=>{cancelAnimationFrame(frame);frame=0;x=0;y=0;paint();};
    button.addEventListener('pointerleave',reset);
    window.addEventListener('waind:motion',reset);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
  }
  window.WaindBrand = Object.freeze({mark,mount});
})();
