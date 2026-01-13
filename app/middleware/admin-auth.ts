export default defineNuxtRouteMiddleware(async (_to, _from) => {
  //const user = useSupabaseUser()
  // TODO: Change when fixed https://github.com/nuxt-modules/supabase/issues/565
  const supabase = useSupabaseClient();
  const {data} = await supabase.auth.getClaims();

  if (!data?.claims || data.claims.app_metadata?.role !== "admin") {
    return navigateTo("/");
  }
});
