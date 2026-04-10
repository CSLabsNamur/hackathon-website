<script setup lang="ts">
const props = defineProps<{ resource: AdminExportResource }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const {getExportSchema, exportResource} = useAdminExportsActions();

const [isSubmitting, toggleSubmitting] = useToggle(false);

const format = ref<AdminExportFormat>("csv");
const selectedColumnIds = ref<string[]>([]);

const formatItems = ADMIN_EXPORT_FORMATS.map((value) => ({
  label: ADMIN_EXPORT_FORMAT_LABELS[value],
  value,
}));

const getAllColumnIds = (schema: AdminExportSchemaDefinition) => schema.columns.map((column) => column.id);
const getDefaultSelectedColumnIds = (schema: AdminExportSchemaDefinition) => {
  const defaultColumnIds = schema.columns
      .filter((column) => column.enabledByDefault)
      .map((column) => column.id);

  return defaultColumnIds.length ? defaultColumnIds : getAllColumnIds(schema);
};
const selectedCount = computed(() => selectedColumnIds.value.length);

const {
  state: schema,
  isLoading,
  error: loadError,
  execute: loadSchema,
} = useAsyncState(() => getExportSchema(props.resource), null, {
  immediate: false,
  onSuccess: (schema) => {
    if (!schema) return;
    selectedColumnIds.value = getDefaultSelectedColumnIds(schema);
  },
  onError: () => {
    selectedColumnIds.value = [];
  },
});

const canSubmit = computed(() => Boolean(schema.value) && selectedCount.value > 0 && !isLoading.value && !isSubmitting.value && !loadError.value);

const applyDefaultSelection = () => {
  if (!schema.value) return;
  selectedColumnIds.value = getDefaultSelectedColumnIds(schema.value);
};

const selectAllColumns = () => {
  if (!schema.value) return;
  selectedColumnIds.value = getAllColumnIds(schema.value);
};

const toggleColumn = (columnId: string, nextValue: boolean) => {
  selectedColumnIds.value = nextValue
      ? [...selectedColumnIds.value, columnId]
      : selectedColumnIds.value.filter((id) => id !== columnId);
};

const onSubmit = async () => {
  if (!canSubmit.value) return;

  try {
    toggleSubmitting(true);

    const {blob, filename} = await exportResource(props.resource, {
      format: format.value,
      columnIds: selectedColumnIds.value,
    });

    downloadBlob(blob, filename);
    toast.add({
      title: "Export prêt",
      description: "Le fichier a été téléchargé.",
      color: "success",
    });

    emit("close", true);
  } finally {
    toggleSubmitting(false);
  }
};

watchImmediate(() => props.resource, async () => {
  await loadSchema();
});
</script>

<template>
  <UModal :title="schema ? `Exporter '${schema.name.toLowerCase()}'` : 'Exporter les données'"
          description="Choisissez le format et les colonnes à inclure dans l'export." :dismissible="!isSubmitting"
          :close="{disabled: isSubmitting, onClick: () => emit('close', false)}"
          :ui="{content: 'max-w-3xl', footer: 'justify-end'}">
    <template #body>
      <UContainer>
        <div v-if="isLoading" class="flex flex-col gap-4">
          <USkeleton class="h-5 w-48"/>
          <USkeleton class="h-20 w-full"/>
          <USkeleton class="h-5 w-56"/>
          <div class="grid gap-2 md:grid-cols-2">
            <USkeleton v-for="index in 8" :key="index" class="h-10 w-full"/>
          </div>
        </div>

        <div v-else-if="loadError || !schema" class="flex flex-col gap-4">
          <p class="text-sm text-muted">
            Impossible de charger le schéma d'export pour cette ressource.
          </p>
          <UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :disabled="isSubmitting"
                   @click="loadSchema()">
            Réessayer
          </UButton>
        </div>

        <div v-else class="flex flex-col gap-6">
          <div class="flex flex-col gap-3">
            <div class="text-sm font-medium">
              Format
            </div>
            <URadioGroup v-model="format" :items="formatItems" orientation="vertical" variant="table"/>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div class="text-sm font-medium">
                Colonnes
              </div>
              <div class="flex flex-wrap gap-2">
                <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-list-checks"
                         @click="applyDefaultSelection">
                  Par défaut
                </UButton>
                <UButton color="neutral" variant="outline" size="sm" icon="i-lucide-check-check"
                         @click="selectAllColumns">
                  Tout sélectionner
                </UButton>
              </div>
            </div>

            <p class="text-sm text-muted">
              {{ selectedCount }} colonne{{ selectedCount > 1 ? "s" : "" }} sélectionnée{{
                selectedCount > 1 ? "s" : ""
              }}
              sur {{ schema.columns.length }}.
            </p>

            <div class="grid max-h-96 gap-3 overflow-auto rounded-lg border border-default p-3 md:grid-cols-2">
              <UCheckbox v-for="column in schema.columns" :key="column.id"
                         :model-value="selectedColumnIds.includes(column.id)" :label="column.name"
                         :disabled="isSubmitting" @update:model-value="toggleColumn(column.id, $event === true)"/>
            </div>
          </div>
        </div>
      </UContainer>
    </template>

    <template #footer="{close}">
      <UButton :loading="isSubmitting" :disabled="!canSubmit" icon="i-lucide-download" @click="onSubmit">
        Exporter
      </UButton>
      <UButton color="neutral" :disabled="isSubmitting" @click="close">Annuler</UButton>
    </template>
  </UModal>
</template>
