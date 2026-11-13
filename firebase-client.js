/* WAIND GPT 0.7: private research + public map + optional private image, one atomic batch. */
(() => {
  'use strict';
  const SDK='https://www.gstatic.com/firebasejs/13.1.0/';
  const labels={waste:'Resíduos',container:'Contentor de lixo',sewer:'Esgoto',ditch:'Valas a céu aberto',organic:'Resíduos orgânicos alimentares',metabolic:'Resíduos metabólicos',chemical:'Resíduos químicos',other:'Outros'};
  const levels=['Muito fraco','Fraco','Intermediário','Forte','Muito forte'];
  const inFlight=new Map();
  const CONSENTS=['waind-pesquisa-mapa-0.7','waind-pesquisa-mapa-0.8'];
  const MOTIVOS=['corrigido','intensidade-errada','tipo-errado','local-errado','enviado-por-engano','nao-quero-participar','outro'];
  let connection,authentication;
  function connect(){
    if(!connection)connection=(async()=>{
      const [core,identity,store]=await Promise.all([
        import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')
      ]);
      const app=core.getApps().length?core.getApp():core.initializeApp(window.WaindFirebaseConfig);
      await window.WaindAppCheck?.initialize(app, SDK);
      const auth=identity.getAuth(app),db=store.getFirestore(app);
      const em=window.WaindFirebaseEmulators;
      if(em&&['127.0.0.1','localhost'].includes(location.hostname)){
        identity.connectAuthEmulator(auth,em.auth,{disableWarnings:true});
        store.connectFirestoreEmulator(db,em.host,em.firestorePort);
      }
      return {auth,identity,db,store};
    })().catch(error=>{connection=null;throw error;});
    return connection;
  }
  async function identify(c,report){
    await c.auth.authStateReady();
    const user=c.auth.currentUser;
    if(!user||user.isAnonymous||user.uid!==report.autor_uid)throw Object.assign(new Error('Conta necessária'),{code:'account-required'});
    const token=await user.getIdTokenResult(),provider=token.claims.firebase?.sign_in_provider;
    if(!['google.com','password'].includes(provider)||provider!==report.provedor_auth||user.email!==report.participant.email)throw Object.assign(new Error('Conta diferente'),{code:'account-changed'});
    return user.uid;
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
      autor_uid:report.autor_uid,provedor_auth:report.provedor_auth,nome:report.participant.name.trim(),email:report.participant.email.trim(),...when,
      tipo_ocorrencia:report.occurrence?.kind==='past'?'anterior':'atual',criado_em:createdAt,
      temperatura:temperature,
      clima:{temperatura_c:temperature,umidade_pct:number(w?.relativeHumidityPercent),vento_kmh:number(w?.windSpeedKmh),
        vento_direcao_graus:number(w?.windDirectionDeg),rajada_kmh:number(w?.windGustsKmh),
        condicao_codigo:number(w?.conditionCode),referencia_clima:w?.basis==='device-region'?'regiao-gps':w?.basis==='manual-region'?'regiao-pin':'area-estudo',
        momento:w?.moment==='historical-hourly'?'historico-horario':'atual-nao-historico',consultado_em:w?.observedAt||null,fonte:'Open-Meteo'},
      localizacao:{latitude:loc.latitude,longitude:loc.longitude,origem:loc.source,precisao_metros:number(loc.accuracyMeters),
        endereco:{rua:a.street||'',bairro:a.district||'',cidade:a.city||'',estado:a.state||'',cep:a.postcode||''}},
      intensidade_odor:intensity,tipo_odor:{...odor,outro_descricao:categories.includes('other')?report.otherDescription||'':''},
      sem_foco_visivel:!!report.noVisibleSource,visivel_por_perto:report.visibleTags||[],observacao:report.observation||'',
      foto_metadados:report.photo?{nome:report.photo.name,mime_type:report.photo.type,tamanho_bytes:report.photo.sizeBytes,largura:report.photo.width,altura:report.photo.height,largura_original:report.photo.originalWidth,altura_original:report.photo.originalHeight,sha256:report.photo.sha256,imagem_enviada:true,colecao_foto:'relatos_fotos'}:null,
      consentimento:{versao:report.consent.version,aceito_em:report.consent.acceptedAt,pesquisa:true,mapa_publico:true,copia_local:true,contexto_confirmado:true,conta_autenticada:true},
      status_qualidade:'isolado-nao-confirmado'
    };
    // Public projection is explicit: never copy identity, address, photo or free text.
    const map={latitude:loc.latitude,longitude:loc.longitude,intensidade_odor:intensity,tipo_odor:odor,...when,temperatura:temperature,status_qualidade:'isolado-nao-confirmado'};
    const p=report.photo;
    const photo=p?{autor_uid:report.autor_uid,relato_id:report.id,criado_em:createdAt,mime_type:p.type,largura:p.width,altura:p.height,
      largura_original:p.originalWidth,altura_original:p.originalHeight,tamanho_bytes:p.sizeBytes,sha256:p.sha256,dados_base64:p.dataBase64||null,
      rotulos_ml:{intensidade_nivel:report.intensity,categorias:categories,multi_hot:odor.multi_hot,sem_foco_visivel:!!report.noVisibleSource,visivel_por_perto:report.visibleTags||[]}}:null;
    return {perception,map,photo};
  }
  const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
  async function write(report){
    if(!CONSENTS.includes(report.consent?.version)||!report.consent.publicMap||!report.consent.accountAuthenticated)throw Object.assign(new Error('Consent required'),{code:'consent-required'});
    const c=await connect();const uid=await identify(c,report);
    const {store,db}=c,publicRef=store.doc(db,'relatos_mapa',report.id),privateRef=store.doc(db,'relatos_pesquisa',report.id);
    const confirmOwner=async()=>{const own=await store.getDocFromServer(privateRef);if(!own.exists()||own.data().autor_uid!==uid)throw Object.assign(new Error('Conflito de autoria'),{code:'id-conflict'});const expected={...perception},actual={...own.data()};delete expected.criado_em;delete actual.criado_em;if(canonical(actual)!==canonical(expected))throw Object.assign(new Error('Conflito de conteúdo'),{code:'id-conflict'});};
    const {perception,map,photo}=payload(report,store.serverTimestamp());
    // Read only the public receipt. Private research documents cannot be read by any client.
    const existing=await store.getDocFromServer(publicRef);
    if(existing.exists()){
      if(canonical(existing.data())!==canonical(map))throw Object.assign(new Error('Identifier conflict'),{code:'id-conflict'});
      await confirmOwner();return {alreadySaved:true,id:report.id,projectId:window.WaindFirebaseConfig.projectId};
    }
    if(report.photo)await WaindPhoto.validate(report.photo);
    const batch=store.writeBatch(db);
    batch.set(store.doc(db,'relatos_pesquisa',report.id),perception);
    batch.set(publicRef,map);
    if(photo)batch.set(store.doc(db,'relatos_fotos',report.id),photo);
    try{await identify(c,report);await batch.commit();}
    catch(error){
      // Another tab or a retried request may have completed the same immutable pair.
      const receipt=await store.getDocFromServer(publicRef).catch(()=>null);
      if(!receipt?.exists()||canonical(receipt.data())!==canonical(map))throw error;await confirmOwner();
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
    if(code.includes('account-required')||code.includes('account-changed'))return 'Entre na conta deste relato para sincronizar. As pendências permanecem separadas por conta.';
    if(code.includes('id-conflict'))return 'Este identificador já corresponde a outro conteúdo. A cópia local foi preservada para conferência.';
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
  // Exclusão pelo autor: apaga relato privado, ponto público e foto no mesmo lote (regras exigem os três juntos)
  // e grava um registro anônimo com data e motivo, sem ID do relato, conta, local ou nota.
  async function remove(id,motivo){
    if(!MOTIVOS.includes(motivo))throw Object.assign(new Error('Motivo inválido'),{code:'invalid-argument'});
    if(navigator.onLine===false)throw Object.assign(new Error('Offline'),{code:'offline'});
    const c=await connect();await c.auth.authStateReady();
    const user=c.auth.currentUser;if(!user||user.isAnonymous)throw Object.assign(new Error('Conta necessária'),{code:'account-required'});
    const {store,db}=c,privateRef=store.doc(db,'relatos_pesquisa',id);
    const own=await store.getDocFromServer(privateRef);
    if(!own.exists())return {alreadyRemoved:true,id};
    if(own.data().autor_uid!==user.uid)throw Object.assign(new Error('Relato de outra conta'),{code:'permission-denied'});
    const batch=store.writeBatch(db);
    batch.delete(privateRef);batch.delete(store.doc(db,'relatos_mapa',id));
    if(own.data().foto_metadados)batch.delete(store.doc(db,'relatos_fotos',id));
    batch.set(store.doc(store.collection(db,'relatos_exclusoes')),{excluido_em:store.serverTimestamp(),motivo,versao_app:'0.8'});
    await batch.commit();
    return {alreadyRemoved:false,id};
  }
  window.WaindCloud=Object.freeze({connect,save,message,payload,dateTime,listenMap,readMapPage,remove,MOTIVOS});
})();
