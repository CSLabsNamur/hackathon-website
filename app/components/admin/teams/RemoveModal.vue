<script setup lang="ts">
const props = defineProps<{ team: Team }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeTeam} = useTeamsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeTeam(props.team.id);

    toast.add({
      title: "Succès",
      description: "L'équipe a été supprimée avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}" title="Supprimer l'équipe"
          description="Êtes-vous sûr de vouloir supprimer cette équipe ? Cette action est irréversible."
          :ui="{content: 'max-w-2xl'}">
    <template #footer="{close}">
      <div class="flex justify-end gap-3 w-full">
        <UButton :loading="isSubmitting" @click="onSubmit">Confirmer</UButton>
        <UButton color="neutral" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
