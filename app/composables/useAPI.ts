export const useAPI = createUseFetch(options => ({
  $fetch: useNuxtApp().$api as typeof $fetch,
  onResponseError: async ({response}) => {
    const nuxtApp = useNuxtApp();
    if (response.status === 401) {
      await nuxtApp.runWithContext(() => navigateTo("/"));
    }

    const errorData = await response._data as { message?: string, statusMessage: string };
    await nuxtApp.runWithContext(() => {
      const toast = useToast();
      console.log(errorData);
      toast.add({
        color: "error",
        title: "Erreur",
        description: (errorData.statusMessage !== "Server Error" ? errorData.statusMessage : null) || errorData.message || "Une erreur inattendue s'est produite. Veuillez contacter un administrateur.",
        icon: "i-lucide-alert-circle",
        duration: 10000,
      });
    });
  },
  ...options,
}));
