(() => {
  'use strict';
  let pending;
  window.WaindAppCheck = Object.freeze({
    initialize(app, sdkBase) {
      if (!pending) pending = (async () => {
        const config = window.WaindAppCheckConfig;
        if (!config?.enabled) return { status: 'not-configured' };
        if (!config.siteKey?.trim()) throw Object.assign(new Error('Falta a chave pública do App Check.'), { code: 'app-check/not-configured' });
        const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
        // O SDK gera o token apenas neste navegador local; nenhum token é incluído no build.
        if (local && config.localDebug) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import(sdkBase + 'firebase-app-check.js');
        initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(config.siteKey), isTokenAutoRefreshEnabled: true });
        return { status: local && config.localDebug ? 'local-debug' : 'enterprise' };
      })().catch(error => { pending = null; throw error; });
      return pending;
    }
  });
})();
