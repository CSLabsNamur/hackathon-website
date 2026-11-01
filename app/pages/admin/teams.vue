<script setup lang="ts">
import BulkRemoveModal from "~/components/admin/teams/BulkRemoveModal.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { AdminExportModal, UBadge, UButton, UDropdownMenu } from "#components";
import EditModal from "~/components/admin/teams/EditModal.vue";
import RemoveModal from "~/components/admin/teams/RemoveModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Équipes",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["teams.read"],
});

const {status, data: teams, refresh} = await useTeams({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {setActions} = useDashboardNavbar();
const {can} = useAbility(currentAdmin);

const dayjs = useDayjs();
const overlay = useOverlay();
const {copyWithToast} = useCopyWithToast();
const globalFilter = useSearchQuery();

const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);
const exportModal = overlay.create(AdminExportModal);
const bulkRemoveModal = overlay.create(BulkRemoveModal);

const {rowSelection, columnFilters, selectedItems: selectedTeams} = useTableSelection(teams, globalFilter);

const canDeleteSelection = computed(() => selectedTeams.value.length > 0 && selectedTeams.value.every(canDeleteTeam));

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedTeams} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  const removedIds = await bulkRemoveModal.open({teams: [...selectedTeams.value]});
  if (removedIds) await refresh();
}, undefined, {immediate: false});

const isBulkActionPending = isRemovingSelection;

const validityItems = [
  {label: "Valide", value: "Valide"},
  {label: "Invalide", value: "Invalide"},
] as const;

const getTeamValidity = (team: AdminTeam) => {
  return isTeamValid(team) ? "Valide" : "Invalide";
};

const columns: NamedTableColumn<AdminTeam>[] = [
  getSelectionColumn<AdminTeam>(isBulkActionPending, (item) => `Sélectionner ${item.name}`, "Sélectionner les équipes"),
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
  },
  {
    id: "description",
    name: "Description",
    header: "Description",
    accessorKey: "description",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "valid",
    name: "Validité",
    header: ({column}) => getSingleSelectFilterHeader(column, "Validité", [...validityItems]),
    accessorFn: (row) => getTeamValidity(row),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({row}) => {
      const validity = row.getValue("valid") as "Valide" | "Invalide";
      const color: BadgeProps["color"] = validity === "Valide" ? "success" : "error";

      return h(UBadge, {class: "capitalize", variant: "subtle", color}, () =>
          validity,
      );
    },
  },
  {
    id: "members",
    name: "Membres",
    header: "Membres",
    accessorFn: (row: AdminTeam) => row.members.length,
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
                "aria-label": `Actions pour l'équipe ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'équipe ${row.original.name}`,
              }),
          ),
      );
    },
  },
  //{
  //  header: "Créée le",
  //  accessorKey: "createdAt",
  //  cell: ({row}) => {
  //    const date = new Date(row.getValue("createdAt") as string);
  //    return date.toLocaleDateString();
  //  },
  //}
];

const columnVisibility = usePersistentColumnVisibility("admin-teams-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

async function openExportModal() {
  if (!can("export", "Team")) return;
  await exportModal.open({resource: "teams"});
}

setActions(computed(() => [{
  icon: "i-lucide-download",
  label: "Exporter",
  color: "secondary",
  onClick: openExportModal,
  disabled: !can("export", "Team"),
}]));

const bulkActionItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [];
  if (can("delete", "Team")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      description: canDeleteSelection.value ? undefined : "La sélection contient des équipes qui ont encore des membres.",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedTeams(),
    });
  }
  return items;
});

function canDeleteTeam(item: AdminTeam) {
  return can("delete", "Team") && item.members.length === 0;
}

function getRowItems(row: Row<AdminTeam>): Array<DropdownMenuItem> {
  const canUpdateTeam = can("update", "Team");
  const canDeleteThisTeam = canDeleteTeam(row.original);

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
    {
      label: "Copier le token",
      icon: "i-lucide-clipboard-copy",
      onSelect: () => {
        copyWithToast(row.original.token, {
          title: "Token copié",
          description: `Le token de l'équipe ${row.original.name} a été copié dans le presse-papier.`,
          duration: 1500,
        });
      },
    },
    // TODO: Email functionality
    //{
    //  label: "Envoyer un email",
    //  icon: "i-lucide-mail",
    //},
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Éditer l'équipe",
      icon: "i-lucide-edit-2",
      disabled: !canUpdateTeam,
      onSelect: async () => {
        if (!canUpdateTeam) return;
        const result = await editModal.open({team: row.original, adminEdit: true});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      disabled: !canDeleteThisTeam || isBulkActionPending.value,
      onSelect: async () => {
        if (!canDeleteThisTeam || isBulkActionPending.value) return;
        const result = await removeModal.open({team: row.original});
        if (result) await refresh();
      },
    },
  ];
}
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-4 lg:gap-6">
      <AdminTeamStats/>
      <div class="flex flex-col gap-1 lg:gap-2">
        <div v-if="status === 'success'" class="flex flex-wrap items-center justify-between gap-2">
          <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>
          <AdminBulkActions :count="selectedTeams.length" :items="bulkActionItems" :pending="isBulkActionPending"
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
                v-model:global-filter="globalFilter" v-model:column-visibility="columnVisibility"
                :columns="columns" :data="teams" :get-row-id="(item) => item.id" sticky :loading="status === 'pending'">
          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty title="Aucune équipe"
                      description="Aucun équipe ne s'est encore formée."
                      icon="i-lucide-circle-slash"/>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </UContainer>
</template>
