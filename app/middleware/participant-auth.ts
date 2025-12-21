export default defineNuxtRouteMiddleware(async (to, _from) => {
  //const user = useSupabaseUser()
  // TODO: Change when fixed https://github.com/nuxt-modules/supabase/issues/565
  const supabase = useSupabaseClient();
  const {data} = await supabase.auth.getClaims();

  if (!data?.claims || data.claims.user_metadata?.role !== "participant") {
    return navigateTo("/");
  }
});
