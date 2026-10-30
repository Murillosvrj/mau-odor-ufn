(() => {
  'use strict';
  const $=s=>document.querySelector(s), D=WaindDashboardData;
  let rows=[],cursor=null,more=false,busy=false,generation=0,period=null,pages=0,readDocs=0,excluded=0,invalid=0,queried=false,map=null;
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  $('#date-end').value=day;$('#date-start').value=day.slice(0,8)+'01';
  for(const [id,label] of Object.entries(D.categories))$('#filter-category').add(new Option(label,id));
  D.levels.forEach((label,i)=>$('#filter-intensity').add(new Option(`${i+1} · ${label}`,String(i+1))));
  const date=s=>s.split('-').reverse().join('/');
  const pct=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(v)+'%';
  function bars(target,list,n,colors=false){
    $(target).replaceChildren(...list.map((r,i)=>{
      const row=document.createElement('div'),label=document.createElement('p'),name=document.createElement('span'),value=document.createElement('span'),track=document.createElement('div'),fill=document.createElement('div');
      row.className='dashboard-bar';label.className='dashboard-bar-label';name.textContent=r.label;value.textContent=n?`${pct(r.percent)} · ${r.count}`:'— · 0';label.append(name,value);
      track.className='dashboard-bar-track';track.setAttribute('aria-hidden','true');fill.className='dashboard-bar-fill';fill.style.setProperty('--bar-width',r.percent+'%');if(colors)fill.style.setProperty('--bar-color',OdorHeat.colors[i]);track.append(fill);row.append(label,track);return row;
    }));
  }
  function table(label,list,n){
    const t=document.createElement('table'),caption=t.createCaption();caption.textContent=label;
    const head=t.createTHead().insertRow();for(const title of ['Indicador','Relatos','% dos relatos no filtro']){const th=document.createElement('th');th.scope='col';th.textContent=title;head.append(th);}
    const body=t.createTBody();for(const r of list){const tr=body.insertRow(),name=document.createElement('th');name.scope='row';name.textContent=r.label;tr.append(name);tr.insertCell().textContent=String(r.count);tr.insertCell().textContent=n?pct(r.percent):'—';}return t;
  }
  function render(){
    const s=D.summarize(rows,$('#filter-intensity').value,$('#filter-category').value);
    $('#metric-total').textContent=queried?String(s.n):'—';$('#metric-loaded').textContent=queried?`${s.n} no filtro / ${rows.length} válidos carregados`:'Nenhuma consulta realizada';
    const dates=s.records.map(r=>r.data).sort();$('#metric-period').textContent=dates.length?`${date(dates[0])} — ${date(dates.at(-1))}`:'—';
    $('#metric-coverage').textContent=!queried?'A consultar':more?'Recorte parcial':'Consulta percorrida';
    $('#metric-excluded').textContent=`${excluded} de teste excluídos · ${invalid} inválidos ignorados`;
    bars('#category-bars',s.byCategory,s.n);bars('#intensity-bars',s.byIntensity,s.n,true);
    const max=Math.max(1,...s.byHour.map(r=>r.count));$('#hour-bars').replaceChildren(...s.byHour.map(r=>{const div=document.createElement('div');div.className='dashboard-hour';const count=document.createElement('span'),track=document.createElement('div'),fill=document.createElement('div'),label=document.createElement('small');count.textContent=String(r.count);track.className='dashboard-hour-track';track.setAttribute('aria-hidden','true');fill.className='dashboard-hour-fill';fill.style.setProperty('--hour-height',(r.count/max*100)+'%');track.append(fill);label.textContent=r.label;div.append(count,track,label);return div;}));
    $('#dashboard-table').replaceChildren(table('Categorias — múltipla escolha',s.byCategory,s.n),table('Intensidade percebida',s.byIntensity,s.n),table('Hora da ocorrência',s.byHour,s.n));
    $('#page-detail').textContent=queried?`${pages} página(s) · ${readDocs} documentos retornados pelo servidor (inclui sondagem de continuidade). ${more?'Há mais registros: carregue a próxima página para ampliar a análise.':'Fim do intervalo consultado nesta sessão; não é um retrato imutável do banco.'}`:'Nenhuma página carregada.';
    $('#load-more').disabled=busy||!more||!period||$('#date-start').value!==period.from||$('#date-end').value!==period.to;$('#query-submit').disabled=busy;
    $('#date-start').disabled=busy;$('#date-end').disabled=busy;
    if(!map&&queried)map=WaindPin.mount($('#dashboard-map'),{readOnly:true,getRecords:()=>D.summarize(rows,$('#filter-intensity').value,$('#filter-category').value).records,getLevels:()=>D.levels.map(name=>({name})),categoryLabel:id=>D.categories[id],getMapStatus:()=>more?'Recorte parcial; há mais páginas.':'Intervalo percorrido.',methodText:'DSR · Pontos e calor representam apenas os relatos públicos carregados no filtro. Sem identificação, dados locais ou prévia de pino.'});
    map?.refresh();
  }
  async function query(append){
    if(busy)return;
    const from=$('#date-start').value,to=$('#date-end').value;
    if(!D.validDate(from)||!D.validDate(to)||from>to){$('#dashboard-error').hidden=false;$('#dashboard-error').textContent='Informe datas válidas; a data inicial deve ser anterior ou igual à final.';return;}
    if(append&&(!period||from!==period.from||to!==period.to)){ $('#dashboard-error').hidden=false;$('#dashboard-error').textContent='O período mudou. Use “Consultar período” para iniciar outra consulta.';return; }
    const token=++generation;busy=true;$('#dashboard-error').hidden=true;
    if(!append){rows=[];cursor=null;more=false;period={from,to};pages=readDocs=excluded=invalid=0;queried=false;}
    $('#dashboard-status').textContent=`Consultando relatos públicos de ${date(from)} a ${date(to)}…`;$('#dashboard-main').setAttribute('aria-busy','true');render();
    try{
      const result=await WaindCloud.readMapPage({from,to,cursor:append?cursor:null,pageSize:100});if(token!==generation)return;
      const unique=new Map(rows.map(r=>[r.id,r]));for(const doc of result.documents){const item=D.normalize(doc.id,doc.data);if(item.excluded)excluded++;else if(item.invalid)invalid++;else unique.set(item.record.id,item.record);}
      rows=[...unique.values()];cursor=result.cursor;more=result.hasMore;readDocs+=result.returnedCount;pages++;queried=true;
      $('#dashboard-status').textContent=`Período consultado: ${date(from)} a ${date(to)}. ${rows.length?`${rows.length} relatos válidos carregados.`:'Nenhum relato válido nas páginas carregadas.'} ${more?'Resultado parcial: há mais páginas disponíveis.':'Fim da consulta para o período.'}`;
      $('#query-time').textContent='Consulta ao servidor: '+new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'medium'}).format(new Date())+' · Brasília';
    }catch(error){
      if(token!==generation)return;
      $('#dashboard-error').hidden=false;const code=String(error?.code||'');
      $('#dashboard-error').textContent=code.includes('failed-precondition')?'A consulta precisa de um índice no Firestore. O arquivo firestore.indexes.json define o índice de data/hora; ele precisa ser publicado no projeto.':code.includes('permission-denied')?'O acesso público foi recusado. Verifique App Check e a configuração do projeto; não libere a coleção privada.':code.includes('app-check')?'App Check ainda não configurado corretamente. Confira a chave pública e o registro do aplicativo.':'Não foi possível concluir a consulta ao servidor. Confira a conexão e tente novamente.';
      $('#dashboard-status').textContent='Consulta não concluída. Isso não significa ausência de relatos no período.';
    }finally{if(token===generation){busy=false;$('#dashboard-main').removeAttribute('aria-busy');render();}}
  }
  $('#dashboard-query').addEventListener('submit',e=>{e.preventDefault();query(false);});$('#load-more').addEventListener('click',()=>query(true));
  for(const id of ['filter-category','filter-intensity'])$('#'+id).addEventListener('change',render);
  for(const id of ['date-start','date-end'])$('#'+id).addEventListener('input',()=>{if(period)$('#dashboard-status').textContent='Período alterado. Use “Consultar período”. Os gráficos ainda mostram a consulta anterior.';$('#load-more').disabled=true;});
  render();
})();
