<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import type { CreateScheduleItemInput, CreateScheduleItemSchema } from "#shared/schemas/schedule/create";

const props = defineProps<{
  editorSource: CreateScheduleItemInput;
  refresh: () => Promise<void>;
  sortedSchedule: Schedule;
}>();
const emit = defineEmits<{
  cancel: [];
  created: [itemId: string];
}>();

const isSaving = defineModel<boolean>("isSaving", {default: false});

const {
  cloned: formState,
  isModified: isFormModified,
} = useCloned(toRef(props, "editorSource"));

const toast = useToast();
const {createScheduleItem} = useScheduleActions();

async function onSubmit(event: FormSubmitEvent<CreateScheduleItemSchema>) {
  try {
    isSaving.value = true;

    const savedItem = await createScheduleItem(event.data);

    await props.refresh();
    emit("created", savedItem.id);

    toast.add({
      title: "Créneau ajouté",
      description: "Le nouveau créneau a été ajouté au planning.",
      color: "success",
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex flex-wrap justify-end gap-2'}">
    <template #header>
      <div class="grid gap-1">
        <h2 class="text-lg font-semibold text-highlighted">
          Nouveau créneau
        </h2>
        <p class="text-sm text-muted">
          Ajoutez un nouveau créneau et vérifiez immédiatement son rendu.
        </p>
      </div>

      <UBadge color="primary" variant="subtle">
        Création
      </UBadge>
    </template>

    <AdminScheduleItemForm v-model="formState" v-model:is-saving="isSaving" form-id="schedule-create-form"
                           :sorted-schedule="sortedSchedule" :selected-schedule-item="null"
                           @submit="onSubmit"/>

    <template #footer>
      <UButton color="neutral" variant="soft" :disabled="isSaving" @click="emit('cancel')">
        Annuler
      </UButton>

      <UButton type="submit" form="schedule-create-form" icon="i-lucide-save" :loading="isSaving"
               :disabled="!isFormModified">
        Créer le créneau
      </UButton>
    </template>
  </UCard>
</template>
