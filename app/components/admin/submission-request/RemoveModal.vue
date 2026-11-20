<script setup lang="ts">
const props = defineProps<{ submissionRequest: AdminSubmissionRequest }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeSubmissionRequest} = useSubmissionsRequestsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  if (isSubmitting.value) return;
  try {
    isSubmitting.value = true;

    await removeSubmissionRequest(props.submissionRequest.id);

    toast.add({
      title: "Succès",
      description: "La demande de soumission a été supprimée avec succès.",
      color: "success",
    });

    emit("close", true);
  } catch {
    // The API client displays the error.
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal title="Supprimer la demande de soumission" :description="submissionRequest.title"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end', description: 'wrap-anywhere'}">
    <template #body>
      <p class="text-sm text-muted">
        Cette action est irréversible.
        <span v-if="submissionRequest._count.submissions">
          Les {{ submissionRequest._count.submissions }} réponse(s) existantes et leurs fichiers seront supprimés.
        </span>
      </p>
    </template>
    <template #footer="{close}">
      <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
