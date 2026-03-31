<script setup lang="ts">
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/sponsors/CreateModal.vue";
import EditModal from "~/components/admin/sponsors/EditModal.vue";
import RemoveModal from "~/components/admin/sponsors/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: sponsors, refresh} = await useSponsors({lazy: true});
const {renderSponsorBadge} = useSponsorsActions();

const dayjs = useDayjs();
const overlay = useOverlay();
const toast = useToast();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const globalFilter = ref("");
const badgeItems = [
  {label: "Oui", value: "Oui"},
  {label: "Non", value: "Non"},
] as const;

const columns: NamedTableColumn<Sponsor>[] = [
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

function getRowItems(row: Row<Sponsor>): Array<DropdownMenuItem> {
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
    onSelect: async () => {
      const result = await editModal.open({sponsor: row.original});
      if (result) await refresh();
    },
  }, {
    label: "Supprimer le sponsor",
    icon: "i-lucide-trash-2",
    onSelect: async () => {
      const result = await removeModal.open({sponsor: row.original});
      if (result) await refresh();
    },
  }, {
    label: "Générer le badge",
    icon: "i-lucide-id-card",
    disabled: !row.original.hasBadge,
    onSelect: async () => {
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
  const result = await createModal.open();
  if (result) {
    await refresh();
  }
}

const expanded = ref({});
const columnVisibility = usePersistentColumnVisibility("admin-sponsors-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Sponsors">
        <template #right>
          <UButton icon="i-lucide-plus" @click="openCreateModal">Nouveau</UButton>
        </template>
      </DashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <div class="flex flex-col gap-1 lg:gap-2">
            <div v-if="status === 'success'" class="flex justify-between">
              <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
              <UDropdownMenu :items="columnVisibilityDropdownItems" content-class="min-w-40" :content="{align: 'end'}"
                             aria-label="Afficher ou masquer les colonnes">
                <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
              </UDropdownMenu>
            </div>
            <UTable v-model:expanded="expanded" v-model:global-filter="globalFilter"
                    v-model:column-visibility="columnVisibility" :columns="columns" :data="sponsors" sticky
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
                  <NuxtImg v-if="row.original.logo" :src="row.original.logo" alt="Logo du sponsor"
                           class="max-h-48 w-fit object-contain self-center"/>
                  <USeparator orientation="horizontal"/>
                  <article class="text-white max-h-96 overflow-auto p-4"
                           v-html="getSponsorHTMLDescription(row.original)"/>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
