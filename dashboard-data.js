/* Funções puras: apenas a projeção pública; nenhum acesso a caderno/identificação. */
(() => {
  'use strict';
  const categories = Object.freeze({waste:'Resíduos',container:'Contentor de lixo',sewer:'Esgoto',ditch:'Valas a céu aberto',organic:'Resíduos orgânicos alimentares',metabolic:'Resíduos metabólicos',chemical:'Resíduos químicos',other:'Outros'});
  const levels = Object.freeze(['Muito fraco','Fraco','Intermediário','Forte','Muito forte']);
  const excludedIds = new Set(['c8e93016-9945-4244-86d8-7105f825da79','04bdd533-5b30-4ffd-b44b-92e986abab28','0c709360-20c0-4fc9-8bf2-ccdfb35cf5c3','128de2aa-edfa-489c-b048-e7b157e0ba31','22a4fc49-488d-4a11-b5bb-60a04ac98a28','4408bd78-7864-4a53-baa4-ae8fc11b0578','4e0883fe-3295-4d16-9abf-0dd71aff8471','8ec09065-06fc-41f1-9744-d8a2ac8920cb','a3cdd961-0b02-4632-aadc-a14fc30fd90a']);
  function validDate(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value+'T12:00:00Z')) && new Date(value+'T12:00:00Z').toISOString().slice(0,10) === value;
  }
  function normalize(id, d) {
    if (excludedIds.has(id)) return { excluded: true };
    if (!d || !validDate(d.data) || !/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(d.hora) ||
        !Number.isInteger(d.intensidade_odor?.nivel) || d.intensidade_odor.nivel < 1 || d.intensidade_odor.nivel > 5 ||
        !Number.isFinite(d.latitude) || Math.abs(d.latitude)>85 || !Number.isFinite(d.longitude) || Math.abs(d.longitude)>180 ||
        !Array.isArray(d.tipo_odor?.categorias) || !d.tipo_odor.categorias.length || d.tipo_odor.categorias.some(c=>!Object.hasOwn(categories,c))) return { invalid: true };
    return { record: {id, data:d.data, hora:d.hora, intensity:d.intensidade_odor.nivel,
      categories:[...new Set(d.tipo_odor.categorias)], location:{latitude:d.latitude,longitude:d.longitude},
      recordedAt:`${d.data}T${d.hora}-03:00`,public:true} };
  }
  function summarize(records, intensity='', category='') {
    const filtered=records.filter(r=>(!intensity||r.intensity===Number(intensity))&&(!category||r.categories.includes(category)));
    const n=filtered.length, byCategory=Object.keys(categories).map(id=>({id,label:categories[id],count:filtered.filter(r=>r.categories.includes(id)).length}));
    const byIntensity=levels.map((label,i)=>({id:String(i+1),label:`${i+1} · ${label}`,count:filtered.filter(r=>r.intensity===i+1).length}));
    const byHour=Array.from({length:24},(_,i)=>({id:String(i),label:`${String(i).padStart(2,'0')}h`,count:filtered.filter(r=>Number(r.hora.slice(0,2))===i).length}));
    for(const list of [byCategory,byIntensity,byHour])for(const row of list)row.percent=n?row.count/n*100:0;
    return {records:filtered,n,byCategory,byIntensity,byHour};
  }
  window.WaindDashboardData=Object.freeze({categories,levels,validDate,normalize,summarize});
})();
