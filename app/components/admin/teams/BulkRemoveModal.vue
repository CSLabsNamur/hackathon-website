<script setup lang="ts">
const props = defineProps<{ teams: AdminTeam[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeTeam} = useTeamsActions();

const items = computed(() => props.teams.map((item) => ({
  id: item.id,
  name: item.name,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les équipes" resource-label="équipe(s)"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeTeam(id, true)" @close="emit('close', $event)"/>
</template>
