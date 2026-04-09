export const useCurrentAdmin = async () => {
  const res = await useAPI<CurrentAdmin>("/api/admins/me", {
    key: "current-admin",
    credentials: "same-origin",
    dedupe: "defer",
  });

  return {
    ...res,
    isSuperAdmin: useCached(computed(() => res.data.value?.authorization.roleKeys.includes("super_admin"))),
  };
};
