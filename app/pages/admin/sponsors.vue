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

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UPopover = resolveComponent("UPopover");

const dayjs = useDayjs();
const overlay = useOverlay();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const columns: TableColumn<Sponsor>[] = [
  {
    header: "Nom",
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({row}) => {
      if (!sponsorHasDescription(row.original)) {
        return "Aucune";
      }

      return h(UPopover, {
        content: {
          align: "center",
        },
      }, {
        default: () => h(UButton, {
          label: "Prévisualiser",
          variant: "subtle",
          color: "neutral",
          size: "sm",
        }),
        content: () => h("div", {
          class: "max-w-xs max-h-96 overflow-auto p-4",
          innerHTML: getSponsorHTMLDescription(row.original),
        }),
      });
    },
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
    header: "Logo",
    accessorKey: "logo",
    cell: ({row}) => {
      if (!row.original.logo) {
        return "Aucun";
      }

      return h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-lucide-image",
        to: row.original.logo,
        target: "_blank",
        external: true,
      }, () => "Voir");
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
  }];
}

async function openCreateModal() {
  const result = await createModal.open();
  if (result) {
    await refresh();
  }
}
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
          <UTable :columns="columns" :data="sponsors" sticky :loading="status === 'pending'">
            <template #empty>
              <div class="max-w-1/2 mx-auto">
                <UEmpty title="Aucun sponsor"
                        description="Aucun sponsor n'est encore enregistré pour l'événement."
                        icon="i-lucide-circle-slash"/>
              </div>
            </template>
          </UTable>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
