<script setup lang="ts">
const props = defineProps<{ user: User }>();
const emit = defineEmits<{ close: [boolean] }>();

const oldCaution = ref(props.user.caution);

const cautionStatus = [CautionStatus.Paid, CautionStatus.NotPaid, CautionStatus.Refunded, CautionStatus.Waived];

const save = () => {
  props.user.caution = oldCaution.value;
  emit("close", true);
};
</script>

<template>
  <UModal :close="{onClick: () => emit('close', false)}" title="Modifier la caution de l'utilisateur"
          :description="`Mettre à jour le statut de la caution de ${user.firstName} ${user.lastName}`">
    <template #body>
      <div class="space-y-4">
        <USelect v-model="oldCaution" label="Statut de la caution" :items="cautionStatus" :ui="{content: 'min-w-fit'}"/>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end space-x-2">
        <UButton color="neutral" @click="emit('close', false)">Annuler</UButton>
        <UButton @click="save">Enregistrer</UButton>
      </div>
    </template>
  </UModal>
</template>
