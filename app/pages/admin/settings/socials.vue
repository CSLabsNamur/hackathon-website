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

const canAddSocialLink = computed(() => {
  const usedTypes = new Set(state.value?.socialLinks.map((link) => link.type) ?? []);
  return SETTINGS_SOCIAL_LINK_TYPES.some((type) => !usedTypes.has(type));
});

function getSocialTypeItems(index: number) {
  const currentType = state.value?.socialLinks[index]?.type;
  const usedTypes = new Set(state.value?.socialLinks
      .map((link) => link.type)
      .filter((type) => type !== currentType) ?? []);

  return SETTINGS_SOCIAL_LINK_TYPES.map((type) => ({
    label: settingsSocialLinkTypeLabels[type],
    value: type,
    disabled: usedTypes.has(type),
  }));
}

function addSocialLink() {
  if (!state.value || !canAddSocialLink.value) return;

  const usedTypes = new Set(state.value.socialLinks.map((link) => link.type));
  const type = SETTINGS_SOCIAL_LINK_TYPES.find((candidate) => !usedTypes.has(candidate));
  if (!type) return;

  const sortOrder = Math.max(0, ...state.value.socialLinks.map((link) => link.sortOrder)) + 10;
  state.value.socialLinks.push({
    type,
    label: settingsSocialLinkTypeLabels[type],
    icon: "i-lucide-link",
    url: "https://example.com",
    visible: false,
    sortOrder,
  });
}

function removeSocialLink(index: number) {
  if (!state.value) return;

  state.value.socialLinks.splice(index, 1);
}

function onSocialTypeChange(index: number, type: string) {
  if (!(SETTINGS_SOCIAL_LINK_TYPES as readonly string[]).includes(type)) return;

  const link = state.value?.socialLinks[index];
  if (!link) return;

  link.type = type as typeof SETTINGS_SOCIAL_LINK_TYPES[number];
  link.label = settingsSocialLinkTypeLabels[link.type];
}
</script>

<template>
  <UForm v-if="state" id="settings-socials-form" :schema :state :disabled="isSaving || !canUpdateSettings"
         class="grid gap-6" @submit="saveSettings" @error="onError">
    <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex justify-end gap-2'}">
      <template #header>
        <div class="flex flex-col gap-1">
          <h2 class="text-lg font-semibold text-highlighted">Réseaux sociaux</h2>
          <p class="text-sm text-muted">
            Ces liens sont utilisés dans le footer, les appels à l'action et les pages d'information publiques.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UBadge v-if="!canUpdateSettings" color="neutral" variant="soft">Lecture seule</UBadge>
          <UButton type="button" icon="i-lucide-plus" variant="soft" size="sm"
                   :disabled="!canUpdateSettings || !canAddSocialLink || isSaving" @click="addSocialLink">
            Ajouter
          </UButton>
        </div>
      </template>

      <div class="grid gap-4">
        <UCard v-for="(link, index) in state.socialLinks" :key="link.id || link.type" variant="subtle"
               :ui="{header: 'flex items-center justify-between gap-3'}">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon :name="link.icon" class="size-5 text-primary"/>
              <span class="font-medium text-highlighted">{{ link.label }}</span>
              <UBadge v-if="!link.visible" color="neutral" variant="soft">Masqué</UBadge>
            </div>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="sm"
                     :disabled="!canUpdateSettings || isSaving" :aria-label="`Supprimer le lien ${link.label}`"
                     @click="removeSocialLink(index)"/>
          </template>

          <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
            <UFormField label="Type" :name="`socialLinks.${index}.type`" required>
              <USelectMenu :model-value="link.type" :items="getSocialTypeItems(index)" value-key="value" class="w-full"
                           @update:model-value="onSocialTypeChange(index, $event)"/>
            </UFormField>

            <UFormField label="Libellé" :name="`socialLinks.${index}.label`" required>
              <UInput v-model="link.label" icon="i-lucide-type" class="w-full"/>
            </UFormField>

            <UFormField label="Icône" :name="`socialLinks.${index}.icon`" required>
              <UInput v-model="link.icon" :icon="state.socialLinks[index]?.icon" class="w-full"/>
            </UFormField>

            <UFormField label="Ordre" :name="`socialLinks.${index}.sortOrder`" required>
              <UInputNumber v-model="link.sortOrder" :min="0" :max="1000" class="w-full"/>
            </UFormField>

            <UFormField label="URL" :name="`socialLinks.${index}.url`" required class="md:col-span-2">
              <UInput v-model="link.url" icon="i-lucide-link" class="w-full"/>
            </UFormField>

            <UFormField :name="`socialLinks.${index}.visible`" class="md:col-span-2">
              <UCheckbox v-model="link.visible" label="Afficher ce lien publiquement"/>
            </UFormField>
          </div>
        </UCard>

        <UEmpty v-if="state.socialLinks.length === 0" title="Aucun lien social"
                description="Ajoutez un lien pour l'afficher sur le site public." icon="i-lucide-share-2"/>
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
    <USkeleton class="h-6 w-48"/>
    <USkeleton v-for="n in 4" :key="n" class="h-24 w-full"/>
  </UCard>
  <UAlert v-else color="error" variant="soft" icon="i-lucide-alert-circle"
          title="Impossible de charger les paramètres"
          :description="error?.statusMessage || error?.message || 'Vérifiez que la base de données a bien été initialisée.'"/>
</template>
