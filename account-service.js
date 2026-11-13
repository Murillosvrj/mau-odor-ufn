/* GPT 0.7: sessão persistente, perfil e histórico, separados da projeção pública. */
(() => {
  'use strict';
  const cloud = window.WaindCloud;
  let account = null, generation = 0, watching, lastError = null;
  const provider = token => token.claims?.firebase?.sign_in_provider;
  const permanent = user => !!user && !user.isAnonymous;
  const failure = code => Object.assign(new Error(code), {code});
  function publish() { window.dispatchEvent(new CustomEvent('waind:account', {detail:{account:currentAccount(),error:lastError}})); }
  function currentAccount() { return account ? {...account} : null; }
  async function snapshot(user, c, n) {
    if (!permanent(user)) return null;
    const token = await user.getIdTokenResult();
    const authProvider = provider(token);
    if (!['google.com','password'].includes(authProvider) || !user.email) throw failure('account-provider');
    let name = (user.displayName || '').slice(0,120), profileReady = false;
    const ref = c.store.doc(c.db,'usuarios_perfil',user.uid);
    try {
      const profile = await c.store.getDocFromServer(ref);
      if (n !== generation) return null;
      if (profile.exists()) name = profile.data().nome || name;
      else await c.store.setDoc(ref,{uid:user.uid,nome:name,email:user.email,provedor:authProvider,criado_em:c.store.serverTimestamp(),atualizado_em:c.store.serverTimestamp()});
      profileReady = true;
    } catch (error) {
      // A conta pode ser usada offline; confirmação do perfil continua explícita.
      if (n !== generation) return null;
      lastError = error;
    }
    return {uid:user.uid,email:user.email,name,provider:authProvider,profileReady};
  }
  async function watchAccount() {
    if (!watching) watching = (async () => {
      const c = await cloud.connect();
      await c.identity.setPersistence(c.auth,c.identity.browserLocalPersistence);
      let first = true;
      const initial = new Promise(resolve => c.identity.onIdTokenChanged(c.auth, async user => {
        const n = ++generation;
        if (!permanent(user) || account?.uid !== user.uid) { account = null; publish(); }
        lastError = null; // Uma renovação de token da mesma conta preserva o formulário.
        try { const next = await snapshot(user,c,n); if (n === generation) { account = next; publish(); } }
        catch (error) { if (n === generation) { lastError = error; publish(); } }
        finally { if (first) { first = false; resolve(); } }
      }));
      const intent = sessionStorage.getItem('waind-auth-redirect');
      if (intent) {
        sessionStorage.removeItem('waind-auth-redirect');
        try { await c.identity.getRedirectResult(c.auth); }
        catch (error) {
          const credential = c.identity.GoogleAuthProvider.credentialFromError(error);
          if (credential && ['auth/credential-already-in-use','auth/email-already-in-use'].includes(error.code)) await c.identity.signInWithCredential(c.auth,credential);
          else { lastError = error; publish(); throw error; }
        }
      }
      await c.auth.authStateReady(); await initial;
    })().catch(error => { watching = null; throw error; });
    return watching;
  }
  async function settle(user) {
    const c = await cloud.connect();
    const n = ++generation; if (account?.uid !== user.uid) { account = null; publish(); }
    const next = await snapshot(user,c,n);
    if (n === generation) { account = next; publish(); }
    return currentAccount();
  }
  async function googleSignIn() {
    const c = await cloud.connect(), p = new c.identity.GoogleAuthProvider();
    p.setCustomParameters({prompt:'select_account'});
    const anonymous = c.auth.currentUser?.isAnonymous;
    try {
      const result = anonymous ? await c.identity.linkWithPopup(c.auth.currentUser,p) : await c.identity.signInWithPopup(c.auth,p);
      return settle(result.user);
    } catch (error) {
      const credential = c.identity.GoogleAuthProvider.credentialFromError(error);
      if (credential && ['auth/credential-already-in-use','auth/email-already-in-use'].includes(error.code)) return settle((await c.identity.signInWithCredential(c.auth,credential)).user);
      if (['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(error.code)) {
        sessionStorage.setItem('waind-auth-redirect',anonymous?'link':'signin');
        try {
          if (anonymous) await c.identity.linkWithRedirect(c.auth.currentUser,p);
          else await c.identity.signInWithRedirect(c.auth,p);
        } catch (redirectError) { sessionStorage.removeItem('waind-auth-redirect'); throw redirectError; }
        return;
      }
      throw error;
    }
  }
  async function emailRegister(email,password,name) {
    const c = await cloud.connect(); let result;
    if (c.auth.currentUser?.isAnonymous) {
      try { result = await c.identity.linkWithCredential(c.auth.currentUser,c.identity.EmailAuthProvider.credential(email,password)); }
      catch (error) {
        if (!['auth/credential-already-in-use','auth/email-already-in-use'].includes(error.code)) throw error;
        return emailSignIn(email,password); // Não importa nem reatribui relatos anteriores.
      }
    } else result = await c.identity.createUserWithEmailAndPassword(c.auth,email,password);
    await c.identity.updateProfile(result.user,{displayName:name.trim().slice(0,120)});
    await settle(result.user); return updateProfileName(name);
  }
  async function emailSignIn(email,password) { const c=await cloud.connect(); return settle((await c.identity.signInWithEmailAndPassword(c.auth,email,password)).user); }
  async function resetPassword(email) { const c=await cloud.connect(); return c.identity.sendPasswordResetEmail(c.auth,email); }
  async function signOut() { const c=await cloud.connect(); ++generation; account=null; publish(); await c.identity.signOut(c.auth); }
  async function updateProfileName(name) {
    name = name.trim(); if (!name || name.length>120) throw failure('profile-name');
    const c=await cloud.connect(), a=currentAccount();
    if (!a || c.auth.currentUser?.uid!==a.uid) throw failure('account-required');
    const ref=c.store.doc(c.db,'usuarios_perfil',a.uid), old=await c.store.getDocFromServer(ref);
    if (currentAccount()?.uid!==a.uid) throw failure('account-changed');
    await c.store.setDoc(ref,{uid:a.uid,nome:name,email:a.email,provedor:a.provider,criado_em:old.exists()?old.data().criado_em:c.store.serverTimestamp(),atualizado_em:c.store.serverTimestamp()});
    await c.identity.updateProfile(c.auth.currentUser,{displayName:name});
    if (currentAccount()?.uid===a.uid) { account={...account,name,profileReady:true}; publish(); }
  }
  function fromPrivate(id,d) {
    const m=d.foto_metadados;
    return {id,autor_uid:d.autor_uid,provedor_auth:d.provedor_auth,schemaVersion:7,
      participant:{name:d.nome,email:d.email},recordedAt:d.criado_em?.toDate?.().toISOString()||`${d.data}T${d.hora}-03:00`,
      occurrence:{kind:d.tipo_ocorrencia==='anterior'?'past':'current',occurredAt:`${d.data}T${d.hora}-03:00`},
      intensity:d.intensidade_odor.nivel,categories:d.tipo_odor.categorias,multiHot:d.tipo_odor.multi_hot,otherDescription:d.tipo_odor.outro_descricao,
      location:{latitude:d.localizacao.latitude,longitude:d.localizacao.longitude,source:d.localizacao.origem,accuracyMeters:d.localizacao.precisao_metros,address:d.localizacao.endereco},
      weather:d.clima,visibleTags:d.visivel_por_perto,noVisibleSource:d.sem_foco_visivel,observation:d.observacao,
      photo:m?{name:m.nome,type:m.mime_type,sizeBytes:m.tamanho_bytes,width:m.largura,height:m.altura,sha256:m.sha256,storedIn:'relatos_fotos',imageSent:true}:null,
      consent:{version:d.consentimento.versao},syncStatus:'sincronizado',cloud:{confirmed:true},storage:'firebase'};
  }
  async function readHistory({cursor=null,pageSize=50}={}) {
    if (![50,100].includes(pageSize)) throw failure('invalid-argument');
    const c=await cloud.connect(), a=currentAccount();
    if (!a || c.auth.currentUser?.uid!==a.uid || !permanent(c.auth.currentUser)) throw failure('account-required');
    const q=[c.store.where('autor_uid','==',a.uid),c.store.orderBy('data','desc'),c.store.orderBy('hora','desc'),c.store.orderBy(c.store.documentId(),'desc')];
    if(cursor)q.push(c.store.startAfter(cursor));q.push(c.store.limit(pageSize+1));
    const result=await c.store.getDocsFromServer(c.store.query(c.store.collection(c.db,'relatos_pesquisa'),...q));
    if(currentAccount()?.uid!==a.uid)throw failure('account-changed');
    const docs=result.docs.slice(0,pageSize);
    return {uid:a.uid,records:docs.map(d=>fromPrivate(d.id,d.data())),cursor:docs.at(-1)||null,hasMore:result.size>pageSize};
  }
  function accountMessage(error) {
    const code=String(error?.code||'');
    if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found'))return 'Não foi possível entrar. Confira e-mail e senha ou recupere seu acesso.';
    if(code.includes('email-already-in-use'))return 'Este e-mail já possui uma conta. Use Entrar ou recupere a senha.';
    if(code.includes('weak-password')||code.includes('password-does-not-meet-requirements'))return 'A senha não atende aos requisitos. Use uma senha mais longa e tente novamente.';
    if(code.includes('popup-closed')||code.includes('cancelled-popup'))return 'A entrada foi cancelada. Você pode tentar novamente ou usar e-mail e senha.';
    if(code.includes('operation-not-allowed')||code.includes('unauthorized-domain'))return 'Esta forma de entrada ainda não está disponível neste endereço. Tente a alternativa por e-mail.';
    if(code.includes('too-many-requests'))return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
    if(code.includes('permission-denied'))return 'Não foi possível confirmar seu perfil ou histórico. Suas informações anteriores foram preservadas; tente novamente.';
    if(code.includes('profile-name'))return 'Informe um nome de apresentação com até 120 caracteres.';
    if(code.includes('account-required')||code.includes('account-changed'))return 'Entre na conta deste relato para continuar. As pendências são separadas por conta.';
    if(code.includes('network')||code.includes('unavailable'))return 'Sem conexão agora. Tente entrar novamente quando a internet voltar.';
    return 'Não foi possível concluir a entrada. Tente novamente ou use e-mail e senha.';
  }
  window.WaindCloud=Object.freeze({...cloud,watchAccount,currentAccount,googleSignIn,emailRegister,emailSignIn,resetPassword,signOut,updateProfileName,readHistory,accountMessage});
})();
