<script setup lang="ts">
const props = defineProps<{ submissionRequests: AdminSubmissionRequest[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeSubmissionRequest} = useSubmissionsRequestsActions();

const items = computed(() => props.submissionRequests.map((item) => ({
  id: item.id,
  name: item.title,
  detail: item._count.submissions ? `${item._count.submissions} réponse(s) et leurs fichiers` : undefined,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les demandes de soumission" resource-label="demande(s) de soumission"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeSubmissionRequest(id, true)" @close="emit('close', $event)"/>
</template>
