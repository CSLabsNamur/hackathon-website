<script setup lang="ts">
const props = defineProps<{ participants: AdminParticipant[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeParticipant} = useParticipantsActions();

const items = computed(() => props.participants.map((item) => ({
  id: item.id,
  name: `${item.user.firstName} ${item.user.lastName}`,
  detail: item.user.email,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les participants" resource-label="participant(s)"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeParticipant(id, true)" @close="emit('close', $event)"/>
</template>
