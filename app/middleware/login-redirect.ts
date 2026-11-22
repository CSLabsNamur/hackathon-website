export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return;

  const {data: {session}} = await useSupabaseClient().auth.getSession();
  if (!session) return navigateTo("/");

  const {data: user, error, refresh} = await useCurrentUser({immediate: false});
  await refresh();

  return navigateTo(!error.value && user.value ? `/${user.value.kind}` : "/");
});
