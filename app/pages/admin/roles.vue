<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { UBadge, UButton, UDropdownMenu } from "#components";
import CreateModal from "~/components/admin/roles/CreateModal.vue";
import EditModal from "~/components/admin/roles/EditModal.vue";
import RemoveModal from "~/components/admin/roles/RemoveModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Rôles",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["roles.read"],
});

const {setActions} = useDashboardNavbar();
const {status, data: roles, refresh} = await useRoles({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {data: permissions} = await usePermissions();
const {can} = useAbility(currentAdmin);

const overlay = useOverlay();
const dayjs = useDayjs();
const globalFilter = useSearchQuery();

const createModal = overlay.create(CreateModal);
const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const groupedPermissions = computed(() => (permissions: PermissionDb[] | undefined) => permissions?.reduce<Record<string, PermissionDb[]>>((groups, permission) => {
  if (!groups[permission.group]) {
    groups[permission.group] = [];
  }

  groups[permission.group]!.push(permission);
  return groups;
}, {}));

const columns: NamedTableColumn<Role>[] = [
  {
    id: "expand",
    enableHiding: false,
    enableGlobalFilter: false,
    cell: ({row}) => {
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
  },
  {
    id: "key",
    name: "Clé",
    header: ({column}) => getStrSortedHeader(column, "Clé"),
    accessorKey: "key",
  },
  {
    id: "description",
    name: "Description",
    header: "Description",
    accessorFn: (row) => row.description ?? "",
    meta: getWrappingColumnMeta(),
  },
  //{
  //  id: "permissions",
  //  name: "Permissions",
  //  header: "Permissions",
  //  accessorFn: (row) => row.permissions.map((permission) => permission.key).join(" "),
  //  meta: getWrappingColumnMeta(),
  //  cell: ({row}) => {
  //    if (row.original.permissions.length === 0) {
  //      return h("span", {class: "text-muted"}, "Aucune");
  //    }
  //
  //    return h("div", {class: "flex flex-wrap gap-1"}, row.original.permissions.map((permission) => {
  //      return h(UBadge, {
  //        key: permission.key,
  //        color: "neutral",
  //        variant: "soft",
  //      }, () => permission.key);
  //    }));
  //  },
  //},
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

const columnVisibility = usePersistentColumnVisibility("admin-roles-table", {
  key: false,
});
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

function getRowItems(row: Row<Role>): Array<DropdownMenuItem> {
  const canUpdateRole = can("update", "Role");
  const canDeleteRole = can("delete", "Role");
  const canManageThisRole = canDelegatePermissionKeys(currentAdmin, row.original.permissions.map((permission) => permission.key));

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
    disabled: row.original.system || !canUpdateRole || !canManageThisRole,
    onSelect: async () => {
      if (row.original.system || !canUpdateRole || !canManageThisRole) return;
      const result = await editModal.open({
        role: row.original,
        permissions: permissions.value ?? [],
      });
      if (result) await refresh();
    },
  }, {
    label: "Supprimer le rôle",
    icon: "i-lucide-trash-2",
    disabled: row.original.system || row.original._count.assignments > 0 || !canDeleteRole || !canManageThisRole,
    onSelect: async () => {
      if (row.original.system || row.original._count.assignments > 0 || !canDeleteRole || !canManageThisRole) return;
      const result = await removeModal.open({role: row.original});
      if (result) await refresh();
    },
  }];
}

async function openCreateModal() {
  if (!can("create", "Role")) return;

  const result = await createModal.open({
    permissions: permissions.value ?? [],
  });
  if (result) await refresh();
}

const expanded = ref({});

setActions(computed(() => [{
  icon: "i-lucide-plus",
  label: "Nouveau",
  onClick: openCreateModal,
  disabled: !can("create", "Role"),
}]));
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-4 lg:gap-6">
      <div class="flex flex-col gap-1 lg:gap-2">
        <div v-if="status === 'success'" class="flex justify-between">
          <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
          <TourHelperPopover title="Astuce : colonnes personnalisables"
                             description="Vous pouvez choisir les colonnes à afficher dans le tableau."
                             status-key="admin-table-column-visibility" placement="top">
            <UDropdownMenu :items="columnVisibilityDropdownItems" content-class="min-w-40" :content="{align: 'end'}"
                           aria-label="Afficher ou masquer les colonnes">
              <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
            </UDropdownMenu>
          </TourHelperPopover>
        </div>

        <UTable v-model:expanded="expanded" v-model:global-filter="globalFilter"
                v-model:column-visibility="columnVisibility" :columns="columns" :data="roles"
                sticky :loading="status === 'pending'" :ui="{tr: 'data-[expanded=true]:bg-elevated/50'}">
          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty title="Aucun rôle"
                      description="Aucun rôle n'est encore configuré."
                      icon="i-lucide-circle-slash"/>
            </div>
          </template>
          <template #expanded="{row}">
            <div class="grid gap-4 md:grid-cols-2">
              <UCard v-for="(groupPermissions, group) in groupedPermissions(row.original.permissions)" :key="group">
                <p class="text-sm font-semibold uppercase mb-2 text-highlighted">{{ group }}</p>

                <div class="grid gap-3 md:grid-cols-2">
                  <div v-for="permission in groupPermissions" :key="permission.id"
                       class="flex flex-col gap-1">
                    <span class="font-medium truncate" :title="permission.name">{{ permission.name }}</span>
                    <LazyUBadge variant="soft" color="neutral" class="max-w-fit">{{ permission.key }}</LazyUBadge>
                  </div>
                </div>
              </UCard>
            </div>
          </template>
        </UTable>
      </div>
    </div>
  </UContainer>
</template>
