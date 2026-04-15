import type { CreateSponsorSchema } from "#shared/schemas/sponsors/create";
import type { EditSponsorSchema } from "#shared/schemas/sponsors/edit";

interface UseSponsorsParams {
  lazy?: boolean;
}

export const useSponsors = async (params?: UseSponsorsParams) => {
  return useAPI("/api/sponsors", {
    key: "sponsors",
    dedupe: "defer",
    lazy: params?.lazy ?? false,
  });
};

export const useSponsorsActions = () => {
  const {$api} = useNuxtApp();

  const toSponsorFormData = (data: CreateSponsorSchema | EditSponsorSchema) => {
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("description", JSON.stringify(data.description));
    formData.append("url", data.url);
    formData.append("hasBadge", String(data.hasBadge));

    if (data.logoFile) {
      formData.append("logoFile", data.logoFile);
    }

    return formData;
  };

  const createSponsor = async (data: CreateSponsorSchema) => {
    return $api("/api/sponsors", {
      method: "POST",
      body: toSponsorFormData(data),
    });
  };

  const updateSponsor = async (id: string, data: EditSponsorSchema) => {
    return $api(`/api/sponsors/${id}`, {
      method: "PUT",
      body: toSponsorFormData(data),
    });
  };

  const removeSponsor = async (id: string) => {
    return $api(`/api/sponsors/${id}`, {
      method: "DELETE" as never,
    });
  };

  const renderSponsorBadge = async (sponsor: Sponsor) => {
    return $api<Blob>(`/api/sponsors/${sponsor.id}/badge`);
  };

  const renderSponsorsBadges = async () => {
    return $api<Blob>("/api/sponsors/badges");
  };

  return {
    createSponsor,
    updateSponsor,
    removeSponsor,
    renderSponsorBadge,
    renderSponsorsBadges,
  };
};
