<script setup lang="ts">
import type { EventArchiveSnapshot } from "#shared/utils/eventArchives";

defineProps<{ snapshot: EventArchiveSnapshot }>();

const supabase = useSupabaseClient();
const dayjs = useDayjs();

const countLabels = {participants: "Participants", teams: "Équipes", guests: "Invités", submissions: "Soumissions"};
const sections = [
  {label: "Programme", icon: "i-lucide-calendar-days", slot: "schedule", value: "schedule"},
  {label: "Sponsors", icon: "i-lucide-handshake", slot: "sponsors", value: "sponsors"},
];

const publicUrl = (bucket: string, path: string) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
const dateTime = (value: string) => dayjs(value).tz("Europe/Brussels").format("DD/MM/YYYY HH:mm");
</script>

<template>
  <div class="grid gap-6">
    <div class="flex items-center gap-4">
      <img v-if="snapshot.logoPath" :src="publicUrl(EVENT_ASSETS_BUCKET, snapshot.logoPath)"
           alt="Logo de l'édition" class="max-h-24 max-w-40 rounded bg-default p-2 object-contain">
      <div>
        <p v-if="snapshot.slogan" class="font-medium text-highlighted">{{ snapshot.slogan }}</p>
        <p>{{ snapshot.locationName }}</p>
        <p class="text-sm text-muted">{{ snapshot.locationAddress }}</p>
      </div>
    </div>

    <dl class="grid grid-cols-2 gap-4 rounded-lg bg-elevated p-4 md:grid-cols-4">
      <div v-for="(label, key) in countLabels" :key="key">
        <dt class="text-sm text-muted">{{ label }}</dt>
        <dd class="text-2xl font-semibold text-highlighted">{{ snapshot.counts[key] }}</dd>
      </div>
    </dl>

    <UAccordion :items="sections" type="multiple">
      <template #schedule-body>
        <p v-if="!snapshot.schedule.length" class="text-sm text-muted">Aucune activité.</p>
        <div v-else class="divide-y divide-default">
          <div v-for="(item, index) in snapshot.schedule" :key="index"
               class="grid gap-1 py-4 first:pt-0 last:pb-0">
            <p class="font-medium text-highlighted">{{ item.title }}</p>
            <p class="text-sm text-muted">{{ dateTime(item.startTime) }} – {{ dateTime(item.endTime) }}</p>
            <p v-if="item.description" class="whitespace-pre-wrap text-sm">{{ item.description }}</p>
          </div>
        </div>
      </template>
      <template #sponsors-body>
        <p v-if="!snapshot.sponsors.length" class="text-sm text-muted">Aucun sponsor.</p>
        <div v-else class="divide-y divide-default">
          <div v-for="(sponsor, index) in snapshot.sponsors" :key="index"
               class="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4 py-4 first:pt-0 last:pb-0
                      sm:grid-cols-[8rem_minmax(0,1fr)]">
            <img :src="publicUrl(SPONSORS_BUCKET, sponsor.logo)" :alt="sponsor.name"
                 class="size-24 object-contain sm:size-32" loading="lazy">
            <div class="grid min-w-0 gap-2">
              <p class="font-medium text-highlighted">{{ sponsor.name }}</p>
              <p class="text-sm wrap-break-word">{{
                  richTextToPlainText(normalizeRichTextDocument(sponsor.description))
                }}</p>
              <UButton :to="sponsor.url" target="_blank" external variant="link"
                       class="justify-start whitespace-normal break-all p-0 text-left">
                {{ sponsor.url }}
              </UButton>
            </div>
          </div>
        </div>
      </template>
    </UAccordion>
  </div>
</template>
