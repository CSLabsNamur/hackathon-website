<script setup lang="ts">
const props = defineProps<{ admins: Admin[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeAdmin} = useAdminsActions();

const items = computed(() => props.admins.map((admin) => ({
  id: admin.id,
  name: `${admin.user.firstName} ${admin.user.lastName}`,
  detail: admin.user.email,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les administrateurs" resource-label="administrateur(s)"
                        description="Confirmez la suppression des comptes ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeAdmin(id, true)" @close="emit('close', $event)"/>
</template>
