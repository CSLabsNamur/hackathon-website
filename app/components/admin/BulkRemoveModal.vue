<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { H3Error } from "h3";

const props = defineProps<{
  items: {id: string; name: string; detail?: string}[];
  title: string;
  description: string;
  resourceLabel: string;
  remove: (id: string) => Promise<unknown>;
}>();
const emit = defineEmits<{ close: [string[] | false] }>();

const toast = useToast();

const removingId = ref<string | null>(null);
const removedIds = ref<string[]>([]);
const failures = ref<{ id: string; name: string; message: string }[]>([]);
const remainingItems = computed(() => props.items.filter((item) => !removedIds.value.includes(item.id)));

const {isLoading: isRemoving, executeImmediate: remove} = useAsyncState(async () => {
  failures.value = [];

  for (const item of remainingItems.value) {
    removingId.value = item.id;
    try {
      await props.remove(item.id);
      removedIds.value.push(item.id);
    } catch (error) {
      const apiError = error as FetchError<Pick<H3Error, "statusMessage" | "message" | "statusCode">>;
      failures.value.push({
        id: item.id,
        name: item.name,
        message: apiError.data?.statusMessage || apiError.data?.message || "La suppression a échoué.",
      });
      if (apiError.statusCode === 401) break;
    } finally {
      removingId.value = null;
    }
  }
  if (!remainingItems.value.length) close();
}, undefined, {immediate: false});

function close() {
  if (removedIds.value.length) {
    toast.add({
      title: "Suppression terminée",
      description: `${removedIds.value.length} ${props.resourceLabel} supprimé(s).`,
      color: "success",
    });
  }
  emit("close", removedIds.value.length ? [...removedIds.value] : false);
}
</script>

<template>
  <UModal :title :description
          :dismissible="false" :close="{disabled: isRemoving, onClick: close}" :ui="{footer: 'justify-end'}">
    <template #body>
      <div class="flex flex-col gap-4">
        <ul class="max-h-64 overflow-y-auto flex flex-col gap-1 text-sm">
          <li v-for="item in items" :key="item.id" class="flex gap-2 items-center">
            <UIcon v-if="item.id === removingId" name="i-lucide-loader-circle"
                   :class="{'animate-spin': isRemoving}"/>
            <span :class="{'text-muted line-through': removedIds.includes(item.id)}">
              {{ item.name }}<template v-if="item.detail"> ({{ item.detail }})</template>
            </span>
          </li>
        </ul>
        <p v-if="isRemoving" class="text-sm text-muted">
          {{ removedIds.length }} / {{ items.length }} {{ resourceLabel }} supprimé(s)…
        </p>
        <UAlert v-if="failures.length" color="error" variant="soft"
                title="Certains éléments n’ont pas pu être supprimés">
          <template #description>
            <ul class="space-y-1">
              <li v-for="failure in failures" :key="failure.id">{{ failure.name }} : {{ failure.message }}</li>
            </ul>
          </template>
        </UAlert>
      </div>
    </template>

    <template #footer>
      <UButton color="error" :loading="isRemoving" @click="remove()">
        {{ failures.length ? "Réessayer" : "Supprimer" }}
      </UButton>
      <UButton color="neutral" :disabled="isRemoving" @click="close">
        {{ removedIds.length ? "Fermer" : "Annuler" }}
      </UButton>
    </template>
  </UModal>
</template>
