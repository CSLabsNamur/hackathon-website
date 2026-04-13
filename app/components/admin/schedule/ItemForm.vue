<script setup lang="ts">
import type { FormError } from "@nuxt/ui";
import type { FormErrorEvent, FormSubmitEvent } from "#ui/types";
import scheduleSchema, {
  type CreateScheduleItemInput,
  type CreateScheduleItemSchema,
} from "#shared/schemas/schedule/create";
import { buildSuggestedScheduleDateString } from "~/utils/schedule";

const props = defineProps<{
  formId: string;
  sortedSchedule: Schedule;
  selectedScheduleItem?: ScheduleItem | null;
}>();
const emit = defineEmits<{
  submit: [event: FormSubmitEvent<CreateScheduleItemSchema>];
}>();

const formState = defineModel<CreateScheduleItemInput>({required: true});
const isSaving = defineModel<boolean>("isSaving", {required: true});

const dayjs = useDayjs();
const {data: settings} = await useSettings();

const suggestedDateString = computed(() =>
    buildSuggestedScheduleDateString(formState.value.startTime, formState.value.endTime),
);

function applySuggestedDateString() {
  if (!suggestedDateString.value) return;
  formState.value.dateString = suggestedDateString.value;
}

const duplicateTitle = computed(() => {
  const title = formState.value.title?.trim().toLocaleLowerCase();
  if (!title) return null;

  return props.sortedSchedule.find((item) =>
    item.id !== props.selectedScheduleItem?.id &&
    item.title.trim().toLocaleLowerCase() === title,
  ) ?? null;
});

const overlappingSpecialItem = computed(() => {
  if (!formState.value.special) return null;

  const start = dayjs(formState.value.startTime);
  const end = dayjs(formState.value.endTime);
  if (!start.isValid() || !end.isValid() || !start.isBefore(end)) return null;

  return props.sortedSchedule.find((item) =>
    item.id !== props.selectedScheduleItem?.id &&
    item.special &&
    dayjs(item.startTime).isBefore(end) &&
    dayjs(item.endTime).isAfter(start),
  ) ?? null;
});

function validateScheduleForm(state: Partial<CreateScheduleItemInput>): FormError[] {
  const errors: FormError[] = [];

  const duplicate = duplicateTitle.value;
  if (duplicate && state.title) {
    errors.push({
      name: "title",
      message: `Un créneau nommé "${duplicate.title}" existe déjà.`,
    });
  }

  const overlappingItem = overlappingSpecialItem.value;
  if (overlappingItem && state.special) {
    errors.push({
      name: "special",
      message: `Ce temps fort chevauche déjà "${overlappingItem.title}".`,
    });
  }

  return errors;
}

function onSubmit(event: FormSubmitEvent<CreateScheduleItemSchema>) {
  emit("submit", event);
}

function onError(event: FormErrorEvent) {
  const firstErrorId = event.errors[0]?.id;
  if (!firstErrorId) return;

  const element = document.getElementById(firstErrorId);
  element?.focus();
  element?.scrollIntoView({behavior: "smooth", block: "center"});
}
</script>

<template>
  <UForm :id="formId" :schema="scheduleSchema" :state="formState" :validate="validateScheduleForm"
         :disabled="isSaving" class="grid gap-4" @submit="onSubmit" @error="onError">
    <UAlert v-if="duplicateTitle" color="warning" variant="soft" icon="i-lucide-circle-alert"
            :title="`Titre déjà utilisé par '${duplicateTitle.title}'`"
            description="Choisissez un intitulé distinct pour éviter un conflit d'enregistrement."/>

    <UAlert v-if="overlappingSpecialItem" color="warning" variant="soft" icon="i-lucide-triangle-alert"
            :title="`Chevauchement avec '${overlappingSpecialItem.title}'`"
            description="Deux temps forts spéciaux ne peuvent pas se superposer."/>

    <UFormField label="Titre" name="title" required>
      <UInput v-model="formState.title" icon="i-lucide-type" class="w-full"
              placeholder="Cérémonie d'ouverture"/>
    </UFormField>

    <UFormField label="Date affichée" name="dateString" required>
      <UInput v-model="formState.dateString" icon="i-lucide-calendar-days" class="w-full"
              placeholder="Vendredi 18h00"/>
      <template #hint>
        <UButton v-if="suggestedDateString" type="button" variant="link" color="neutral"
                 class="px-0 text-xs" :disabled="isSaving"
                 @click="applySuggestedDateString">
          Utiliser "{{ suggestedDateString }}"
        </UButton>
      </template>
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea v-model="formState.description" class="w-full" :rows="4"
                 placeholder="Ce qui se passe pendant ce créneau."/>
    </UFormField>

    <UFormField label="Début" name="startTime" required>
      <UInput v-model="formState.startTime" type="datetime-local" icon="i-lucide-clock-3" class="w-full"
              step="300" :min="settings?.event.startDate" :max="settings?.event.endDate"/>
    </UFormField>

    <UFormField label="Fin" name="endTime" required>
      <UInput v-model="formState.endTime" type="datetime-local" icon="i-lucide-clock-4" class="w-full"
              step="300" :min="settings?.event.startDate" :max="settings?.event.endDate"/>
    </UFormField>

    <UFormField label="Icône" name="icon">
      <LazyIconPicker v-model="formState.icon" :collections="['lucide']" :disabled="isSaving"/>
    </UFormField>

    <UFormField name="special">
      <UCheckbox v-model="formState.special" label="Marquer ce créneau comme temps fort"
                 description="Les temps forts sont mis en avant dans le tableau de bord participant et ne peuvent pas se chevaucher."/>
    </UFormField>
  </UForm>
</template>
