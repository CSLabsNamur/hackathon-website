<script setup lang="ts">
import { cautionStatusTranslateMap } from "#shared/utils/types";

const props = defineProps<{ participant: Participant }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {updateCaution} = useParticipantsActions();
const {isSuperAdmin} = await useCurrentAdmin();

const isSubmitting = ref(false);

const {cloned: newCaution, isModified} = useCloned(props.participant.caution);

// NOT_PAID -> PAID/WAIVED, PAID -> REFUNDED, WAIVED -> NOT_PAID, REFUNDED -> PAID. Any other transition is forbidden for non-super-admins.
const allowedStatuses = isSuperAdmin.value ? Object.values(CautionStatus) : {
  [CautionStatus.NOT_PAID]: [CautionStatus.PAID, CautionStatus.WAIVED],
  [CautionStatus.PAID]: [CautionStatus.REFUNDED],
  [CautionStatus.WAIVED]: [CautionStatus.NOT_PAID],
  [CautionStatus.REFUNDED]: [CautionStatus.PAID],
}[props.participant.caution] || [];

const cautionStatus = allowedStatuses.map((status) => ({
  label: cautionStatusTranslateMap[status],
  value: status,
}));

const save = async () => {
  if (isModified.value) {
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
      <UButton :loading="isSubmitting" :disabled="!isModified" @click="save">Enregistrer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
