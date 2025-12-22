import type { CreateScheduleItemSchema } from "#shared/schemas/schedule/create";
import type { EditScheduleItemSchema } from "#shared/schemas/schedule/edit";

interface UseScheduleParams {
  lazy?: boolean;
}

export const useSchedule = async (params?: UseScheduleParams) => {
  return useFetch("/api/schedule", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useScheduleActions = () => {
  const {$api} = useNuxtApp();

  const createScheduleItem = async (data: CreateScheduleItemSchema) => {
    return $api("/api/schedule", {
      method: "POST",
      body: data,
    });
  };

  const updateScheduleItem = async (id: string, data: EditScheduleItemSchema) => {
    return $api(`/api/schedule/${id}`, {
      method: "PUT",
      body: data,
    });
  };

  const removeScheduleItem = async (id: string) => {
    return $api(`/api/schedule/${id}`, {
      method: "DELETE",
    });
  };

  return {
    createScheduleItem,
    updateScheduleItem,
    removeScheduleItem,
  };
};
