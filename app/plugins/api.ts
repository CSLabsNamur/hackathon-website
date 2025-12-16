export default defineNuxtPlugin((nuxtApp) => {
  const session = useSupabaseSession();

  const api = $fetch.create({
    onRequest({options}) {
      if (session.value?.access_token) {
        options.headers.set("Authorization", `Bearer ${session.value?.access_token}`);
      }
    },

    async onResponseError({response}) {
      if (response.status === 401) {
        await nuxtApp.runWithContext(() => navigateTo("/login"));
      }

      // TODO: Hide detailed errors such as Prisma errors
      const errorData = await response._data as { message?: string };
      await nuxtApp.runWithContext(() => {
        const toast = useToast();
        toast.add({
          color: "error",
          title: "Erreur",
          description: errorData.message || "Une erreur inattendue s'est produite. Veuillez contacter un administrateur.",
          icon: "i-lucide-alert-circle",
          duration: 10000,
        });
      });
    },
  });

  // Expose to useNuxtApp().$api
  return {
    provide: {
      api,
    },
  };
});
