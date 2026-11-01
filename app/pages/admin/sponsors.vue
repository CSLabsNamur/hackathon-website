<script setup lang="ts">
import BulkRemoveModal from "~/components/admin/sponsors/BulkRemoveModal.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { AdminExportModal, UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/sponsors/CreateModal.vue";
import EditModal from "~/components/admin/sponsors/EditModal.vue";
import RemoveModal from "~/components/admin/sponsors/RemoveModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Sponsors",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["sponsors.read"],
});

const {setActions} = useDashboardNavbar();
const {status, data: sponsors, refresh} = await useSponsors({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {renderSponsorsBadges, renderSponsorBadge} = useSponsorsActions();
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

const {rowSelection, columnFilters, selectedItems: selectedSponsors} = useTableSelection(sponsors, globalFilter);

const canPrintSelection = computed(() => can("print", "Badge") && selectedSponsors.value.length > 0 && selectedSponsors.value.every((sponsor) => sponsor.hasBadge));
const canDeleteSelection = computed(() => selectedSponsors.value.length > 0 && selectedSponsors.value.every(function () {
  return can("delete", "Sponsor");
}));

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedSponsors} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  const removedIds = await bulkRemoveModal.open({sponsors: [...selectedSponsors.value]});
  if (removedIds) await refresh();
}, undefined, {immediate: false});

const {isLoading: isGeneratingBadges, executeImmediate: generateSelectedBadges} = useAsyncState(async () => {
  if (!canPrintSelection.value) return;
  const badges = await renderSponsorsBadges(selectedSponsors.value.map((item) => item.id));
  downloadBlob(badges, "badges-sponsors.pdf");
}, undefined, {immediate: false});
const isBulkActionPending = computed(() => isRemovingSelection.value || isGeneratingBadges.value);

const badgeItems = [
  {label: "Oui", value: "Oui"},
  {label: "Non", value: "Non"},
] as const;

const columns: NamedTableColumn<Sponsor>[] = [
  getSelectionColumn<Sponsor>(isBulkActionPending, (item) => `Sélectionner ${item.name}`, "Sélectionner les sponsors"),
  {
    id: "expand",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
      if (!sponsorHasDescription(row.original)) {
        return null;
      }

      return getRowExpandButton(
          row,
          "Réduire la description du sponsor",
          "Développer la description du sponsor",
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
    id: "url",
    name: "Site web",
    header: "Site web",
    accessorKey: "url",
    enableGlobalFilter: false,
    cell: ({row}) => {
      if (!row.original.url) {
        return "Aucun";
      }

      return h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-lucide-link",
        to: row.original.url,
        target: "_blank",
        external: true,
      }, () => "Ouvrir");
    },
  },
  {
    id: "hasBadge",
    name: "Badge",
    header: ({column}) => getSingleSelectFilterHeader(column, "Badge", [...badgeItems]),
    accessorFn: (row) => row.hasBadge ? "Oui" : "Non",
    filterFn: "equalsString",
    cell: ({row}) => {
      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color: row.original.hasBadge ? "success" : "neutral",
      }, () => row.original.hasBadge ? "Oui" : "Non");
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
                "aria-label": `Actions pour le sponsor ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour le sponsor ${row.original.name}`,
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
      description: canPrintSelection.value ? undefined : "La sélection contient des sponsors sans badge.",
      disabled: !canPrintSelection.value || isBulkActionPending.value,
      onSelect: () => generateSelectedBadges(),
    });
  }
  if (can("delete", "Sponsor")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedSponsors(),
    });
  }
  return items;
});

function getRowItems(row: Row<Sponsor>): Array<DropdownMenuItem> {
  const canUpdateSponsor = can("update", "Sponsor");
  const canDeleteThisSponsor = can("delete", "Sponsor");
  const canPrintBadge = can("print", "Badge");

  return [{
    type: "label",
    label: `Ajouté le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
    class: "text-muted",
  }, {
    type: "label",
    label: "Administration",
  }, {
    label: "Éditer le sponsor",
    icon: "i-lucide-edit-2",
    disabled: !canUpdateSponsor,
    onSelect: async () => {
      if (!canUpdateSponsor) return;
      const result = await editModal.open({sponsor: row.original});
      if (result) await refresh();
    },
  }, {
    label: "Supprimer le sponsor",
    icon: "i-lucide-trash-2",
    disabled: !canDeleteThisSponsor || isBulkActionPending.value,
    onSelect: async () => {
      if (!canDeleteThisSponsor || isBulkActionPending.value) return;
      const result = await removeModal.open({sponsor: row.original});
      if (result) await refresh();
    },
  }, {
    label: "Générer le badge",
    icon: "i-lucide-id-card",
    disabled: !row.original.hasBadge || !canPrintBadge,
    onSelect: async () => {
      if (!row.original.hasBadge || !canPrintBadge) return;
      try {
        const badge = await renderSponsorBadge(row.original);
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
  if (!can("create", "Sponsor")) return;

  const result = await createModal.open();
  if (result) {
    await refresh();
  }
}

async function openExportModal() {
  if (!can("export", "Sponsor")) return;
  await exportModal.open({resource: "sponsors"});
}

const expanded = ref({});
const columnVisibility = usePersistentColumnVisibility("admin-sponsors-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

setActions(computed(() => [{
  icon: "i-lucide-plus",
  label: "Nouveau",
  onClick: openCreateModal,
  disabled: !can("create", "Sponsor"),
}, {
  icon: "i-lucide-download",
  label: "Exporter",
  color: "secondary",
  onClick: openExportModal,
  disabled: !can("export", "Sponsor"),
}]));
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-4 lg:gap-6">
      <div class="flex flex-col gap-1 lg:gap-2">
        <div v-if="status === 'success'" class="flex flex-wrap items-center justify-between gap-2">
          <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>
          <AdminBulkActions :count="selectedSponsors.length" :items="bulkActionItems" :pending="isBulkActionPending"
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
                v-model:column-visibility="columnVisibility" :columns="columns" :data="sponsors" :get-row-id="(item) => item.id" sticky
                :loading="status === 'pending'" :ui="{tr: 'data-[expanded=true]:bg-elevated/50'}">
          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty title="Aucun sponsor"
                      description="Aucun sponsor n'est encore enregistré pour l'événement."
                      icon="i-lucide-circle-slash"/>
            </div>
          </template>
          <template #expanded="{row}">
            <div class="flex flex-col gap-2">
              <LazyNuxtImg v-if="row.original.logo" :src="row.original.logo" alt="Logo du sponsor"
                           class="max-h-48 w-fit object-contain self-center"/>
              <USeparator orientation="horizontal"/>
              <!--eslint-disable vue/no-v-html -->
              <article class="text-white max-h-96 overflow-auto p-4"
                       v-html="getSponsorHTMLDescription(row.original)"/>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </UContainer>
</template>
