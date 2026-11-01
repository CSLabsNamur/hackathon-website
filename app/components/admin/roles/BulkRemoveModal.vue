<script setup lang="ts">
const props = defineProps<{ roles: Role[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeRole} = useRolesActions();

const items = computed(() => props.roles.map((item) => ({
  id: item.id,
  name: item.name,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les rôles" resource-label="rôle(s)"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeRole(id, true)" @close="emit('close', $event)"/>
</template>
