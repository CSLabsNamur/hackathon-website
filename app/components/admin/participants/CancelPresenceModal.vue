<script setup lang="ts">
const props = defineProps<{
  participant: Pick<ParticipantPublicProfile, "id" | "user">
}>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();

const {updateCheckIn} = useParticipantsActions();

const {isLoading: isSubmitting, executeImmediate: cancelPresence} = useAsyncState(async () => {
  await updateCheckIn(props.participant.id, false);
  toast.add({
    title: "Présence annulée",
    description: `${props.participant.user.firstName} ${props.participant.user.lastName}`,
    color: "success",
    icon: "i-lucide-undo-2",
  });
  emit("close", true);
}, undefined, {immediate: false});
</script>

<template>
  <UModal title="Annuler la présence" description="Cette action corrige une présence enregistrée par erreur."
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{footer: 'justify-end'}">
    <template #body>
      <p>
        Annuler la présence de <strong>{{ participant.user.firstName }}
        {{ participant.user.lastName }}</strong> ?
      </p>
    </template>
    <template #footer>
      <UButton label="Annuler la présence" color="error" :loading="isSubmitting" @click="cancelPresence()"/>
      <UButton label="Retour" color="neutral" variant="outline" :disabled="isSubmitting"
               @click="emit('close', false)"/>
    </template>
  </UModal>
</template>
