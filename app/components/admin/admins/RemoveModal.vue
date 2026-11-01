<script setup lang="ts">
const props = defineProps<{ admin: Admin }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeAdmin} = useAdminsActions();

const {isLoading: isRemoving, executeImmediate: remove} = useAsyncState(async () => {
  await removeAdmin(props.admin.id);
  toast.add({
    title: "Administrateur supprimé",
    description: "Le compte administrateur a été supprimé.",
    color: "success",
  });
  emit("close", true);
}, undefined, {immediate: false});
</script>

<template>
  <UModal title="Supprimer l'administrateur"
          :description="`Voulez-vous vraiment supprimer le compte de ${admin.user.firstName} ${admin.user.lastName} (${admin.user.email}) ? Cette action est irréversible.`"
          :dismissible="!isRemoving" :close="{disabled: isRemoving, onClick: () => emit('close', false)}"
          :ui="{footer: 'justify-end'}">
    <template #footer>
      <UButton color="error" :loading="isRemoving" @click="remove()">Supprimer</UButton>
      <UButton color="neutral" :disabled="isRemoving" @click="emit('close', false)">Annuler</UButton>
    </template>
  </UModal>
</template>
