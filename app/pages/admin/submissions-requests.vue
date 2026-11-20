<script setup lang="ts">
import { AdminExportModal, UButton, UDropdownMenu } from "#components";
import type { DropdownMenuItem } from "@nuxt/ui";
import BulkRemoveModal from "~/components/admin/submission-request/BulkRemoveModal.vue";
import FormModal from "~/components/admin/submission-request/FormModal.vue";
import RemoveModal from "~/components/admin/submission-request/RemoveModal.vue";
import ResponsesModal from "~/components/admin/submission-request/ResponsesModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Demandes de soumission",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["submissionRequests.read"],
});

const {data, status, refresh} = await useAdminSubmissionRequests({lazy: true});
const {data: currentAdmin, isSuperAdmin} = await useCurrentAdmin();
const {can, canPermission} = useAbility(currentAdmin);

const canReadResponses = computed(() => canPermission("participants.read") && canPermission("submissionRequests.read"));
const canDelete = computed(() => can("delete", "SubmissionRequest"));

const requests = computed<AdminSubmissionRequest[] | undefined>(() => data.value?.requests);
const settings = computed(() => data.value?.settings);

const dayjs = useDayjs();
const now = useNow({scheduler: (update) => useIntervalFn(update, 30000)});
const overlay = useOverlay();
const {setActions} = useDashboardNavbar();

const formModal = overlay.create(FormModal);
const responsesModal = overlay.create(ResponsesModal);
const removeModal = overlay.create(RemoveModal);
const bulkRemoveModal = overlay.create(BulkRemoveModal);
const exportModal = overlay.create(AdminExportModal);

const typeItems = [{label: "Texte", value: "TEXT"}, {label: "Fichier", value: "FILE"}];
const scopeItems = [{label: "Individuelle", value: "participant"}, {label: "Équipe", value: "team"}];

const globalFilter = useSearchQuery();
const {sorting, columnFilters} = useTableQuery({
  sort: ["title", "deadline", "createdAt", "submissionRate"],
  filters: {type: typeItems.map(({value}) => value), scope: scopeItems.map(({value}) => value)},
});
const {rowSelection, selectedItems} = useTableSelection(requests, globalFilter, columnFilters);

const isBusy = ref(false);

useRefreshOnPageReturn(() => {
  if (!isBusy.value) return refresh();
});
watch(canDelete, (allowed) => {
  if (!allowed) rowSelection.value = {};
});
watch(canReadResponses, (allowed) => {
  if (!allowed) responsesModal.close();
  void refresh();
});

function canDeleteRequest(request: AdminSubmissionRequest) {
  return canDelete.value && (isSuperAdmin.value || !request._count.submissions);
}

async function runAction(action: () => Promise<boolean | string[] | undefined>, refreshOnChange = false) {
  if (isBusy.value) return;
  isBusy.value = true;
  try {
    const result = await action();
    const changed = Array.isArray(result) ? result.length > 0 : result === true;
    if (refreshOnChange && changed) await refresh();
  } finally {
    isBusy.value = false;
  }
}

function openForm(request?: AdminSubmissionRequest) {
  if (!settings.value || !can(request ? "update" : "create", "SubmissionRequest")) return;
  const dates = settings.value;
  return runAction(() => formModal.open({request, settings: dates}), true);
}

function getRowItems(request: AdminSubmissionRequest): DropdownMenuItem[] {
  return [
    {
      label: "Voir les réponses",
      icon: "i-lucide-inbox",
      disabled: !canReadResponses.value,
      onSelect: () => {
        if (canReadResponses.value) void runAction(() => responsesModal.open({request}));
      },
    },
    {
      label: "Modifier",
      icon: "i-lucide-pencil",
      disabled: !can("update", "SubmissionRequest") || !settings.value,
      onSelect: () => openForm(request),
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      color: "error",
      disabled: !canDeleteRequest(request),
      onSelect: () => {
        if (canDeleteRequest(request)) void runAction(() => removeModal.open({submissionRequest: request}), true);
      },
    },
  ];
}

const bulkItems = computed<DropdownMenuItem[]>(() => {
  const selection = selectedItems.value;
  const allowed = selection.length > 0 && selection.every(canDeleteRequest);
  return canDelete.value ? [{
    label: "Supprimer la sélection",
    icon: "i-lucide-trash",
    color: "error",
    disabled: !allowed || isBusy.value,
    onSelect: () => {
      if (allowed) void runAction(() => bulkRemoveModal.open({submissionRequests: [...selection]}), true);
    },
  }] : [];
});

const allColumns: NamedTableColumn<AdminSubmissionRequest>[] = [
  getSelectionColumn<AdminSubmissionRequest>(isBusy, ({title}) => `Sélectionner ${title}`, "Sélectionner les demandes"),
  {
    id: "title",
    name: "Demande",
    header: ({column}) => getColumnHeader(column, "Demande", {sort: true}),
    accessorKey: "title",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "description",
    accessorKey: "description",
    name: "Consignes",
    header: "Consignes",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "type",
    name: "Type",
    header: ({column}) => getColumnHeader(column, "Type", {filters: typeItems}),
    accessorFn: (request) => request.type === SubmissionType.TEXT ? "Texte" : request.multiple ? "Plusieurs fichiers" : "Fichier unique",
    filterFn: (row, _, value) => row.original.type === value,
  },
  {
    id: "scope",
    name: "Portée",
    header: ({column}) => getColumnHeader(column, "Portée", {filters: scopeItems}),
    accessorFn: (request) => request.teamRequest ? "Équipe" : "Individuelle",
    filterFn: (row, _, value) => row.original.teamRequest === (value === "team"),
  },
  {
    id: "deadline",
    name: "Échéance",
    header: ({column}) => getColumnHeader(column, "Échéance", {sort: true}),
    accessorKey: "deadline",
    enableGlobalFilter: false,
  },
  {
    id: "createdAt",
    name: "Création",
    header: ({column}) => getColumnHeader(column, "Création", {sort: true}),
    accessorKey: "createdAt",
    enableGlobalFilter: false,
    cell: ({row}) => dayjs(row.original.createdAt).tz("Europe/Brussels").format("DD/MM/YYYY"),
  },
  {
    id: "submissionRate",
    name: "Livrables remis",
    header: ({column}) => getColumnHeader(column, "Livrables remis", {sort: true}),
    accessorFn: ({progress}) => progress?.total ? progress.submitted / progress.total : undefined,
    enableGlobalFilter: false,
    sortUndefined: "last",
  },
  {
    id: "actions",
    name: "Actions",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => h(UDropdownMenu, {items: getRowItems(row.original), content: {align: "end"}}, () => h(UButton, {
      icon: "i-lucide-ellipsis-vertical",
      color: "neutral",
      variant: "ghost",
      size: "sm",
      disabled: isBusy.value,
      "aria-label": `Actions pour ${row.original.title}`,
    })),
  },
];
const columns = computed(() => allColumns.filter(({id}) => {
  if (id === "select") return canDelete.value;
  if (id === "submissionRate") return canReadResponses.value;
  return true;
}));

const columnVisibility = usePersistentColumnVisibility("admin-submission-requests-table-column-visibility", {
  description: false,
  createdAt: false,
});
const columnItems = useColumnVisibilityDropdownItems(columns, columnVisibility);
const hasFilters = computed(() => Boolean(globalFilter.value || columnFilters.value.length));

function clearFilters() {
  globalFilter.value = "";
  columnFilters.value = [];
}

setActions(computed(() => [{
  icon: "i-lucide-plus",
  label: "Nouvelle demande",
  disabled: isBusy.value || !settings.value || !can("create", "SubmissionRequest"),
  onClick: () => openForm(),
}, {
  icon: "i-lucide-download",
  label: "Exporter",
  color: "secondary",
  disabled: isBusy.value || !can("export", "SubmissionRequest"),
  onClick: () => {
    if (can("export", "SubmissionRequest")) void runAction(() => exportModal.open({resource: "submissionRequests"}));
  },
}]));
</script>

<template>
  <UContainer class="grid min-w-0 gap-4">
    <UAlert v-if="status === 'error'" title="Impossible de charger les demandes" color="error" variant="soft"
            icon="i-lucide-circle-alert"
            :actions="[{label: 'Réessayer', color: 'error', variant: 'soft', onClick: () => refresh()}]"/>

    <div v-else-if="!requests" class="grid gap-3" aria-label="Chargement des demandes">
      <USkeleton class="h-9 w-56"/>
      <USkeleton v-for="n in 4" :key="n" class="h-16"/>
    </div>

    <template v-else>
      <UAlert v-if="!settings" title="Dates de l’événement indisponibles" color="warning" variant="soft"
              description="Les demandes restent consultables. Renseignez les dates pour créer ou modifier une demande."/>

      <UCard :ui="{body: 'p-0 sm:p-0'}" class="min-w-0">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."
                    aria-label="Rechercher une demande" :disabled="isBusy"/>
            <AdminBulkActions :count="selectedItems.length" :items="bulkItems" :pending="isBusy"
                              @clear="rowSelection = {}"/>
            <UDropdownMenu :items="columnItems" :content="{align: 'end'}">
              <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
            </UDropdownMenu>
          </div>
        </template>

        <UTable v-model:sorting="sorting" v-model:row-selection="rowSelection"
                v-model:column-filters="columnFilters" v-model:global-filter="globalFilter"
                v-model:column-visibility="columnVisibility" :columns :data="requests" :get-row-id="({id}) => id">
          <template #title-cell="{row}">
            <div class="grid gap-1">
              <span class="font-medium text-highlighted wrap-anywhere">{{ row.original.title }}</span>
              <span v-if="row.original.required" class="text-xs text-muted">Obligatoire</span>
            </div>
          </template>

          <template #deadline-cell="{row}">
            <div class="grid gap-1">
              <span>{{ dayjs(row.original.deadline).tz("Europe/Brussels").format("DD/MM/YYYY à HH:mm") }}</span>
              <span v-if="!dayjs(now).isBefore(row.original.deadline)" class="text-xs text-muted">Clôturée</span>
            </div>
          </template>

          <template #submissionRate-cell="{row}">
            <div v-if="row.original.progress" class="grid gap-1">
              <UButton color="neutral" variant="link" size="sm" class="place-self-start p-0 font-medium"
                       :aria-label="`Voir les réponses de ${row.original.title}`" :disabled="isBusy"
                       @click="runAction(() => responsesModal.open({request: row.original}))">
                {{ row.original.progress.submitted }} / {{ row.original.progress.total }}
              </UButton>
              <span v-if="row.original.progress.skipped" class="text-xs text-muted">
                {{ row.original.progress.skipped }} non remis
              </span>
            </div>
          </template>

          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty v-if="requests.length && hasFilters" title="Aucune demande trouvée" icon="i-lucide-search"
                      :actions="[{label: 'Effacer les filtres', color: 'neutral', variant: 'soft', onClick: clearFilters}]"/>
              <UEmpty v-else title="Aucune demande de soumission" icon="i-lucide-inbox"/>
            </div>
          </template>
        </UTable>
      </UCard>
    </template>
  </UContainer>
</template>
