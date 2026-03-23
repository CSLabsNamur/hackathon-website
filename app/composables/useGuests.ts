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

  const createGuest = async (data: CreateGuestSchema) => {
    return $api("/api/guests", {
      method: "POST",
      body: data,
    });
  };

  const updateGuest = async (id: string, data: EditGuestSchema) => {
    return $api(`/api/guests/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const removeGuest = async (id: string) => {
    return $api(`/api/guests/${id}`, {
      method: "DELETE",
    });
  };

  return {
    createGuest,
    updateGuest,
    removeGuest,
  };
};
