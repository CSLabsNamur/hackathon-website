<script setup lang="ts">
const props = defineProps<{ submissionRequest: SubmissionRequest }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeSubmissionRequest} = useSubmissionsRequestsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeSubmissionRequest(props.submissionRequest.id);

    toast.add({
      title: "Succès",
      description: "La demande de soumission a été supprimée avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal itle="Supprimer la demande de soumission"
          description="Êtes-vous sûr de vouloir supprimer cette demande de soumission ? Cette action ne peut pas être annulée."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #footer="{close}">
      <div class="flex justify-end gap-3 w-full">
        <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
        <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
