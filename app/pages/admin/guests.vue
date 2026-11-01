<script setup lang="ts">
import BulkRemoveModal from "~/components/admin/guests/BulkRemoveModal.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { AdminExportModal, UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/guests/CreateModal.vue";
import EditModal from "~/components/admin/guests/EditModal.vue";
import RemoveModal from "~/components/admin/guests/RemoveModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Invités",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["guests.read"],
});

const {setActions} = useDashboardNavbar();
const {status, data: guests, refresh} = await useGuests({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {renderGuestsBadges, renderGuestBadge} = useGuestsActions();
const {can} = useAbility(currentAdmin);

const dayjs = useDayjs();
const overlay = useOverlay();
const toast = useToast();
const globalFilter = useSearchQuery();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);
const exportModal = overlay.create(AdminExportModal);
const bulkRemoveModal = overlay.create(BulkRemoveModal);

const {rowSelection, columnFilters, selectedItems: selectedGuests} = useTableSelection(guests, globalFilter);

const canPrintSelection = computed(() => can("print", "Badge") && selectedGuests.value.length > 0);
const canDeleteSelection = computed(() => selectedGuests.value.length > 0 && selectedGuests.value.every(function () {
  return can("delete", "Guest");
}));

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedGuests} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  const removedIds = await bulkRemoveModal.open({guests: [...selectedGuests.value]});
  if (removedIds) await refresh();
}, undefined, {immediate: false});

const {isLoading: isGeneratingBadges, executeImmediate: generateSelectedBadges} = useAsyncState(async () => {
  if (!canPrintSelection.value) return;
  const badges = await renderGuestsBadges(selectedGuests.value.map((item) => item.id));
  downloadBlob(badges, "badges-guests.pdf");
}, undefined, {immediate: false});
const isBulkActionPending = computed(() => isRemovingSelection.value || isGeneratingBadges.value);

const guestTypeItems = Object.values(GuestType).map((type) => ({
  label: translateGuestType(type),
  value: translateGuestType(type),
}));
const companyItems = computed(() => {
  return [...new Set((guests.value ?? []).map((guest) => guest.company || "Aucune"))]
      .sort((a, b) => a.localeCompare(b, "fr"))
      .map((company) => ({
        label: company,
        value: company,
      }));
});

const columns: NamedTableColumn<Guest>[] = [
  getSelectionColumn<Guest>(isBulkActionPending, (item) => `Sélectionner ${item.name}`, "Sélectionner les invités"),
  {
    id: "expand",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
      if (!row.original.imageUrl) {
        return null;
      }

      return getRowExpandButton(
          row,
          "Réduire l'image de l'invité",
          "Développer l'image de l'invité",
      );
    },
  },
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
  },
  {
    id: "type",
    name: "Type",
    header: ({column}) => getSingleSelectFilterHeader(column, "Type", guestTypeItems),
    accessorFn: (row) => translateGuestType(row.type),
    filterFn: "equalsString",
    cell: ({row}) => {
      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color: "neutral",
      }, () => translateGuestType(row.original.type));
    },
  },
  {
    id: "company",
    name: "Entreprise",
    header: ({column}) => getSingleSelectFilterHeader(column, "Entreprise", companyItems.value),
    accessorFn: (row) => row.company || "Aucune",
    filterFn: "equalsString",
    cell: ({row}) => row.original.company || "Aucune",
  },
  {
    id: "quantity",
    name: "Badges",
    header: ({column}) => getStrSortedHeader(column, "Badges"),
    accessorFn: (row) => row.quantity,
    enableGlobalFilter: false,
    cell: ({row}) => h("span", {
      class: row.original.quantity > 1 ? "text-highlighted" : undefined,
    }, row.original.quantity),
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
                "aria-label": `Actions pour l'invité ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'invité ${row.original.name}`,
              }),
          ),
      );
    },
  },
];

const bulkActionItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [];
  if (can("print", "Badge")) {
    items.push({
      label: "Générer les badges",
      icon: "i-lucide-id-card",
      disabled: !canPrintSelection.value || isBulkActionPending.value,
      onSelect: () => generateSelectedBadges(),
    });
  }
  if (can("delete", "Guest")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedGuests(),
    });
  }
  return items;
});

function getRowItems(row: Row<Guest>): Array<DropdownMenuItem> {
  const canUpdateGuest = can("update", "Guest");
  const canDeleteThisGuest = can("delete", "Guest");
  const canPrintBadge = can("print", "Badge");

  return [
    {
      type: "label",
      label: `Ajouté le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Éditer l'invité",
      icon: "i-lucide-edit-2",
      disabled: !canUpdateGuest,
      onSelect: async () => {
        if (!canUpdateGuest) return;
        const result = await editModal.open({guest: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer l'invité",
      icon: "i-lucide-trash-2",
      disabled: !canDeleteThisGuest || isBulkActionPending.value,
      onSelect: async () => {
        if (!canDeleteThisGuest || isBulkActionPending.value) return;
        const result = await removeModal.open({guest: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Générer le badge",
      icon: "i-lucide-id-card",
      disabled: !canPrintBadge,
      onSelect: async () => {
        if (!canPrintBadge) return;
        try {
          const badge = await renderGuestBadge(row.original);
          downloadBlob(badge, `badge-${row.original.name}.pdf`);
        } catch {
          toast.add({
            title: "Erreur",
            description: "Impossible de générer le badge.",
            color: "error",
          });
        }
      },
    }];
}

async function openCreateModal() {
  if (!can("create", "Guest")) return;

  const result = await createModal.open();
  if (result) {
    await refresh();
  }
}

async function openExportModal() {
  if (!can("export", "Guest")) return;
  await exportModal.open({resource: "guests"});
}

const expanded = ref({});
const columnVisibility = usePersistentColumnVisibility("admin-guests-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

setActions(computed(() => [{
  icon: "i-lucide-user-plus",
  label: "Ajouter",
  onClick: openCreateModal,
  disabled: !can("create", "Guest"),
}, {
  icon: "i-lucide-download",
  label: "Exporter",
  color: "secondary",
  onClick: openExportModal,
  disabled: !can("export", "Guest"),
}]));
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-4 lg:gap-6">
      <div class="flex flex-col gap-1 lg:gap-2">
        <div v-if="status === 'success'" class="flex flex-wrap items-center justify-between gap-2">
          <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>
          <AdminBulkActions :count="selectedGuests.length" :items="bulkActionItems" :pending="isBulkActionPending"
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
                v-model:expanded="expanded" v-model:global-filter="globalFilter"
                v-model:column-visibility="columnVisibility" :columns="columns" :data="guests" :get-row-id="(item) => item.id" sticky
                :loading="status === 'pending'" :ui="{tr: 'data-[expanded=true]:bg-elevated/50'}">
          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty title="Aucun invité"
                      description="Aucun invité n'est encore enregistré pour l'événement."
                      icon="i-lucide-circle-slash"/>
            </div>
          </template>
          <template #expanded="{row}">
            <div v-if="row.original.imageUrl" class="flex justify-center p-4">
              <NuxtImg :src="row.original.imageUrl" :alt="`Image de ${row.original.name}`"
                       class="max-h-80 w-fit object-contain rounded-lg"/>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </UContainer>
</template>
