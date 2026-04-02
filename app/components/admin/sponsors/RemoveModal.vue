<script setup lang="ts">
const props = defineProps<{ sponsor: Sponsor }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeSponsor} = useSponsorsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeSponsor(props.sponsor.id);

    toast.add({
      title: "Succès",
      description: "Le sponsor a été supprimé avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal title="Supprimer le sponsor"
          description="Êtes-vous sûr de vouloir supprimer ce sponsor ? Cette action est irréversible."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #footer="{ close }">
      <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
