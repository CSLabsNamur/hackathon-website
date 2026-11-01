<script setup lang="ts">
import type { FetchError } from "ofetch";
import type { H3Error } from "h3";

const props = defineProps<{ admins: Admin[] }>();
const emit = defineEmits<{ close: [string[] | false] }>();

const toast = useToast();
const {removeAdmin} = useAdminsActions();

const removingAdmin = ref<Admin | null>(null);
const removedIds = ref<string[]>([]);
const failures = ref<{ id: string; name: string; message: string }[]>([]);
const remainingAdmins = computed(() => props.admins.filter((admin) => !removedIds.value.includes(admin.id)));

const {isLoading: isRemoving, executeImmediate: remove} = useAsyncState(async () => {
  failures.value = [];

  for (const admin of remainingAdmins.value) {
    removingAdmin.value = admin;
    try {
      await removeAdmin(admin.id, true);
      removedIds.value.push(admin.id);
    } catch (error) {
      const apiError = error as FetchError<Pick<H3Error, "statusMessage" | "message" | "statusCode">>;
      failures.value.push({
        id: admin.id,
        name: `${admin.user.firstName} ${admin.user.lastName}`,
        message: apiError.data?.statusMessage || apiError.data?.message || "La suppression a échoué.",
      });
      if (apiError.statusCode === 401) break;
    } finally {
      removingAdmin.value = null;
    }
  }
  if (!remainingAdmins.value.length) close();
}, undefined, {immediate: false});

function close() {
  if (removedIds.value.length) {
    toast.add({
      title: "Suppression terminée",
      description: `${removedIds.value.length} administrateur(s) supprimé(s).`,
      color: "success",
    });
  }
  emit("close", removedIds.value.length ? [...removedIds.value] : false);
}
</script>

<template>
  <UModal title="Supprimer les administrateurs"
          description="Confirmez la suppression des comptes ci-dessous. Cette action est irréversible."
          :dismissible="false" :close="{disabled: isRemoving, onClick: close}" :ui="{footer: 'justify-end'}">
    <template #body>
      <div class="flex flex-col gap-4">
        <ul class="max-h-64 overflow-y-auto flex flex-col gap-1 text-sm">
          <li v-for="admin in admins" :key="admin.id" class="flex gap-2 items-center">
            <UIcon v-if="admin === removingAdmin" name="i-lucide-loader-circle"
                   :class="{'animate-spin': isRemoving}"/>
            <span :class="{'text-muted line-through': removedIds.includes(admin.id)}">
              {{ admin.user.firstName }} {{ admin.user.lastName }} ({{ admin.user.email }})
            </span>
          </li>
        </ul>
        <p v-if="isRemoving" class="text-sm text-muted">
          {{ removedIds.length }} / {{ admins.length }} administrateur(s) supprimé(s)…
        </p>
        <UAlert v-if="failures.length" color="error" variant="soft"
                title="Certains comptes n’ont pas pu être supprimés">
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
