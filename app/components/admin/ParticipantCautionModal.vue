<script setup lang="ts">
const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const oldCaution = ref(props.participant.caution);

const cautionStatus = [CautionStatus.Paid, CautionStatus.NotPaid, CautionStatus.Refunded, CautionStatus.Waived];

const save = () => {
  props.participant.caution = oldCaution.value;
  emit("close", true);
};
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}" title="Modifier la caution de l'utilisateur"
          :description="`Mettre à jour le statut de la caution de ${participant.firstName} ${participant.lastName}`">
    <template #body>
      <div class="space-y-4">
        <URadioGroup v-model="oldCaution" label="Statut de la caution" :items="cautionStatus" variant="table"/>
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
