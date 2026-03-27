export const usePrintsActions = () => {
  const {$api} = useNuxtApp();

  const renderAllBadges = async (filters?: {
    participants?: boolean;
    guests?: boolean;
    sponsors?: boolean;
    admins?: boolean;
  }) => {
    return $api<Blob>("/api/badges", {
      query: filters,
    });
  };

  return {
    renderAllBadges,
  };
};
