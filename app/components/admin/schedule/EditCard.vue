<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import type { CreateScheduleItemInput, CreateScheduleItemSchema } from "#shared/schemas/schedule/create";

const props = defineProps<{
  editorSource: CreateScheduleItemInput;
  refresh: () => Promise<void>;
  selectedScheduleItem: ScheduleItem;
  sortedSchedule: Schedule;
}>();
const emit = defineEmits<{
  remove: [];
  saved: [itemId: string];
}>();

const isSaving = defineModel<boolean>("isSaving", {default: false});

const {
  cloned: formState,
  isModified: isFormModified,
  sync: syncFormState,
} = useCloned(toRef(props, "editorSource"));

const toast = useToast();
const {updateScheduleItem} = useScheduleActions();

async function onSubmit(event: FormSubmitEvent<CreateScheduleItemSchema>) {
  try {
    isSaving.value = true;

    const savedItem = await updateScheduleItem(props.selectedScheduleItem.id, event.data);

    await props.refresh();
    emit("saved", savedItem.id);

    toast.add({
      title: "Créneau mis à jour",
      description: "Le planning a été mis à jour avec succès.",
      color: "success",
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <UCard :ui="{header: 'flex items-start justify-between gap-4', footer: 'flex items-center justify-between gap-2'}">
    <template #header>
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-highlighted">
          Modifier le créneau
        </h2>
        <p class="text-sm text-muted">
          Ajustez le créneau sélectionné et enregistrez vos modifications.
        </p>
      </div>

      <UBadge color="neutral" variant="subtle">
        Modification
      </UBadge>
    </template>

    <AdminScheduleItemForm v-model="formState" v-model:is-saving="isSaving" form-id="schedule-edit-form"
                           :sorted-schedule="sortedSchedule" :selected-schedule-item="selectedScheduleItem"
                           @submit="onSubmit"/>

    <template #footer>
      <UButton color="error" variant="soft" :disabled="isSaving" @click="emit('remove')">
        Supprimer
      </UButton>

      <div class="flex gap-2">
        <UButton color="neutral" variant="soft" :disabled="isSaving || !isFormModified" @click="syncFormState">
          Annuler
        </UButton>

        <UButton type="submit" form="schedule-edit-form" icon="i-lucide-save" :loading="isSaving"
                 :disabled="!isFormModified">
          Enregistrer
        </UButton>
      </div>
    </template>
  </UCard>
</template>
