<script setup lang="ts">
const props = defineProps<{ scheduleItem: ScheduleItem }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeScheduleItem} = useScheduleActions();

const isSubmitting = ref(false);

async function onSubmit() {
  try {
    isSubmitting.value = true;

    await removeScheduleItem(props.scheduleItem.id);

    toast.add({
      title: "Créneau supprimé",
      description: `Le créneau "${props.scheduleItem.title}" a été retiré du planning.`,
      color: "success",
    });

    emit("close", true);
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <UModal title="Supprimer ce créneau"
          :description="`Voulez-vous vraiment supprimer le créneau ${scheduleItem.title} ? Cette action est irréversible.`"
          :dismissible="!isSubmitting"
          :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{footer: 'justify-end'}">
    <template #footer="{close}">
      <UButton color="error" :loading="isSubmitting" @click="onSubmit">Supprimer</UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
