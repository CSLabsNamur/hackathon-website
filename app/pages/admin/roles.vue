<script setup lang="ts">
import BulkRemoveModal from "~/components/admin/roles/BulkRemoveModal.vue";
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

const bulkRemoveModal = overlay.create(BulkRemoveModal);

const {rowSelection, columnFilters, selectedItems: selectedRoles} = useTableSelection(roles, globalFilter);

const canDeleteSelection = computed(() => selectedRoles.value.length > 0 && selectedRoles.value.every(canDeleteRole));

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedRoles} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  const removedIds = await bulkRemoveModal.open({roles: [...selectedRoles.value]});
  if (removedIds) await refresh();
}, undefined, {immediate: false});

const isBulkActionPending = isRemovingSelection;

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
  getSelectionColumn<Role>(isBulkActionPending, (item) => `Sélectionner ${item.name}`, "Sélectionner les rôles"),
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

const bulkActionItems = computed<DropdownMenuItem[]>(() => {
  const items: DropdownMenuItem[] = [];
  if (can("delete", "Role")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      description: canDeleteSelection.value ? undefined : "La sélection contient des rôles système, assignés ou que vous ne pouvez pas gérer.",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedRoles(),
    });
  }
  return items;
});

function canDeleteRole(item: Role) {
  return can("delete", "Role") && !item.system && item._count.assignments === 0
      && canDelegatePermissionKeys(currentAdmin, item.permissions.map((permission) => permission.key));
}

function getRowItems(row: Row<Role>): Array<DropdownMenuItem> {
  const canUpdateRole = can("update", "Role");
  const canDeleteThisRole = canDeleteRole(row.original);
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
    disabled: !canDeleteThisRole || isBulkActionPending.value,
    onSelect: async () => {
      if (!canDeleteThisRole || isBulkActionPending.value) return;
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
        <div v-if="status === 'success'" class="flex flex-wrap items-center justify-between gap-2">
          <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>
          <AdminBulkActions :count="selectedRoles.length" :items="bulkActionItems" :pending="isBulkActionPending"
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
                v-model:column-visibility="columnVisibility" :columns="columns" :data="roles" :get-row-id="(item) => item.id"
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
