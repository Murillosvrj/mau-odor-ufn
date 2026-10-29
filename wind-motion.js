/* Every route shares one left-to-right current. Live form controls never move. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)';
  let active = null;
  const disabled = () => reduced.matches || root.classList.contains('motion-paused') || document.hidden;
  const gust = document.createElement('div');
  gust.id = 'wind-gust-overlay'; gust.hidden = true; gust.setAttribute('aria-hidden', 'true');
  gust.innerHTML = `<svg viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" stroke="currentColor" stroke-linecap="round">
    <g class="gust-lines">${Array.from({length:7}, (_, i) => {
      const y = 100 + i * 105;
      return `<path pathLength="1" d="M-180 ${y}C160 ${y-65} 330 ${y+75} 590 ${y}S1010 ${y-65} 1620 ${y+12}"/>`;
    }).join('')}</g>
    <g class="gust-curls"><path pathLength="1" d="M-100 280C180 200 420 365 670 260C790 210 810 135 742 148C690 160 728 228 770 198C800 177 788 164 778 172M550 625C780 700 920 525 1110 565C1200 586 1210 515 1160 520C1125 525 1140 570 1165 550"/></g>
    <g class="gust-dust" fill="currentColor" stroke="none">${Array.from({length:15}, (_, i) => `<circle cx="${40+i*96}" cy="${65+(i*137)%780}" r="${i%3===0?1.6:.85}"/>`).join('')}</g></svg>`;
  document.body.append(gust);
  // An inert snapshot in a shadow tree preserves selector context without duplicate
  // document IDs, interactive inputs, focus changes or another live map.
  const exit = document.createElement('div');
  exit.className = 'wind-exit-snapshot'; exit.hidden = true; exit.inert = true; exit.setAttribute('aria-hidden', 'true');
  const shadow = exit.attachShadow({mode:'closed'});
  document.querySelectorAll('head style, head link[rel="stylesheet"]').forEach(style => shadow.append(style.cloneNode(true)));
  const reset = document.createElement('style');
  reset.textContent = ':host{pointer-events:none!important}*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.wind-snapshot-content{margin:0!important}';
  shadow.append(reset);
  const scene = document.createElement('div'); shadow.append(scene); document.body.append(exit);
  const itemSelector = [
    '.splash-edition','.splash-emblem','.splash-screen > .eyebrow:not(.splash-edition)','.splash-invitation','.splash-note',
    '.hero-copy > *','.hero-visual','.context-cell','.intro-research','.identity-grid > div','.permission-card','.consent-line',
    '.screen-heading','.screening-art','.choice-card','.section-heading','.intensity-option','.intensity-reading',
    '.odor-card','.other-field','.selection-count','.photo-area','.invisible-odor','.form-section > .footnote',
    '.context-tags .tag','.observation-heading','textarea','#pin-map','#location-panel > .review-button',
    '#review-panel > .eyebrow','#review-panel > h2','#review-panel > p','.review-details > div','#review-photo','.dialog-actions','.edit-links','.success-panel > *'
  ].join(',');
  function items(view) {
    if (!view) return [];
    const all = [...view.querySelectorAll(itemSelector)].filter(el => {
      const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight + 60;
    });
    const blocks = all.filter(el => !all.some(parent => parent !== el && parent.contains(el)));
    blocks.sort((a,b)=>{const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();return Math.abs(x.top-y.top)>12?x.top-y.top:x.left-y.left;});
    return blocks.length ? blocks : [view];
  }
  function snapshot(view) {
    const rect = view.getBoundingClientRect(), copy = view.cloneNode(true);
    copy.classList.add('wind-snapshot-content'); copy.hidden = false;
    const originals = view.querySelectorAll('input, textarea, select, canvas');
    copy.querySelectorAll('input, textarea, select, canvas').forEach((el, i) => {
      const source = originals[i];
      if (el instanceof HTMLCanvasElement) {
        el.width = source.width; el.height = source.height;
        if (source.width && source.height) el.getContext('2d')?.drawImage(source, 0, 0);
      } else if (el.type !== 'file') {el.value = source.value; if ('checked' in el) el.checked = source.checked;}
    });
    const wrap = document.createElement('div');
    if (!copy.matches('.wizard-screen, .splash-screen')) wrap.className = 'wizard-screen';
    wrap.append(copy); scene.replaceChildren(wrap);
    exit.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;--intensity-color:${getComputedStyle(root).getPropertyValue('--intensity-color') || '#111'};`;
    exit.hidden = false;
    return items(copy);
  }
  function finish() {
    if (!active) return;
    const previous = active; active = null;
    previous.animations.forEach(animation => animation.cancel());
    exit.hidden = true; gust.hidden = true; scene.replaceChildren();
    previous.from?.classList.remove('wind-leave-right'); previous.to?.classList.remove('wind-enter-from-left');
    root.classList.remove('wind-transitioning'); previous.resolve();
    window.dispatchEvent(new Event('waind:screen-settled'));
  }
  function run(from, change, next) {
    if (active) return Promise.resolve(false);
    if (disabled() || !from || !from.getClientRects().length || typeof from.animate !== 'function') {
      change(); window.dispatchEvent(new Event('waind:screen-settled')); return Promise.resolve(true);
    }
    const outgoing = snapshot(from);
    from.classList.add('wind-leave-right'); root.classList.add('wind-transitioning');
    const animations = []; let resolve;
    const complete = new Promise(done => {resolve = done;});
    active = {from,to:null,animations,resolve};
    try {
      change(); const to = next(); active.to = to; to?.classList.add('wind-enter-from-left');
      animations.push(exit.animate([{opacity:1},{opacity:0}],{duration:370,easing:ease,fill:'both'}));
      outgoing.forEach((el, i) => animations.push(el.animate([
        {opacity:1,transform:'translateX(0) skewX(0)',filter:'blur(0)'},
        {opacity:0,transform:'translateX(90px) skewX(-3deg)',filter:'blur(3px)'}
      ], {duration:290,delay:Math.min(i,4)*22,easing:ease,fill:'both'})));
      items(to).forEach((el, i) => animations.push(el.animate([
        {opacity:0,transform:'translateX(-85px) skewX(3deg)',filter:'blur(2px)'},
        {opacity:1,transform:'translateX(0) skewX(0)',filter:'blur(0)'}
      ], {duration:400,delay:60+Math.min(i,5)*45,easing:ease,fill:'both'})));
      if (from.id === 'splash') document.querySelectorAll('.app-header, .wizard-nav').forEach(el => animations.push(el.animate([
        {opacity:0,transform:'translateX(-30px)'},{opacity:1,transform:'translateX(0)'}
      ], {duration:420,delay:130,easing:ease,fill:'both'})));
      gust.hidden = false;
      animations.push(gust.animate([{opacity:0},{opacity:.33,offset:.3},{opacity:.2,offset:.6},{opacity:0}], {duration:720,fill:'both'}));
      gust.querySelectorAll('path').forEach((path, i) => animations.push(path.animate([
        {strokeDashoffset:1},{strokeDashoffset:-1}
      ], {duration:650,delay:(i%4)*20,easing:ease,fill:'both'})));
      animations.push(gust.querySelector('.gust-dust').animate([
        {opacity:0,transform:'translateX(-100px)'},{opacity:.8,offset:.3},{opacity:0,transform:'translateX(230px)'}
      ], {duration:700,easing:ease,fill:'both'}));
      window.dispatchEvent(new CustomEvent('waind:gust',{detail:{duration:800}}));
      Promise.allSettled(animations.map(a => a.finished)).then(() => {if (active?.animations === animations) finish();});
    } catch (error) {finish(); throw error;}
    return complete;
  }
  window.addEventListener('waind:motion', () => {if (disabled()) finish();});
  document.addEventListener('visibilitychange', () => {if (document.hidden) finish();});
  reduced.addEventListener('change', () => {if (reduced.matches) finish();});
  window.WaindMotion = Object.freeze({run,finish,get busy(){return !!active;}});
})();
