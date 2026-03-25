<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import CreateModal from "~/components/admin/sponsors/CreateModal.vue";
import EditModal from "~/components/admin/sponsors/EditModal.vue";
import RemoveModal from "~/components/admin/sponsors/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: sponsors, refresh} = await useSponsors({lazy: true});
const {renderSponsorBadge} = useSponsorsActions();

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const dayjs = useDayjs();
const overlay = useOverlay();
const toast = useToast();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const columns: TableColumn<Sponsor>[] = [
  {
    id: "expand",
    cell: ({row}) => {
      if (!sponsorHasDescription(row.original)) {
        return null;
      }
      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        icon: "i-lucide-chevron-down",
        square: true,
        "aria-label": row.getIsExpanded() ? "Développer la description du sponsor" : "Réduire la description du sponsor",
        ui: {
          leadingIcon: [
            "transition-transform",
            row.getIsExpanded() ? "duration-200 rotate-180" : "",
          ],
        },
        onClick: () => row.toggleExpanded(),
      });
    },
  },
  {
    header: "Nom",
    accessorKey: "name",
  },
  {
    header: "Site web",
    accessorKey: "url",
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
    header: "Badge",
    accessorKey: "hasBadge",
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
          <UTable v-model:expanded="expanded" :columns="columns" :data="sponsors" sticky
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
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
