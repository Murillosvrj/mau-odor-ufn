/* Original vector artwork for the Mau Odor field notebook. No external assets. */
(function () {
  'use strict';
  const P = (d, extra = '') => `<path d="${d}" ${extra}/>`;
  const C = (x, y, r, extra = '') => `<circle cx="${x}" cy="${y}" r="${r}" ${extra}/>`;
  const fine = (content) => `<g class="etch-lines">${content}</g>`;
  const dots = (points) => `<g class="ink-dots">${points.map(([x,y,r]) => C(x,y,r || .65)).join('')}</g>`;
  const ground = () => fine(P('M27 111H133M41 115H62M98 115H120'));
  const spiral = (x = 0, y = 0, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${P('M0 34C-6 20 14 17 14 7C14-2 2-4 0 3C-3 12 10 13 9 6C9 3 5 2 4 5')}${fine(P('M-5 32C-10 19 6 16 8 13'))}</g>`;
  const drawings = {
    waste() {
      let hatches = '';
      for (let i = 0; i < 9; i++) {
        const x = 47 + i * 3.3;
        hatches += P(`M${x} ${70-i*2}C${x-9} ${87-i} ${x-3} 101 ${75+i*1.7} 104`);
      }
      for (let i=0;i<7;i++) hatches += P(`M${103+i*.9} ${68+i*4.1}Q${112+i*.3} ${79+i*3} ${104-i*.9} ${92+i*1.3}`);
      return `${ground()}<g class="bag-body">${P('M72 45C60 57 43 68 41 85C37 103 55 109 79 108C106 111 122 103 118 87C114 71 98 57 88 45Z','class="paper-fill"')}${fine(hatches)}${P('M61 62Q68 69 65 82M95 61Q90 71 96 85','class="secondary-line"')}${dots([[88,93],[92,98],[84,100],[100,94],[53,89]])}</g><g class="bag-tie">${P('M72 44C63 40 61 33 64 25C71 29 76 31 80 36C82 30 88 24 96 24C98 32 94 39 87 44M71 45Q81 40 90 45M72 48Q82 44 89 48','class="paper-fill"')}${fine(P('M67 30Q70 37 76 41M91 29Q88 36 84 40'))}${P('M77 47C64 46 59 49 62 53C66 57 73 49 79 47C88 47 100 45 100 50C100 55 90 53 82 48M79 49Q73 57 68 58M82 49Q85 55 92 56')}</g><g class="bag-air">${spiral(118,24,.62)}</g>`;
    },
    container() {
      let h = '';
      for(let i=0;i<6;i++) h += P(`M${53+i*5.5} 65L${56+i*5.2} 96`);
      return `${ground()}<g class="bin-vapor odor-flow">${spiral(70,7,.72)}${spiral(95,8,.55)}</g>${P('M43 53L50 99Q78 105 111 99L119 53Z','class="paper-fill"')}${fine(h)}${P('M98 63L96 94M105 63L102 94','class="secondary-line"')}${P('M50 58Q80 63 113 58','class="secondary-line"')}<g class="bin-lid">${P('M39 49Q78 42 123 48L122 55Q78 50 39 56Z','class="paper-fill"')}${P('M69 45V40Q80 37 91 40V45')}${fine(P('M46 50Q79 46 115 50'))}</g>${C(58,106,4,'class="paper-fill"')}${C(102,106,4,'class="paper-fill"')}${C(58,106,1)}${C(102,106,1)}${dots([[108,80],[107,86],[103,90]])}`;
    },
    sewer() {
      let grid = '';
      for(let i=0;i<7;i++) {
        const x=49+i*9;
        const rise=Math.abs(3-i)*1.4;
        grid+=P(`M${x} ${82+rise}L${x-7} ${101-rise}`);
      }
      return `${ground()}<g class="sewer-vapor odor-flow">${spiral(61,22,.87)}${spiral(86,8,1.12)}${spiral(113,30,.58)}</g>${P('M32 89C32 79 53 74 81 74C109 74 132 80 132 90L132 95C131 106 107 111 81 111C52 111 31 106 32 95Z','class="paper-fill"')}${P('M33 90C33 100 56 105 81 105C108 105 131 99 131 90M41 89C41 82 60 79 81 79C103 79 123 83 123 89C123 97 103 100 81 100C59 100 41 97 41 89')}${fine(grid+P('M46 88H120M45 93H118M39 98L39 103M45 101L45 106M52 103L52 108M59 105L59 109M66 106L66 110M74 107L74 111M88 107L88 111M96 106L96 110M104 105L104 109M113 102L113 107M121 99L121 104'))}`;
    },
    ditch() {
      let stones='';
      for(let i=0;i<6;i++) stones += P(`M${28+i*10} ${54+i*4}L${33+i*10} ${42+i*4}`);
      let current='';
      for(let i=0;i<6;i++) current+=P(`M${35+i*3} ${75+i*4}C${53+i*4} ${56+i*5} ${65+i*4} ${95+i*4} ${87+i*4} ${82+i*4}S${122+i*2} ${83+i*4} ${136-i*1.2} ${72+i*5}`);
      return `${P('M18 47L39 30L90 49L79 69Z','class="paper-fill"')}${P('M18 47L18 65L77 90L79 69M18 65L39 56L92 77M95 111L141 89L141 72L113 83','class="paper-fill"')}${fine(stones+P('M24 51V62M34 55V68M44 59V72M54 63V76M64 66V80M74 70V84'))}<g class="ditch-flow odor-flow">${fine(current)}</g>${P('M101 53C105 47 114 48 114 54C114 59 106 59 107 54','class="secondary-line"')}${dots([[89,64],[94,69],[86,70],[120,65],[125,61],[129,67]])}${P('M26 97L35 93M30 102L40 97M121 107L137 100','class="secondary-line"')}`;
    },
    organic() {
      let ribs='';
      for(let i=0;i<6;i++) ribs+=P(`M${58+i*3} ${76-i*3}Q${67+i*2} ${85-i*2} ${80+i*2} ${88-i*.3}`);
      let leaf='';
      for(let i=0;i<5;i++) leaf+=P(`M${93+i*4} ${67-i*3}L${92+i*4} ${58-i*3}M${95+i*4} ${65-i*3}L${103+i*4} ${66-i*3}`);
      return `${ground()}<g class="organic-vapor odor-flow">${spiral(39,28,.7)}${spiral(75,10,.7)}</g><g class="organic-body">${P('M50 80C44 58 55 47 68 52C75 55 78 55 86 52C103 45 112 65 104 82C98 98 84 105 72 101C60 100 53 93 50 80Z','class="paper-fill"')}${P('M76 55C77 43 83 38 88 37M77 52Q70 48 67 49')}${fine(ribs)}${P('M85 73C87 53 102 43 124 45C123 64 108 79 85 73Z','class="paper-fill"')}${P('M86 73Q107 55 120 48','class="secondary-line"')}${fine(leaf)}${P('M33 97C44 89 53 94 55 103C44 107 38 105 33 97Z','class="paper-fill"')}${fine(P('M36 98L50 102M38 96L42 101M42 95L47 102'))}${dots([[64,88],[67,93],[72,94],[57,81],[102,89],[106,94],[111,90]])}</g>`;
    },
    metabolic() {
      let h='';
      for(let i=0;i<6;i++) h+=P(`M${56+i*3} ${61-i*4}Q${48+i*2} ${83-i*2} ${66+i*3} ${94-i*.9}`);
      return `${ground()}<g class="drop-main">${P('M77 25C76 39 48 61 48 78C48 95 60 103 77 103C95 103 107 94 107 78C107 60 81 39 77 25Z','class="paper-fill"')}${fine(h)}${P('M88 68C95 74 97 81 92 87','class="secondary-line"')}</g><g class="drop-small">${P('M118 48C117 55 108 63 108 70C108 82 128 82 128 70C128 63 120 55 118 48Z','class="paper-fill"')}${fine(P('M115 62Q109 72 117 75'))}</g><g class="metabolic-ring">${P('M33 91C19 79 22 61 34 52M127 91C140 81 141 65 133 57','stroke-dasharray="2 4" stroke-width=".8"')}${C(34,49,1.5)}${C(132,54,1.5)}</g>${dots([[42,105],[38,101],[125,99],[120,104]])}`;
    },
    chemical() {
      let glass='';
      for(let i=0;i<5;i++) glass+=P(`M${49+i*3} ${86+i*1.5}Q${45+i*3} ${103-i*.2} ${65+i*4} ${104-i*.4}`);
      let waves='';
      for(let i=0;i<4;i++) waves+=P(`M${51-i} ${87+i*4}C68 ${79+i*4} 84 ${95+i*3} ${110+i} ${86+i*4}`);
      return `${ground()}${P('M69 27V59L43 94Q37 108 57 108H104Q123 108 117 95L91 59V27Z','class="paper-fill"')}${P('M66 25Q80 22 94 25V30Q80 33 66 30Z','class="paper-fill"')}${fine(P('M74 35V61L48 96M86 36V58M91 68L108 90')+glass)}<g class="chemical-liquid odor-flow">${fine(waves)}</g><g class="chemical-bubbles odor-flow">${C(67,86,3.6)}${C(89,75,2.6)}${C(78,64,1.8)}${C(84,49,1.3)}</g>${P('M99 43L107 35M102 48L113 46M95 39L98 31','class="secondary-line"')}${dots([[58,101],[64,98],[99,102],[104,99]])}`;
    },
    other() {
      let ticks='';
      for(let i=0;i<24;i++) {
        const a=i*Math.PI/12, r=i%3===0?37:40;
        ticks+=P(`M${80+Math.cos(a)*r} ${65+Math.sin(a)*r}L${80+Math.cos(a)*43} ${65+Math.sin(a)*43}`);
      }
      let h='';
      for(let i=0;i<7;i++) h+=P(`M${80+i*1.2} ${35+i*4}L${81+i*1.4} ${48+i*2.8}`);
      return `${C(80,65,45)}${C(80,65,33,'stroke-width=".75"')}${C(80,65,49,'stroke-width=".65" stroke-dasharray="1 5"')}${fine(ticks)}${P('M80 9V16M80 114V121M24 65H31M129 65H136','stroke-width=".8"')}<g class="compass-needle">${P('M80 28L91 65L80 101L69 65Z','class="paper-fill"')}${P('M80 28V101M69 65H91','class="secondary-line"')}${fine(h)}${C(80,65,3.5,'class="paper-fill"')}</g>${P('M113 26L119 20M116 22H121V27M40 109L44 105','class="secondary-line"')}${dots([[23,28],[28,23],[131,104],[136,109],[136,99]])}`;
    }
  };

  function icon(kind) {
    const key=Object.hasOwn(drawings,kind)?kind:'other';
    return `<svg class="odor-art art-${key}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 130" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><g class="art-idle">${drawings[key]()}</g></svg>`;
  }

  function hero() {
    let streams='', clouds='', arcs='', streets='', compass='';
    for(let i=0;i<11;i++) {
      streams+=P(`M${15+i*2} ${175+i*2.1}C${76+i} ${128+i*1.8} ${133+i*2} ${192+i*1.1} ${183+i*2} ${147+i*1.6}C${222+i*2} ${113+i*.6} ${204+i} ${85-i*.8} ${178-i*.5} ${96-i*.6}C${151-i*.2} ${108-i*.6} ${177+i*.4} ${144+i*.2} ${197+i*.3} ${122+i*.4}`);
    }
    for(let i=0;i<8;i++) {
      clouds+=P(`M${138+i*1.4} ${189-i*2.7}C${201+i} ${198-i*3.3} ${219+i*1.2} ${159-i*3.1} ${260+i*2} ${152-i*2}C${310+i*1.1} ${147-i*3} ${326+i} ${191-i*2.3} ${371+i*.8} ${174-i*2}C${414+i*.7} ${157-i*1.8} ${397+i} ${111-i*2} ${366+i*.8} ${124-i*2}C${347+i*.9} ${133-i*2} ${366+i} ${154-i*2} ${379+i*.7} ${142-i*2}`);
    }
    for(let i=0;i<6;i++) {
      arcs+=P(`M${285+i*2} ${158-i}C${289+i*2} ${99-i*3} ${347+i*2} ${103-i*3} ${346+i*2} ${61-i*2}C${345+i*2} ${28-i*2} ${316+i} ${30-i*1.5} ${316+i} ${48-i}C${316+i} ${62-i} ${336+i*.8} ${61-i} ${333+i*.9} ${47-i*.4}`);
    }
    for(let i=0;i<7;i++) streets+=P(`M${38+i*8} 138V153M${104+i*5} 126V141`);
    for(let i=0;i<36;i++) {
      const a=i*Math.PI/18, r=i%3===0?35:39;
      compass+=P(`M${457+Math.cos(a)*r} ${77+Math.sin(a)*r}L${457+Math.cos(a)*42} ${77+Math.sin(a)*42}`);
    }
    return `<svg class="odor-hero" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 210" preserveAspectRatio="xMidYMid meet" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <g class="hero-city">${P('M22 170V133H33V118H53V133H73V120H94V149M37 133V101H59V107H70V124M104 147V117H138V145M116 117V106H127V117M129 144V96H153V143M134 97V89H148V97','class="paper-fill"')}${fine(streets+P('M43 110H47M43 116H47M43 122H47M55 112H60M112 123H118M112 130H118M125 123H131M137 104H145M137 111H145M137 118H145M137 125H145M137 132H145'))}</g>
      <g class="odor-flow hero-streams">${fine(streams)}</g>
      <g class="odor-flow hero-clouds">${fine(clouds)}</g>
      <g class="odor-flow hero-rising">${fine(arcs)}</g>
      <g class="hero-little-volutes">${spiral(245,39,.7)}${spiral(287,16,.49)}${spiral(410,162,.52)}${spiral(497,131,.55)}${spiral(149,43,.43)}</g>
      <g class="hero-compass">${C(457,77,47,'stroke-width=".6"')}${C(457,77,29,'stroke-width=".6"')}${C(457,77,52,'stroke-width=".5" stroke-dasharray="2 5"')}${fine(compass)}${P('M457 8V142M393 77H523','stroke-width=".55" stroke-dasharray="4 5"')}${P('M457 43L465 77L457 110L449 77Z','class="paper-fill"')}${P('M457 43V110M449 77H465','stroke-width=".6"')}${C(457,77,3,'class="paper-fill"')}${P('M416 36L498 118M416 118L498 36','stroke-width=".4" stroke-dasharray="2 6"')}</g>
      ${dots([[157,169],[151,173],[162,176],[248,103],[253,99],[258,105],[272,89],[276,94],[282,87],[220,39],[224,45],[215,47],[403,49],[410,44],[404,39],[461,167],[469,172],[471,164],[70,66],[75,71],[79,65],[235,182],[242,186],[251,180]])}
      ${fine(P('M18 198H90M104 198H140M414 190H455M469 190H519M30 203H67M437 195H486'))}
    </svg>`;
  }

  function wind() {
    return `<svg class="wind-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 60" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true" focusable="false"><g class="wind-idle">${P('M5 33C24 22 36 43 54 31C66 23 60 8 49 11C38 13 43 26 51 22C55 20 53 16 50 17M9 38C27 28 38 49 58 35M4 44C28 34 38 55 61 41C77 31 78 16 90 21C102 27 90 40 85 33C83 30 86 27 89 29')}${fine(P('M9 49C31 40 41 60 65 45M18 20C28 17 34 21 38 20'))}${dots([[75,10],[80,14],[76,47],[82,44]])}</g></svg>`;
  }

  window.OdorArt=Object.freeze({icon,hero,wind});
})();
