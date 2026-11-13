/* Pendências são lidas/escritas somente no compartimento do autor autenticado. */
(() => {
  'use strict';
  const key=uid=>{if(typeof uid!=='string'||!uid.length)throw new Error('Conta necessária');return 'waind-relatos-conta-v7:'+encodeURIComponent(uid);};
  const valid=(r,uid)=>r&&r.autor_uid===uid&&typeof r.id==='string'&&Number.isInteger(r.intensity)&&r.intensity>=1&&r.intensity<=5&&Array.isArray(r.categories);
  function read(uid){if(!uid)return [];try{const d=JSON.parse(localStorage.getItem(key(uid))||'[]');return Array.isArray(d)?d.filter(r=>valid(r,uid)):[];}catch{return [];}}
  function write(uid,next){
    if(next.some(r=>!valid(r,uid)))throw new Error('Fila de outra conta recusada');
    const pending=next.filter(r=>r.syncStatus==='pendente-sincronizacao');
    const confirmed=next.filter(r=>r.syncStatus!=='pendente-sincronizacao').slice(-100).map(r=>WaindPhoto.compact({...r,photo:r.photo?{...r.photo}:null}));
    for(;;){
      const keep=[...confirmed,...pending].sort((a,b)=>a.recordedAt.localeCompare(b.recordedAt));
      try{localStorage.setItem(key(uid),JSON.stringify(keep));return keep;}
      catch(error){if(error.name!=='QuotaExceededError'||!confirmed.length)throw error;confirmed.splice(0,Math.max(1,Math.ceil(confirmed.length/2)));}
    }
  }
  window.WaindLocal=Object.freeze({key,read,write,remove:uid=>localStorage.removeItem(key(uid))});
})();
