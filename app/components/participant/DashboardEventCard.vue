<script setup lang="ts">
import { getEventDirectionsUrl } from "#shared/utils/settings";

const {data: settings} = await useSettings();
const {copyWithToast} = useCopyWithToast();

const discordLink = computed(() => settings.value?.socialLinks.find((link) => link.type === "DISCORD"));
const address = computed(() => [settings.value?.event.locationName, settings.value?.event.locationAddress]
    .filter(Boolean).join(", "),
);
const directionsUrl = computed(() => getEventDirectionsUrl(settings.value?.event.locationAddress));
const hasContact = computed(() => discordLink.value || settings.value?.website.contactEmail);

const copyAddress = () => {
  if (!address.value) return;
  copyWithToast(address.value, {title: "Adresse copiée"});
};
</script>

<template>
  <UCard v-if="address || hasContact">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <h2 class="text-lg font-semibold text-highlighted">Infos pratiques</h2>
        <UButton to="/participant/support" color="neutral" variant="ghost" size="sm"
                 trailing-icon="i-lucide-arrow-right" aria-label="Voir l'aide et les infos pratiques"/>
      </div>
    </template>

    <div class="grid gap-5">
      <div v-if="address" class="grid gap-3">
        <div class="flex gap-3">
          <UIcon name="i-lucide-map-pin" class="mt-0.5 size-5 shrink-0 text-muted"/>
          <div class="min-w-0 text-sm wrap-anywhere">
            <p class="font-medium text-highlighted">{{ settings?.event.locationName }}</p>
            <p class="text-muted">{{ settings?.event.locationAddress }}</p>
          </div>
        </div>
        <div class="flex gap-2">
          <UButton v-if="directionsUrl" :to="directionsUrl" target="_blank" size="sm" icon="i-lucide-navigation">
            Itinéraire
          </UButton>
          <UButton color="neutral" variant="soft" size="sm" icon="i-lucide-copy" @click="copyAddress">
            Copier l'adresse
          </UButton>
        </div>
      </div>

      <div v-if="hasContact" class="grid gap-3">
        <h3 class="text-sm font-medium text-highlighted">Contacter l'organisation</h3>
        <div class="flex flex-wrap gap-2">
          <UButton v-if="discordLink" :to="discordLink.url" :icon="discordLink.icon" target="_blank"
                   color="neutral" variant="soft" size="sm">
            {{ discordLink.label }}
          </UButton>
          <UButton v-if="settings?.website.contactEmail" :to="`mailto:${settings.website.contactEmail}`"
                   color="neutral" variant="soft" size="sm" icon="i-lucide-mail">
            E-mail
          </UButton>
        </div>
      </div>
    </div>
  </UCard>
</template>
