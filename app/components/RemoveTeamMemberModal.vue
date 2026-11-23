<script setup lang="ts">
const props = defineProps<{ teamId: string, participant: CurrentParticipantTeamMember }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeMyTeamMember} = useTeamsActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeMyTeamMember(props.teamId, props.participant.id);

    toast.add({
      title: "Membre retiré",
      description: "Le membre a été retiré de l'équipe avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal title="Retirer un membre de l'équipe"
          :description="`Retirer ${participant.user.firstName} ${participant.user.lastName} de votre équipe ?`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-2xl', footer: 'justify-end'}">
    <template #footer="{close}">
      <UButton color="error" :loading="isSubmitting" @click="onSubmit">Retirer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
