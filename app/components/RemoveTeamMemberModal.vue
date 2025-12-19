<script setup lang="ts">
const props = defineProps<{participant: Participant | ParticipantWithoutRelations}>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const actions = useCurrentParticipantActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    //// Remove member from team
    //const team = teams.value.find(t => t.id === props.participant.team);
    //if (team) {
    //  team.members = team.members.filter(m => m !== props.participant.id);
    //}
    //props.participant.team = null;

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
          description="Êtes-vous sûr de vouloir retirer ce membre de votre équipe ? Cette action ne peut pas être annulée."
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
