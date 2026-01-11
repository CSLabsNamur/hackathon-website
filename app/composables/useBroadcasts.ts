import type { CreateBroadcastSchema } from "#shared/schemas/broadcasts/create";

export const useBroadcastsActions = () => {
  const {$api} = useNuxtApp();

  const sendBroadcast = async (data: CreateBroadcastSchema) => {
    const formData = new FormData();
    formData.append("recipients", data.recipients);
    formData.append("title", data.title);
    formData.append("message", data.message);

    if (data.attachments) {
      data.attachments.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    console.log("Sending broadcast with data:", formData);

    await $api("/api/broadcast", {
      method: "POST",
      body: formData,
    });
  };

  return {
    sendBroadcast,
  };
};
