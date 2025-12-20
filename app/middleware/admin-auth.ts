export default defineNuxtRouteMiddleware((to, _from) => {
  const user = useSupabaseUser()

  if (!user.value || user.value.user_metadata?.role !== "admin") {
    return navigateTo('/')
  }
})
