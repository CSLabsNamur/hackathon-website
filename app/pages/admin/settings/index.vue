<script setup lang="ts">
definePageMeta({
  requiredPermissions: ["settings.read"],
});

const {data: currentAdmin} = await useCurrentAdmin();
const {can} = useAbility(currentAdmin);
const {
  schema,
  status,
  error,
  state,
  isModified,
  isSaving,
  resetSettings,
  saveSettings,
  onError,
} = await useAdminSettingsForm();

const canUpdateSettings = computed(() => can("update", "Settings"));
</script>

<template>
  <UForm v-if="state" id="settings-site-form" :schema :state :disabled="isSaving || !canUpdateSettings"
         class="grid gap-6" @submit="saveSettings" @error="onError">
    <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex justify-end gap-2'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Contacts et support</h2>
          <p class="text-sm text-muted">
            Gérez les adresses publiques de contact et le point d'entrée pour les signalements techniques.
          </p>
        </div>
        <LazyUBadge v-if="!canUpdateSettings" color="neutral" variant="soft">Lecture seule</LazyUBadge>
      </template>

      <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
        <UFormField label="Email de contact" name="website.contactEmail" required>
          <UInput v-model="state.website.contactEmail" icon="i-lucide-at-sign" type="email" class="w-full"/>
        </UFormField>

        <UFormField label="Email support / bugs" name="website.bugReportEmail" required>
          <UInput v-model="state.website.bugReportEmail" icon="i-lucide-bug" type="email" class="w-full"/>
        </UFormField>

        <UFormField label="Webhook de bug report" name="website.bugReportWebhookUrl"
                    description="Webhook Discord pour communiquer les erreurs ou rapports de bug. (Optionnel)"
                    class="md:col-span-2">
          <UInput v-model="state.website.bugReportWebhookUrl" icon="i-lucide-webhook" class="w-full"/>
        </UFormField>
      </div>

      <template #footer>
        <UButton color="neutral" variant="soft" :disabled="isSaving || !isModified" @click="resetSettings">
          Annuler
        </UButton>
        <UButton type="submit" icon="i-lucide-save" :loading="isSaving" :disabled="!canUpdateSettings || !isModified">
          Enregistrer
        </UButton>
      </template>
    </UCard>
  </UForm>
  <UCard v-else-if="status === 'pending'" :ui="{body: 'grid gap-4'}">
    <LazyUSkeleton class="h-6 w-48"/>
    <LazyUSkeleton v-for="n in 3" :key="n" class="h-10 w-full"/>
  </UCard>
  <LazyUAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle" title="Impossible de charger les paramètres"
          :description="error?.statusMessage || error?.message || 'Vérifiez que la base de données a bien été initialisée.'"/>
</template>
