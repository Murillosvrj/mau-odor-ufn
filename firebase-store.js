/* Development collection: immutable, private report + identity snapshot per submission. */
(() => {
  'use strict';
  const SDK='https://www.gstatic.com/firebasejs/13.1.0/';
  let connection;
  function connect(){
    if(!connection)connection=(async()=>{
      const [core,identity,store]=await Promise.all([
        import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),import(SDK+'firebase-firestore.js')
      ]);
      const app=core.initializeApp(window.WaindFirebaseConfig);
      const auth=identity.getAuth(app);
      await auth.authStateReady();
      if(!auth.currentUser)await identity.signInAnonymously(auth);
      return {auth,db:store.getFirestore(app),store};
    })().catch(error=>{connection=null;throw error;});
    return connection;
  }
  function payload(report,uid,receivedAt){
    const loc=report.location,w=report.weather;
    const participant={
      ownerUid:uid,reportId:report.id,name:report.participant.name.trim(),
      email:report.participant.email.trim(),emailVerified:false,receivedAt,
      consent:{cloudStorage:true,contextConfirmed:true,version:'waind-firebase-dev-1',acceptedAt:report.consent.acceptedAt}
    };
    const perception={
      schemaVersion:3,id:report.id,ownerUid:uid,receivedAt,recordedAt:report.recordedAt,
      occurrence:report.occurrence,intensity:report.intensity,categories:report.categories,
      otherDescription:report.otherDescription||'',
      location:{latitude:loc.latitude,longitude:loc.longitude,source:loc.source,
        accuracyMeters:loc.accuracyMeters??null},
      weather:w?{source:'Open-Meteo',temperatureC:w.temperatureC,
        relativeHumidityPercent:w.relativeHumidityPercent,windSpeedKmh:w.windSpeedKmh,
        observedAt:w.observedAt,timezone:'America/Sao_Paulo',basis:w.basis}:null,
      photoProvided:!!report.photo,noVisibleSource:report.noVisibleSource,
      visibleTags:report.visibleTags,observation:report.observation,
      evidenceType:'citizen-perception',verificationStatus:'isolated-unconfirmed',causeProven:false,
      ai:{computerVisionExecuted:false,predictionExecuted:false},appVersion:'0.5.0-dev'
    };
    return {participant,perception};
  }
  async function save(report){
    const {auth,db,store}=await connect();
    const uid=auth.currentUser.uid;
    const reportRef=store.doc(db,'relatos',report.id),personRef=store.doc(db,'participantes',report.id);
    // A transaction is not queued offline. Retrying the same ID never adds a second report.
    const result=await store.runTransaction(db,async transaction=>{
      const existing=await transaction.get(reportRef);
      if(existing.exists())return {alreadySaved:true};
      const {participant,perception}=payload(report,uid,store.serverTimestamp());
      transaction.set(personRef,participant);
      transaction.set(reportRef,perception);
      return {alreadySaved:false};
    });
    return {...result,id:report.id,projectId:window.WaindFirebaseConfig.projectId};
  }
  function message(error){
    const code=String(error?.code||'');
    if(code.includes('permission-denied'))return 'O banco não autorizou o envio. Seu relato continua aberto. Tente novamente após conferir a configuração.';
    if(code.includes('operation-not-allowed'))return 'A identificação automática ainda não está disponível. Seu relato continua aberto.';
    return 'Não foi possível confirmar o envio. Confira a conexão e tente novamente; usaremos o mesmo identificador para evitar duplicação.';
  }
  window.WaindCloud=Object.freeze({save,message,payload});
})();
