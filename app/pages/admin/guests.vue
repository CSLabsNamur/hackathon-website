<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import CreateModal from "~/components/admin/guests/CreateModal.vue";
import EditModal from "~/components/admin/guests/EditModal.vue";
import RemoveModal from "~/components/admin/guests/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: guests, refresh} = await useGuests({lazy: true});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const dayjs = useDayjs();
const overlay = useOverlay();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const columns: TableColumn<Guest>[] = [
  {
    id: "expand",
    cell: ({row}) => {
      if (!row.original.imageUrl) {
        return null;
      }

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        icon: "i-lucide-chevron-down",
        square: true,
        "aria-label": row.getIsExpanded() ? "Réduire l'image de l'invité" : "Développer l'image de l'invité",
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
    header: "Type",
    accessorFn: (row) => translateGuestType(row.type),
    cell: ({row}) => {
      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color: "neutral",
      }, () => translateGuestType(row.original.type));
    },
  },
  {
    header: "Entreprise",
    accessorKey: "company",
    cell: ({row}) => row.original.company || "Aucune",
  },
  {
    header: "Badges",
    accessorFn: (row) => row.quantity,
    cell: ({row}) => h("span", {
      class: row.original.quantity > 1 ? "text-highlighted" : undefined,
    }, row.original.quantity),
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

function getRowItems(row: Row<Guest>): Array<DropdownMenuItem> {
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
      onSelect: async () => {
        const result = await editModal.open({guest: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer l'invité",
      icon: "i-lucide-trash-2",
      onSelect: async () => {
        const result = await removeModal.open({guest: row.original});
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

const expanded = ref({});
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Invités">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>
          <UButton icon="i-lucide-user-plus" @click="openCreateModal">Ajouter</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <UTable v-model:expanded="expanded" :columns="columns" :data="guests" sticky
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
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
