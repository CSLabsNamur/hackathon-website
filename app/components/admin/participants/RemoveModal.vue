<script setup lang="ts">
const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeParticipant} = useParticipantsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeParticipant(props.participant.id);

    toast.add({
      title: "Succès",
      description: "Le participant a été supprimé avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <!-- TODO: Add loading and closing states throughout modals -->
  <UModal :close="{onClick: () => emit('close', false)}" title="Supprimer le participant"
          description="Êtes-vous sûr de vouloir supprimer ce participant ? Cette action est irréversible."
          :ui="{content: 'max-w-2xl'}">
    <template #footer="{close}">
      <div class="flex justify-end gap-3 w-full">
        <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
        <UButton color="neutral" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
