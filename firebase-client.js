/* WAIND GPT 0.6: private research + public map + optional private image, one atomic batch. */
(() => {
  'use strict';
  const SDK='https://www.gstatic.com/firebasejs/13.1.0/';
  const labels={waste:'Resíduos',container:'Contentor de lixo',sewer:'Esgoto',ditch:'Valas a céu aberto',organic:'Resíduos orgânicos alimentares',metabolic:'Resíduos metabólicos',chemical:'Resíduos químicos',other:'Outros'};
  const levels=['Muito fraco','Fraco','Intermediário','Forte','Muito forte'];
  const inFlight=new Map();
  let connection,authentication;
  function connect(){
    if(!connection)connection=(async()=>{
      const [core,identity,store]=await Promise.all([
        import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')
      ]);
      const app=core.getApps().length?core.getApp():core.initializeApp(window.WaindFirebaseConfig);
      await window.WaindAppCheck?.initialize(app, SDK);
      return {auth:identity.getAuth(app),identity,db:store.getFirestore(app),store};
    })().catch(error=>{connection=null;throw error;});
    return connection;
  }
  async function identify(c){
    if(!authentication)authentication=(async()=>{
      await c.auth.authStateReady();
      if(!c.auth.currentUser)await c.identity.signInAnonymously(c.auth);
    })().catch(error=>{authentication=null;throw error;});
    return authentication;
  }
  function dateTime(iso){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
    return {data:`${parts.year}-${parts.month}-${parts.day}`,hora:`${parts.hour}:${parts.minute}:${parts.second}`};
  }
  const number=value=>Number.isFinite(value)?value:null;
  function payload(report,createdAt=report.recordedAt){
    const loc=report.location,w=report.weather,a=loc.address||{};
    const categories=Object.keys(labels).filter(id=>report.categories.includes(id));
    const odor={categorias:categories,rotulos:categories.map(id=>labels[id]),multi_hot:Object.fromEntries(Object.keys(labels).map(id=>[id,Number(categories.includes(id))]))};
    const intensity={nivel:report.intensity,rotulo:levels[report.intensity-1]};
    const when=dateTime(report.occurrence?.occurredAt||report.recordedAt);
    const temperature=number(w?.temperatureC);
    const perception={
      nome:report.participant.name.trim(),email:report.participant.email.trim(),...when,
      tipo_ocorrencia:report.occurrence?.kind==='past'?'anterior':'atual',criado_em:createdAt,
      temperatura:temperature,
      clima:{temperatura_c:temperature,umidade_pct:number(w?.relativeHumidityPercent),vento_kmh:number(w?.windSpeedKmh),
        condicao_codigo:number(w?.conditionCode),referencia_clima:w?.basis==='device-region'?'regiao-gps':w?.basis==='manual-region'?'regiao-pin':'area-estudo',
        momento:'atual-nao-historico',consultado_em:w?.observedAt||null,fonte:'Open-Meteo'},
      localizacao:{latitude:loc.latitude,longitude:loc.longitude,origem:loc.source,precisao_metros:number(loc.accuracyMeters),
        endereco:{rua:a.street||'',bairro:a.district||'',cidade:a.city||'',estado:a.state||'',cep:a.postcode||''}},
      intensidade_odor:intensity,tipo_odor:{...odor,outro_descricao:categories.includes('other')?report.otherDescription||'':''},
      sem_foco_visivel:!!report.noVisibleSource,visivel_por_perto:report.visibleTags||[],observacao:report.observation||'',
      foto_metadados:report.photo?{nome:report.photo.name,mime_type:report.photo.type,tamanho_bytes:report.photo.sizeBytes,largura:report.photo.width,altura:report.photo.height,largura_original:report.photo.originalWidth,altura_original:report.photo.originalHeight,sha256:report.photo.sha256,imagem_enviada:true,colecao_foto:'relatos_fotos'}:null,
      consentimento:{versao:'waind-pesquisa-mapa-0.6',aceito_em:report.consent.acceptedAt,pesquisa:true,mapa_publico:true,copia_local:true,contexto_confirmado:true},
      status_qualidade:'isolado-nao-confirmado'
    };
    // Public projection is explicit: never copy identity, address, photo or free text.
    const map={latitude:loc.latitude,longitude:loc.longitude,intensidade_odor:intensity,tipo_odor:odor,...when,temperatura:temperature,status_qualidade:'isolado-nao-confirmado'};
    const p=report.photo;
    const photo=p?{relato_id:report.id,criado_em:createdAt,mime_type:p.type,largura:p.width,altura:p.height,
      largura_original:p.originalWidth,altura_original:p.originalHeight,tamanho_bytes:p.sizeBytes,sha256:p.sha256,dados_base64:p.dataBase64||null,
      rotulos_ml:{intensidade_nivel:report.intensity,categorias:categories,multi_hot:odor.multi_hot,sem_foco_visivel:!!report.noVisibleSource,visivel_por_perto:report.visibleTags||[]}}:null;
    return {perception,map,photo};
  }
  const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
  async function write(report){
    if(report.consent?.version!=='waind-pesquisa-mapa-0.6'||!report.consent.publicMap)throw Object.assign(new Error('Consent required'),{code:'consent-required'});
    const c=await connect();await identify(c);
    const {store,db}=c,publicRef=store.doc(db,'relatos_mapa',report.id);
    const {perception,map,photo}=payload(report,store.serverTimestamp());
    // Read only the public receipt. Private research documents cannot be read by any client.
    const existing=await store.getDocFromServer(publicRef);
    if(existing.exists()){
      if(canonical(existing.data())!==canonical(map))throw Object.assign(new Error('Identifier conflict'),{code:'id-conflict'});
      return {alreadySaved:true,id:report.id,projectId:window.WaindFirebaseConfig.projectId};
    }
    if(report.photo)await WaindPhoto.validate(report.photo);
    const batch=store.writeBatch(db);
    batch.set(store.doc(db,'relatos_pesquisa',report.id),perception);
    batch.set(publicRef,map);
    if(photo)batch.set(store.doc(db,'relatos_fotos',report.id),photo);
    try{await batch.commit();}
    catch(error){
      // Another tab or a retried request may have completed the same immutable pair.
      const receipt=await store.getDocFromServer(publicRef).catch(()=>null);
      if(!receipt?.exists()||canonical(receipt.data())!==canonical(map))throw error;
    }
    return {alreadySaved:false,id:report.id,projectId:window.WaindFirebaseConfig.projectId};
  }
  async function save(report){
    if(navigator.onLine===false)throw Object.assign(new Error('Offline'),{code:'offline'});
    if(!inFlight.has(report.id)){
      const operation=write(report).finally(()=>inFlight.delete(report.id));
      inFlight.set(report.id,operation);
    }
    let timer;
    try{return await Promise.race([inFlight.get(report.id),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Object.assign(new Error('Confirmation timeout'),{code:'confirmation-timeout'})),14000);})]);}
    finally{clearTimeout(timer);}
  }
  function message(error){
    const code=String(error?.code||'');
    if(code.includes('permission-denied')||code.includes('operation-not-allowed'))return 'Salvo neste navegador, mas o banco recusou o envio. Aguarde a revisão da configuração; você pode exportar o JSON.';
    if(code.includes('consent-required'))return 'Este registro antigo precisa do novo consentimento para compartilhar o ponto no mapa. Ele permanece somente no caderno local.';
    return 'Salvo neste navegador, pendente de sincronização. Tentaremos enviar quando a conexão voltar.';
  }
  async function listenMap(onRecords,onStatus){
    let cancelled=false,unsubscribe=()=>{};
    onStatus('Conectando ao mapa coletivo…');
    connect().then(({store,db})=>{
      if(cancelled)return;
      unsubscribe=store.onSnapshot(store.query(store.collection(db,'relatos_mapa'),store.orderBy('data','desc'),store.limit(500)),snapshot=>{
        const records=snapshot.docs.filter(d=>!d.metadata.hasPendingWrites).map(doc=>{
          const d=doc.data();
          return {id:doc.id,location:{latitude:d.latitude,longitude:d.longitude},intensity:d.intensidade_odor?.nivel,categories:d.tipo_odor?.categorias||[],recordedAt:`${d.data}T${d.hora}-03:00`,public:true};
        });
        onRecords(records);onStatus(snapshot.metadata.fromCache?'Mapa coletivo: cópia temporária; conexão pendente.':'Mapa coletivo conectado · até 500 relatos mais recentes.');
      },()=>onStatus('Mapa coletivo indisponível. Os relatos deste navegador continuam visíveis.'));
    }).catch(()=>onStatus('Sem conexão com o mapa coletivo. Os relatos deste navegador continuam visíveis.'));
    return ()=>{cancelled=true;unsubscribe();};
  }
  // Snapshot por página: não cria outro listener permanente nem lê dados privados.
  async function readMapPage({from,to,cursor=null,pageSize=100}){
    const validDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T12:00:00Z'))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
    if(!validDate(from)||!validDate(to)||from>to||![100,200].includes(pageSize))throw Object.assign(new Error('Intervalo inválido.'),{code:'invalid-argument'});
    const {store,db}=await connect();
    const constraints=[store.where('data','>=',from),store.where('data','<=',to),store.orderBy('data','desc'),store.orderBy('hora','desc'),store.orderBy(store.documentId(),'desc')];
    if(cursor)constraints.push(store.startAfter(cursor));
    constraints.push(store.limit(pageSize+1)); // Um documento de sondagem; reaparece na próxima página.
    const query=store.query(store.collection(db,'relatos_mapa'),...constraints);
    const snapshot=await store.getDocsFromServer(query),documents=snapshot.docs.slice(0,pageSize);
    return {documents:documents.map(doc=>({id:doc.id,data:doc.data()})),cursor:documents.at(-1)||null,hasMore:snapshot.docs.length>pageSize,returnedCount:snapshot.docs.length};
  }
  window.WaindCloud=Object.freeze({save,message,payload,dateTime,listenMap,readMapPage});
})();
