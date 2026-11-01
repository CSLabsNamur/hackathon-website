<script setup lang="ts">
const props = defineProps<{ guests: Guest[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeGuest} = useGuestsActions();

const items = computed(() => props.guests.map((item) => ({
  id: item.id,
  name: item.name,
  detail: item.company ?? undefined,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les invités" resource-label="invité(s)"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeGuest(id, true)" @close="emit('close', $event)"/>
</template>
