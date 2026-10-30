export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("nuxt-security:routeRules", (routeRules) => {
    const {public: {supabase}} = useRuntimeConfig();
    if (!supabase.url) return;

    const origin = new URL(supabase.url).origin;
    const rules = routeRules["/**"];
    if (rules?.headers && rules.headers.contentSecurityPolicy) {
      const csp = {...rules.headers.contentSecurityPolicy};
      if (Array.isArray(csp["img-src"])) csp["img-src"] = [...csp["img-src"], origin];
      if (Array.isArray(csp["connect-src"])) {
        csp["connect-src"] = [...csp["connect-src"], origin, origin.replace(/^http/, "ws")];
      }
      rules.headers = {...rules.headers, contentSecurityPolicy: csp};
    }
    if (rules?.corsHandler && Array.isArray(rules.corsHandler.origin)) {
      rules.corsHandler = {...rules.corsHandler, origin: [...rules.corsHandler.origin, origin]};
    }
  });
});
