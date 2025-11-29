<script setup lang="ts">
const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const {updateCaution} = useParticipantsActions();

const {cloned: newCaution, isModified} = useCloned(props.participant.caution);

const cautionStatus = [CautionStatus.PAID, CautionStatus.NOT_PAID, CautionStatus.REFUNDED, CautionStatus.WAIVED];

const save = async () => {
  if (isModified) {
    await updateCaution(props.participant.id, newCaution.value);
  }
  emit("close", true);
};
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}" title="Modifier la caution de l'utilisateur"
          :description="`Mettre à jour le statut de la caution de ${participant.firstName} ${participant.lastName}`">
    <template #body>
      <div class="space-y-4">
        <URadioGroup v-model="newCaution" label="Statut de la caution" :items="cautionStatus" variant="table"/>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton @click="save">Enregistrer</UButton>
        <UButton color="neutral" @click="emit('close', false)">Annuler</UButton>
      </div>
    </template>
  </UModal>
</template>
