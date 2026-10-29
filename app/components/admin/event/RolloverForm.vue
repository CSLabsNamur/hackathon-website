<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import schema, { type EventRolloverInput } from "#shared/schemas/settings/rollover";

type Edition = Pick<EventRolloverInput, "editionId" | "title" | "startDate" | "endDate" | "registrationsStartDate" | "registrationsEndDate">;

const props = defineProps<{ event: Edition; revision: string; disabled?: boolean; loading?: boolean }>();
const emit = defineEmits<{ submit: [EventRolloverInput] }>();

const dayjs = useDayjs();

const confirmOpen = ref(false);

const state = reactive({
  editionId: "",
  revision: "",
  confirmation: "",
  title: "",
  startDate: "",
  endDate: "",
  registrationsStartDate: "",
  registrationsEndDate: "",
  reviewedArchive: false,
});

watchImmediate(() => [props.event, props.revision] as const, ([event, revision]) => {
  state.editionId = event.editionId;
  state.revision = revision;
  state.title = event.title;
  state.confirmation = "";
  state.reviewedArchive = false;

  for (const field of ["startDate", "endDate", "registrationsStartDate", "registrationsEndDate"] as const) {
    state[field] = dayjs(event[field]).tz("Europe/Brussels").add(1, "year").format("YYYY-MM-DDTHH:mm");
  }
});

function submit(event: FormSubmitEvent<EventRolloverInput>) {
  if (props.disabled || props.loading) return;
  confirmOpen.value = false;
  emit("submit", event.data);
}
</script>

<template>
  <UForm id="event-rollover-form" :schema :state :disabled="disabled || loading"
         @submit="submit" @error="confirmOpen = false">
    <div class="grid gap-4 grid-cols-1 md:grid-cols-2">
      <UFormField label="Titre de la prochaine édition" name="title" required class="md:col-span-2">
        <UInput v-model="state.title" icon="i-lucide-type" class="w-full"/>
      </UFormField>
      <UFormField label="Début de l'événement" name="startDate" required>
        <UInput v-model="state.startDate" type="datetime-local" icon="i-lucide-calendar-plus" class="w-full"/>
      </UFormField>
      <UFormField label="Fin de l'événement" name="endDate" required>
        <UInput v-model="state.endDate" type="datetime-local" icon="i-lucide-calendar-minus" class="w-full"/>
      </UFormField>
      <UFormField label="Ouverture des inscriptions" name="registrationsStartDate" required>
        <UInput v-model="state.registrationsStartDate" type="datetime-local" icon="i-lucide-calendar-plus"
                class="w-full"/>
      </UFormField>
      <UFormField label="Fermeture des inscriptions" name="registrationsEndDate" required>
        <UInput v-model="state.registrationsEndDate" type="datetime-local" icon="i-lucide-calendar-minus"
                class="w-full"/>
      </UFormField>
      <p class="text-sm text-muted md:col-span-2">
        La prochaine édition démarre en mode teaser, inscriptions fermées.
        Activez-les ensuite dans les paramètres d'inscription.
      </p>
      <UFormField name="reviewedArchive" class="md:col-span-2">
        <UCheckbox v-model="state.reviewedArchive" label="J'ai vérifié le contenu de l'archive"/>
      </UFormField>
    </div>

    <div class="mt-6 flex justify-end gap-2 border-t border-default pt-4">
      <UButton color="error" icon="i-lucide-archive" :disabled="disabled || loading || !state.reviewedArchive"
               @click="confirmOpen = true">Préparer la nouvelle édition
      </UButton>
    </div>

    <UModal v-model:open="confirmOpen" title="Confirmer le changement d'édition"
            description="Les données des participants seront définitivement supprimées. Seul le contenu de l'archive sera conservé."
            :dismissible="!loading" :close="!loading" :ui="{footer: 'justify-end'}">
      <template #body>
        <UFormField :label="`Recopiez « ${event.title} » pour confirmer`" name="confirmation">
          <UInput v-model="state.confirmation" class="w-full" autocomplete="off"/>
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="soft" :disabled="loading" @click="confirmOpen = false">
          Annuler
        </UButton>
        <UButton type="submit" form="event-rollover-form" color="error" :loading="loading"
                 :disabled="state.confirmation !== event.title">
          Archiver et changer d'édition
        </UButton>
      </template>
    </UModal>
  </UForm>
</template>
