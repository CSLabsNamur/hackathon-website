<script setup lang="ts">
const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateCaution} = useParticipantsActions();

const isSubmitting = ref(false);

const {cloned: newCaution, isModified} = useCloned(props.participant.caution);

const cautionStatus = [CautionStatus.PAID, CautionStatus.NOT_PAID, CautionStatus.REFUNDED, CautionStatus.WAIVED];

const save = async () => {
  if (isModified) {
    try {
      isSubmitting.value = true;

      await updateCaution(props.participant.id, newCaution.value);

      toast.add({
        title: "Caution mise à jour",
        description: "Le statut de la caution a été mis à jour avec succès.",
        color: "success",
      });
    } finally {
      isSubmitting.value = false;
    }
  }
  emit("close", true);
};
</script>

<template>
  <UModal title="Modifier la caution de l'utilisateur"
          :description="`Mettre à jour le statut de la caution de ${participant.user.firstName} ${participant.user.lastName}`"
          :dismissible="!isSubmitting" :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-xl', footer: 'justify-end'}">
    <template #body>
      <div class="space-y-4">
        <URadioGroup v-model="newCaution" label="Statut de la caution" :items="cautionStatus" variant="table"/>
      </div>
    </template>
    <template #footer="{close}">
      <div class="flex justify-end space-x-2">
        <UButton :loading="isSubmitting" @click="save">Enregistrer</UButton>
        <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
