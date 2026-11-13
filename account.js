/* Conta privada GPT 0.7. Senhas nunca são persistidas pelo WAIND. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let mode = 'login', busy = false, lastUid = null;
  function status(message, error = false) {
    $('account-status').textContent = message;
    $('account-status').classList.toggle('field-error', error);
  }
  function controls(disabled) {
    busy = disabled;
    document.querySelectorAll('[data-account-action], #account-password, #account-email, #account-name').forEach(el => el.disabled = disabled);
  }
  function render() {
    const a = WaindCloud.currentAccount();
    if (!a && lastUid) mode = 'login';
    $('account-entry').hidden = !!a;
    $('account-connected').hidden = !a;
    $('account-register-name').hidden = mode !== 'register';
    $('account-password').autocomplete = mode === 'register' ? 'new-password' : 'current-password';
    $('account-submit').textContent = mode === 'register' ? 'Criar minha conta ↗' : 'Entrar com e-mail ↗';
    $('account-toggle').textContent = mode === 'register' ? 'Já tenho uma conta' : 'Criar conta com e-mail';
    if (a) {
      $('account-connected-email').textContent = a.email;
      $('participant-email').value = a.email;
      if (lastUid !== a.uid || document.activeElement !== $('participant-name')) $('participant-name').value = a.name || '';
    } else {
      $('participant-name').value = '';
      $('participant-email').value = '';
    }
    $('participant-name').disabled = !a || busy;
    $('profile-save').disabled = !a || busy;
    if (lastUid !== (a?.uid || null)) {
      $('data-consent').checked = false;
      $('context-confirm').checked = false;
      $('account-password').value = '';
    }
    lastUid = a?.uid || null;
    window.dispatchEvent(new Event('waind:change'));
  }
  async function run(action, success) {
    if (busy) return;
    controls(true); status('Aguarde…');
    try { await action(); status(success || 'Conta conectada. Confira seus dados e o consentimento.'); }
    catch (error) { status(WaindCloud.accountMessage(error), true); }
    finally { controls(false); render(); }
  }
  $('account-google').addEventListener('click', () => run(() => WaindCloud.googleSignIn()));
  $('account-submit').addEventListener('click', () => {
    const email = $('account-email'), password = $('account-password').value;
    if (!email.value.trim() || !email.checkValidity()) { email.reportValidity(); return; }
    if (!password || (mode === 'register' && password.length < 6)) { status('Informe a senha. Para criar a conta, use pelo menos 6 caracteres.', true); $('account-password').focus(); return; }
    const name = $('account-name').value.trim();
    if (mode === 'register' && !name) { status('Informe seu nome para criar a conta.', true); $('account-name').focus(); return; }
    run(() => mode === 'register' ? WaindCloud.emailRegister(email.value.trim(), password, name) : WaindCloud.emailSignIn(email.value.trim(), password));
  });
  $('account-password').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('account-submit').click(); } });
  $('account-toggle').addEventListener('click', () => { mode = mode === 'login' ? 'register' : 'login'; $('account-password').value = ''; status(''); render(); });
  $('account-reset').addEventListener('click', () => {
    const email = $('account-email');
    if (!email.value.trim() || !email.checkValidity()) { status('Informe seu e-mail acima para recuperar o acesso.', true); email.focus(); return; }
    run(() => WaindCloud.resetPassword(email.value.trim()), 'Se houver uma conta elegível, você receberá as instruções por e-mail.');
  });
  $('account-signout').addEventListener('click', () => run(() => WaindCloud.signOut(), 'Você saiu da conta. As pendências permanecem neste aparelho, separadas por conta.'));
  $('profile-save').addEventListener('click', () => {
    const name = $('participant-name').value.trim();
    if (!name) { status('Informe seu nome de apresentação.', true); return; }
    run(() => WaindCloud.updateProfileName(name), 'Nome atualizado para os próximos relatos. Seus relatos anteriores foram preservados.');
  });
  window.addEventListener('waind:form-reset',render);
  window.addEventListener('waind:account', () => { render(); if (WaindCloud.currentAccount()) status('Conta conectada. Confira o contexto e o consentimento antes de continuar.'); });
  render(); controls(true);
  WaindCloud.watchAccount().then(() => { controls(false); render(); if (!WaindCloud.currentAccount()) status('Entre com Google ou use seu e-mail para começar.'); }).catch(error => { controls(false); render(); status(WaindCloud.accountMessage(error), true); });
})();
