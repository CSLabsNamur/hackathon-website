<script setup lang="ts">
const props = defineProps<{ sponsors: Sponsor[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();
const {removeSponsor} = useSponsorsActions();

const items = computed(() => props.sponsors.map((item) => ({
  id: item.id,
  name: item.name,
  detail: item.url,
})));
</script>

<template>
  <AdminBulkRemoveModal :items title="Supprimer les sponsors" resource-label="sponsor(s)"
                        description="Confirmez la suppression des éléments ci-dessous. Cette action est irréversible."
                        :remove="(id) => removeSponsor(id, true)" @close="emit('close', $event)"/>
</template>
