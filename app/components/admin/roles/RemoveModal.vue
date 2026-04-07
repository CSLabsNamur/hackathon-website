<script setup lang="ts">
const props = defineProps<{ role: Role }>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {removeRole} = useRolesActions();

const isRemoving = ref(false);

async function remove() {
  try {
    isRemoving.value = true;
    await removeRole(props.role.id);

    toast.add({
      title: "Rôle supprimé",
      description: "Le rôle a été supprimé avec succès.",
      color: "success",
    });

    emit("close", true);
  } finally {
    isRemoving.value = false;
  }
}
</script>

<template>
  <UModal title="Supprimer le rôle"
          :description="`Voulez-vous vraiment supprimer le rôle ${role.name} ?`"
          :dismissible="!isRemoving"
          :close="{ disabled: isRemoving, onClick: () => emit('close', false) }"
          :ui="{ footer: 'justify-end' }">
    <template #footer="{ close }">
      <UButton color="error" :loading="isRemoving" @click="remove">Supprimer</UButton>
      <UButton color="neutral" :disabled="isRemoving" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
