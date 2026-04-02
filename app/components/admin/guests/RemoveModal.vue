<script setup lang="ts">
import type { Guest } from "#shared/utils/types";

const props = defineProps<{ guest: Guest }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeGuest} = useGuestsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeGuest(props.guest.id);

    toast.add({
      title: "Succès",
      description: "L'invité a été supprimé avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal title="Supprimer l'invité"
          description="Êtes-vous sûr de vouloir supprimer cet invité ? Cette action est irréversible."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #footer="{close}">
      <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
