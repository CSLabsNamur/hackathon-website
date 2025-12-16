import * as v from "valibot";
import reorder from "#shared/schemas/rooms/reorder";


interface UseRoomsParams {
  lazy?: boolean;
}

export const useRooms = async (params?: UseRoomsParams) => {
  return useAPI("/api/rooms", {
    lazy: params?.lazy ?? false,
    //cache: "force-cache",
  });
};

export const useRoomsActions = () => {
  const { $api } = useNuxtApp()

  const createRoom = async (name: string) => {
    return await $api("/api/rooms", {
      method: "POST",
      body: {name},
    });
  };

  const reorderRooms = async (list: v.InferOutput<typeof reorder>) => {
    return await $api("/api/rooms/reorder", {
      method: "PATCH",
      body: list,
    });
  };

  const renameRoom = async (id: string, name: string) => {
    return await $api(`/api/rooms/${id}`, {
      method: "PUT",
      body: {name},
    });
  };

  const removeRoom = async (id: string) => {
    return await $api(`/api/rooms/${id}`, {
      method: "DELETE",
    });
  };

  return {createRoom, reorderRooms, renameRoom, removeRoom};
};