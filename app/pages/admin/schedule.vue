<script setup lang="ts">
import type { TimelineItem } from "@nuxt/ui";
import type { CreateScheduleItemInput } from "#shared/schemas/schedule/create";
import RemoveModal from "~/components/admin/schedule/RemoveModal.vue";
import { createEmptyScheduleFormState, scheduleItemToFormState } from "~/utils/schedule";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Planning",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["schedule.update"],
});

type TimelineScheduleItem = TimelineItem & {
  value: string;
  scheduleItem: ScheduleItem;
};

const dayjs = useDayjs();
const overlay = useOverlay();
const {setActions} = useDashboardNavbar();

const {data: settings} = await useSettings();
const {status, data: schedule, error, refresh} = await useSchedule({lazy: true});

const removeModal = overlay.create(RemoveModal);

const isSaving = ref(false);
// "new" -> creation mode, any other value -> edit mode with the corresponding item selected
const editingItemId = ref<string>("new");
// When creating a new item, we still want a sensible default (start time / icon).
// We use an existing item as a "base": the new form defaults to starting right after that base item's `endTime`.
const createBaseItemId = ref<string | null>(null);

function compareScheduleItems(a: ScheduleItem, b: ScheduleItem) {
  const startDiff = dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf();
  if (startDiff !== 0) return startDiff;

  const endDiff = dayjs(a.endTime).valueOf() - dayjs(b.endTime).valueOf();
  if (endDiff !== 0) return endDiff;

  return a.title.localeCompare(b.title, "fr");
}

const sortedSchedule = computed(() =>
    [...(schedule.value ?? [])].sort(compareScheduleItems),
);

const currentScheduleItemId = computed(() => {
  const currentTime = dayjs();

  return sortedSchedule.value.find((item) =>
      currentTime.isSameOrAfter(dayjs(item.startTime)) && currentTime.isBefore(dayjs(item.endTime)),
  )?.id ?? null;
});

const selectedScheduleItem = computed(() =>
    editingItemId.value === "new"
        ? null
        : sortedSchedule.value.find((item) => item.id === editingItemId.value) ?? null,
);

const createBaseItem = computed(() =>
    sortedSchedule.value.find((item) => item.id === createBaseItemId.value) ?? null,
);

const editorSource = computed<CreateScheduleItemInput>(() =>
    selectedScheduleItem.value
        ? scheduleItemToFormState(selectedScheduleItem.value)
        : createEmptyScheduleFormState(createBaseItem.value, settings.value?.event.startDate ?? null),
);

const isCreating = computed(() => !selectedScheduleItem.value);

const timelineItems = computed<TimelineScheduleItem[]>(() =>
    sortedSchedule.value.map((item) => ({
      value: item.id,
      title: item.title,
      description: item.description,
      date: item.dateString,
      icon: item.icon ?? "i-lucide-calendar",
      scheduleItem: item,
    })),
);

// We want to ensure the UI never points to an item that disappeared after data change, and that creation mode has a valid "base" item to derive defaults from.
watchImmediate(sortedSchedule, (items: ScheduleItem[]) => {
  if (items.length === 0) {
    editingItemId.value = "new";
    createBaseItemId.value = null;
    return;
  }

  const itemIds = new Set(items.map(item => item.id));

  // Validate and reset the currently edited item if it no longer exists
  if (editingItemId.value !== "new" && !itemIds.has(editingItemId.value)) {
    editingItemId.value = items[0]!.id;
  }

  // Ensure the creation base is always valid
  if (!createBaseItemId.value || !itemIds.has(createBaseItemId.value)) {
    createBaseItemId.value = editingItemId.value === "new" ? items[0]!.id : editingItemId.value;
  }
});

// Selecting an item puts us in edit mode and also updates the base for later creation
function selectScheduleItem(itemId: string) {
  editingItemId.value = itemId;
  createBaseItemId.value = itemId;
}

// Default to inserting after the currently selected item, or last item if none
function startCreating() {
  createBaseItemId.value = selectedScheduleItem.value?.id ?? sortedSchedule.value.at(-1)?.id ?? null;
  editingItemId.value = "new";
}

// Go back to the base item when possible, otherwise fall back to the first item
function cancelCreating() {
  const targetId = createBaseItemId.value ?? sortedSchedule.value[0]?.id ?? null;
  editingItemId.value = targetId ?? "new";
}

function selectSavedItem(itemId: string) {
  editingItemId.value = itemId;
  createBaseItemId.value = itemId;
}

async function openRemoveModal() {
  if (!selectedScheduleItem.value) return;

  const deletedItemId = selectedScheduleItem.value.id;
  const deletedItemIndex = sortedSchedule.value.findIndex((item) => item.id === deletedItemId);
  const result = await removeModal.open({scheduleItem: selectedScheduleItem.value});
  if (!result) return;

  await refresh();

  const nextItem = sortedSchedule.value[deletedItemIndex] ?? sortedSchedule.value[deletedItemIndex - 1];
  editingItemId.value = nextItem?.id ?? "new";
  createBaseItemId.value = nextItem?.id ?? null;
}

setActions(computed(() => [{
  label: "Nouveau créneau",
  icon: "i-lucide-plus",
  disabled: isSaving.value,
  onClick: startCreating,
}]));
</script>

<template>
  <UContainer>
    <UAlert v-if="status === 'error'" color="error" variant="soft" icon="i-lucide-alert-circle"
            title="Impossible de charger le planning"
            :description="error?.statusMessage || error?.message || 'Réessayez dans quelques instants.'"/>

    <!-- Keep the existing editor mounted during refreshes, otherwise local card state
         like `isSaving` can be lost when the skeleton temporarily replaces the page. -->
    <div v-else-if="(status === 'pending' || status === 'idle') && !schedule"
         class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <UCard :ui="{body: 'grid gap-4'}">
        <USkeleton class="h-6 w-40"/>
        <USkeleton v-for="n in 5" :key="`timeline-skeleton-${n}`" class="h-28 w-full"/>
      </UCard>

      <div class="sticky top-6 self-start">
        <UCard :ui="{body: 'grid gap-4'}">
          <USkeleton class="h-6 w-32"/>
          <USkeleton class="h-28 w-full"/>
          <USkeleton v-for="n in 6" :key="`form-skeleton-${n}`" class="h-10 w-full"/>
        </UCard>
      </div>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <UCard>
        <template #header>
          <div class="flex flex-col gap-1">
            <h2 class="text-lg font-semibold text-highlighted">Ligne du temps</h2>
            <p class="text-sm text-muted">
              Le site public et cet éditeur affichent automatiquement les créneaux par heure de début.
            </p>
          </div>
        </template>

        <UTimeline v-if="timelineItems.length > 0" :items="timelineItems"
                   :model-value="editingItemId === 'new' ? undefined : editingItemId" value-key="value"
                   @select="(_, item) => selectScheduleItem(item.value)">
          <template #wrapper="{item}">
            <ScheduleFullCard :item :editing-item-id :current-schedule-item-id/>
          </template>
        </UTimeline>
        <UEmpty v-else title="Aucun créneau programmé"
                description="Ajoutez le premier élément du planning pour commencer." icon="i-lucide-calendar-plus"/>
      </UCard>

      <div v-auto-animate="{duration: 140}" class="sticky top-0 self-start">
        <AdminScheduleCreateCard v-if="isCreating" v-model:is-saving="isSaving" :editor-source
                                 :sorted-schedule="sortedSchedule" :refresh @cancel="cancelCreating"
                                 @created="selectSavedItem"/>
        <AdminScheduleEditCard v-else-if="selectedScheduleItem" v-model:is-saving="isSaving" :editor-source
                               :selected-schedule-item="selectedScheduleItem" :sorted-schedule="sortedSchedule" :refresh
                               @remove="openRemoveModal" @saved="selectSavedItem"/>
        <UCard v-else>
          <UEmpty title="Créneau introuvable"
                  description="Sélectionnez un élément dans la ligne du temps pour reprendre l'édition."
                  icon="i-lucide-calendar-search"/>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
