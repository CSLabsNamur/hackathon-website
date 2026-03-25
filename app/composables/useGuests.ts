import type { CreateGuestSchema } from "#shared/schemas/guests/create";
import type { EditGuestSchema } from "#shared/schemas/guests/edit";

interface UseGuestsParams {
  lazy?: boolean;
}

export const useGuests = async (params?: UseGuestsParams) => {
  return useFetch("/api/guests", {
    lazy: params?.lazy ?? false,
  });
};

export const useGuestsActions = () => {
  const {$api} = useNuxtApp();

  const toGuestFormData = (data: CreateGuestSchema | EditGuestSchema) => {
    const formData = new FormData();

    formData.append("name", data.name);
    formData.append("type", data.type);
    if (data.quantity) formData.append("quantity", String(data.quantity));
    if (data.company) formData.append("company", data.company);
    if (data.imageFile) formData.append("imageFile", data.imageFile);

    return formData;
  };

  const createGuest = async (data: CreateGuestSchema) => {
    return $api("/api/guests", {
      method: "POST",
      body: toGuestFormData(data),
    });
  };

  const updateGuest = async (id: string, data: EditGuestSchema) => {
    return $api(`/api/guests/${id}`, {
      method: "PUT",
      body: toGuestFormData(data),
    });
  };

  const removeGuest = async (id: string) => {
    return $api(`/api/guests/${id}`, {
      method: "DELETE" as never,
    });
  };

  return {
    createGuest,
    updateGuest,
    removeGuest,
  };
};
