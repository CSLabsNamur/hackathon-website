<script setup lang="ts">
import BulkRemoveModal from "~/components/admin/submission-request/BulkRemoveModal.vue";
import CreateSubmissionRequestModal from "~/components/admin/submission-request/CreateModal.vue";
import EditSubmissionRequestModal from "~/components/admin/submission-request/EditModal.vue";
import RemoveSubmissionRequestModal from "~/components/admin/submission-request/RemoveModal.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { AdminExportModal, UBadge, UButton, UDropdownMenu } from "#components";
import { submissionTypeTranslateMap } from "#shared/utils/types";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Demandes de soumissions",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["submissionRequests.read"],
});

const {setActions} = useDashboardNavbar();
const {
  status: submissionsStatus,
  data: submissionRequests,
  refresh: refreshSubmissionRequests,
} = await useSubmissionsRequests({lazy: true});
const {data: currentAdmin, isSuperAdmin} = await useCurrentAdmin();
const {can} = useAbility(currentAdmin);
const canReadParticipants = computed(() => can("read", "Participant"));
const {status: participantsStatus, data: participants, refresh: refreshParticipants} = await useParticipants({lazy: true, immediate: canReadParticipants.value});

watch(canReadParticipants, async (allowed) => {
  if (allowed) await refreshParticipants();
});

const dayjs = useDayjs();
const overlay = useOverlay();
const globalFilter = useSearchQuery();

const createModal = overlay.create(CreateSubmissionRequestModal);
const editModal = overlay.create(EditSubmissionRequestModal);
const removeModal = overlay.create(RemoveSubmissionRequestModal);
const exportModal = overlay.create(AdminExportModal);
const bulkRemoveModal = overlay.create(BulkRemoveModal);

const {
  rowSelection,
  columnFilters,
  selectedItems: selectedSubmissionRequests,
} = useTableSelection(submissionRequests, globalFilter);

const canDeleteSelection = computed(() => selectedSubmissionRequests.value.length > 0 && selectedSubmissionRequests.value.every(canDeleteSubmissionRequest));

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedSubmissionRequests} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  const removedIds = await bulkRemoveModal.open({submissionRequests: [...selectedSubmissionRequests.value]});
  if (removedIds) await refreshSubmissionRequests();
}, undefined, {immediate: false});

const isBulkActionPending = isRemovingSelection;

const submissionTypeItems = Object.values(SubmissionType).map((type) => ({
  label: submissionTypeTranslateMap[type],
  value: type,
}));
const submissionScopeItems = [{
  label: "Participant",
  value: "participant",
}, {
  label: "Équipe",
  value: "team",
}];
const totalTeams = computed(() => new Set((participants.value ?? []).flatMap((participant) => participant.teamId ? [participant.teamId] : [])).size);

const getSubmissionRate = (submissionRequest: AdminSubmissionRequest) => {
  const totalParticipants = participants.value?.length || 0;
  const totalTargets = submissionRequest.teamRequest ? totalTeams.value : totalParticipants;
  const submissionsCount = submissionRequest._count.submissions;

  return totalTargets === 0 ? 0 : (submissionsCount / totalTargets) * 100;
};

const allColumns: NamedTableColumn<AdminSubmissionRequest>[] = [
  getSelectionColumn<AdminSubmissionRequest>(isBulkActionPending, (item) => `Sélectionner ${item.title}`, "Sélectionner les demandes de soumission"),
  {
    id: "title",
    name: "Titre",
    header: ({column}) => getStrSortedHeader(column, "Titre"),
    accessorKey: "title",
    cell: ({row}) => h("div", {class: "truncate max-w-36", title: row.original.title}, row.original.title),
  },
  {
    id: "description",
    name: "Description",
    header: "Description",
    accessorKey: "description",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "type",
    name: "Type",
    header: ({column}) => getSingleSelectFilterHeader(column, "Type", submissionTypeItems),
    accessorFn: (row) => submissionTypeTranslateMap[row.type],
    filterFn: (row, _columnId, filterValue) => row.original.type === filterValue,
    cell: ({row}) => {
      const color: BadgeProps["color"] = row.original.type === SubmissionType.TEXT ? "info" : "warning";

      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color,
      }, () => submissionTypeTranslateMap[row.original.type]);
    },
  },
  {
    id: "scope",
    name: "Portée",
    header: ({column}) => getSingleSelectFilterHeader(column, "Portée", submissionScopeItems),
    accessorFn: (row) => row.teamRequest ? "Équipe" : "Participant",
    filterFn: (row, _columnId, filterValue) => {
      return filterValue === "team" ? row.original.teamRequest : !row.original.teamRequest;
    },
    cell: ({row}) => h(UBadge, {
      variant: "subtle",
      color: row.original.teamRequest ? "secondary" : "neutral",
    }, () => row.original.teamRequest ? "Équipe" : "Participant"),
  },
  {
    id: "deadline",
    name: "Date limite",
    header: ({column}) => getStrSortedHeader(column, "Date limite"),
    accessorKey: "deadline",
    cell: ({row}) => h("div", {title: dayjs(row.original.deadline).format("DD/MM/YYYY HH:mm")}, dayjs(row.original.deadline).format("DD/MM/YYYY")),
  },
  {
    id: "createdAt",
    name: "Date de création",
    header: ({column}) => getStrSortedHeader(column, "Date de création"),
    accessorKey: "createdAt",
    cell: ({row}) => dayjs(row.original.createdAt).format("DD/MM/YYYY"),
  },
  {
    id: "submissionRate",
    name: "Taux de soumission",
    header: ({column}) => getStrSortedHeader(column, "Taux de soumission"),
    accessorFn: (row: AdminSubmissionRequest) => `${getSubmissionRate(row).toFixed(2)} %`,
    sortingFn: (rowA, rowB, columnId) => {
      return parseFloat(rowA.getValue(columnId)) - parseFloat(rowB.getValue(columnId));
    },
  },
  {
    id: "actions",
    name: "Actions",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
      return h(
          "div",
          {class: "text-right"},
          h(
              UDropdownMenu,
              {
                content: {align: "end"},
                items: getRowItems(row),
                "aria-label": `Actions pour la demande de soumission ${row.original.title}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour la demande de soumission ${row.original.title}`,
              }),
          ),
      );
    },
  },
];

const columns = computed(() => canReadParticipants.value ? allColumns : allColumns.filter((column) => column.id !== "submissionRate"));

const columnVisibility = usePersistentColumnVisibility("admin-submission-requests-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

const openCreateModal = async () => {
  if (!can("create", "SubmissionRequest")) return;

  const result = await createModal.open();
  if (result) await refreshSubmissionRequests();
};

const openExportModal = async () => {
  if (!can("export", "SubmissionRequest")) return;
  await exportModal.open({resource: "submissionRequests"});
};

const bulkActionItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [];
  if (can("delete", "SubmissionRequest")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      description: canDeleteSelection.value ? undefined : "La sélection contient des demandes qui ont déjà des soumissions associées.",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedSubmissionRequests(),
    });
  }
  return items;
});

function canDeleteSubmissionRequest(item: AdminSubmissionRequest) {
  return can("delete", "SubmissionRequest") && (isSuperAdmin.value || item._count.submissions === 0);
}

function getRowItems(row: Row<AdminSubmissionRequest>): Array<DropdownMenuItem> {
  const canUpdateSubmissionRequest = can("update", "SubmissionRequest") && row.original._count.submissions === 0;
  const canDeleteThisSubmissionRequest = canDeleteSubmissionRequest(row.original);

  return [
    {
      type: "label",
      label: `Créée le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    {
      type: "label",
      label: "Actions",
    },
    // TODO: Implement view submissions functionality
    //{
    //  label: "Voir les soumissions",
    //  icon: "i-lucide-eye",
    //  //onSelect: () => {
    //  //},
    //},
    {
      label: "Éditer",
      icon: "i-lucide-edit-2",
      disabled: !canUpdateSubmissionRequest,
      onSelect: async () => {
        if (!canUpdateSubmissionRequest) return;
        const result = await editModal.open({submissionRequest: row.original});
        if (result) await refreshSubmissionRequests();
      },
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      disabled: !canDeleteThisSubmissionRequest || isBulkActionPending.value,
      onSelect: async () => {
        if (!canDeleteThisSubmissionRequest || isBulkActionPending.value) return;
        const result = await removeModal.open({submissionRequest: row.original});
        if (result) await refreshSubmissionRequests();
      },
    },
  ];
}

setActions(computed(() => [{
  icon: "i-lucide-plus",
  label: "Nouvelle demande",
  onClick: openCreateModal,
  disabled: !can("create", "SubmissionRequest"),
}, {
  icon: "i-lucide-download",
  label: "Exporter",
  color: "secondary",
  onClick: openExportModal,
  disabled: !can("export", "SubmissionRequest"),
}]));
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-1 lg:gap-2">
      <div v-if="submissionsStatus === 'success' && participantsStatus === 'success'"
           class="flex flex-wrap items-center justify-between gap-2">
        <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>
        <AdminBulkActions :count="selectedSubmissionRequests.length" :items="bulkActionItems"
                          :pending="isBulkActionPending"
                          @clear="rowSelection = {}"/>
        <TourHelperPopover title="Astuce : colonnes personnalisables"
                           description="Vous pouvez choisir les colonnes à afficher dans le tableau."
                           status-key="admin-table-column-visibility" placement="top">
          <UDropdownMenu :items="columnVisibilityDropdownItems" content-class="min-w-40" :content="{align: 'end'}"
                         aria-label="Afficher ou masquer les colonnes">
            <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
          </UDropdownMenu>
        </TourHelperPopover>
      </div>
      <UTable v-model:row-selection="rowSelection" v-model:column-filters="columnFilters"
              v-model:global-filter="globalFilter" v-model:column-visibility="columnVisibility" :columns="columns"
              :data="submissionRequests" :get-row-id="(item) => item.id" sticky
              :loading="submissionsStatus === 'pending' || (canReadParticipants && participantsStatus === 'pending')">
        <template #empty>
          <div class="max-w-1/2 mx-auto">
            <UEmpty title="Aucune demande de soumission"
                    description="Aucune demande de soumission n'a encore été créée."
                    icon="i-lucide-circle-slash"/>
          </div>
        </template>
      </UTable>
    </div>
  </UContainer>
</template>
