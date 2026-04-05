<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/roles/CreateModal.vue";
import EditModal from "~/components/admin/roles/EditModal.vue";
import RemoveModal from "~/components/admin/roles/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: roles, refresh} = await useRoles({lazy: true});
const {data: permissions} = await usePermissions();

const overlay = useOverlay();
const dayjs = useDayjs();
const globalFilter = useSearchQuery();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const columns: NamedTableColumn<Role>[] = [
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
    cell: ({row}) => {
      return h("div", {class: "flex items-center gap-2"}, [
        h("span", row.original.name),
        row.original.system
            ? h(UBadge, {
              color: "neutral",
              variant: "subtle",
            }, () => "Système")
            : null,
      ]);
    },
  }, {
    id: "key",
    name: "Clé",
    header: ({column}) => getStrSortedHeader(column, "Clé"),
    accessorKey: "key",
  }, {
    id: "description",
    name: "Description",
    header: "Description",
    accessorFn: (row) => row.description ?? "",
    meta: getWrappingColumnMeta(),
  }, {
    id: "permissions",
    name: "Permissions",
    header: "Permissions",
    accessorFn: (row) => row.permissions.map((permission) => permission.key).join(" "),
    meta: getWrappingColumnMeta(),
    cell: ({row}) => {
      if (row.original.permissions.length === 0) {
        return h("span", {class: "text-muted"}, "Aucune");
      }

      return h("div", {class: "flex flex-wrap gap-1"}, row.original.permissions.map((permission) => {
        return h(UBadge, {
          key: permission.key,
          color: "neutral",
          variant: "soft",
        }, () => permission.key);
      }));
    },
  }, {
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
                "aria-label": `Actions pour le rôle ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour le rôle ${row.original.name}`,
              }),
          ),
      );
    },
  },
];

function getRowItems(row: Row<Role>): Array<DropdownMenuItem> {
  return [{
    type: "label",
    label: `Créé le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
    class: "text-muted",
  }, {
    type: "label",
    label: "Administration",
  }, {
    label: "Modifier le rôle",
    icon: "i-lucide-edit-2",
    disabled: row.original.system,
    onSelect: async () => {
      const result = await editModal.open({
        role: row.original,
        permissions: permissions.value ?? [],
      });
      if (result) await refresh();
    },
  }, {
    label: "Supprimer le rôle",
    icon: "i-lucide-trash-2",
    disabled: row.original.system || row.original._count.assignments > 0,
    onSelect: async () => {
      const result = await removeModal.open({role: row.original});
      if (result) await refresh();
    },
  }];
}

async function openCreateModal() {
  const result = await createModal.open({
    permissions: permissions.value ?? [],
  });
  if (result) await refresh();
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Rôles">
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
            </div>

            <UTable v-model:global-filter="globalFilter" :columns="columns" :data="roles" sticky
                    :loading="status === 'pending'">
              <template #empty>
                <div class="max-w-1/2 mx-auto">
                  <UEmpty title="Aucun rôle"
                          description="Aucun rôle n'est encore configuré."
                          icon="i-lucide-circle-slash"/>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
