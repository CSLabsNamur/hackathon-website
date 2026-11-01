<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { UButton, UDropdownMenu } from "#components";
import EditRolesModal from "~/components/admin/admins/EditRolesModal.vue";
import InviteAdminModal from "~/components/admin/admins/InviteAdminModal.vue";
import RemoveAdminModal from "~/components/admin/admins/RemoveModal.vue";
import BulkRemoveAdminModal from "~/components/admin/admins/BulkRemoveModal.vue";

definePageMeta({
  layout: {
    name: "dashboard",
    props: {
      title: "Administrateurs",
    },
  },
  middleware: "admin-auth",
  requiredPermissions: ["admins.read", "roles.read"],
});

const UBadge = resolveComponent("UBadge");
const UCheckbox = resolveComponent("UCheckbox");

const {setActions} = useDashboardNavbar();

const {status, data: admins, refresh} = await useAdmins({lazy: true});
const {data: currentAdmin, isSuperAdmin} = await useCurrentAdmin();
const {data: roles} = await useRoles();
const {renderAdminBadge, renderAdminsBadges} = useAdminsActions();
const {can} = useAbility(currentAdmin);

const overlay = useOverlay();
const inviteModal = overlay.create(InviteAdminModal);
const editRolesModal = overlay.create(EditRolesModal);
const removeModal = overlay.create(RemoveAdminModal);
const bulkRemoveModal = overlay.create(BulkRemoveAdminModal);

const toast = useToast();
const globalFilter = useSearchQuery();

const rowSelection = ref<Record<string, boolean>>({});
const selectedAdmins = computed(() => (admins.value ?? []).filter((admin) => rowSelection.value[admin.id]));

const canDeleteSelection = computed(() => selectedAdmins.value.length > 0 && selectedAdmins.value.every(canDeleteAdmin));

watch(globalFilter, () => {
  rowSelection.value = {};
});
watch(admins, (items) => {
  rowSelection.value = Object.fromEntries((items ?? []).filter((admin) => rowSelection.value[admin.id]).map((admin) => [admin.id, true]));
});

const {isLoading: isGeneratingBadges, executeImmediate: generateSelectedBadges} = useAsyncState(async () => {
  if (!can("print", "Badge") || !selectedAdmins.value.length) return;
  const badges = await renderAdminsBadges(selectedAdmins.value.map((admin) => admin.id));
  downloadBlob(badges, "badges-administrateurs.pdf");
}, undefined, {immediate: false});

const {isLoading: isRemovingSelection, executeImmediate: removeSelectedAdmins} = useAsyncState(async () => {
  if (!canDeleteSelection.value) return;
  await openBulkRemoveModal([...selectedAdmins.value]);
}, undefined, {immediate: false});

const isBulkActionPending = computed(() => isGeneratingBadges.value || isRemovingSelection.value);

const columns: NamedTableColumn<Admin>[] = [
  {
    id: "select",
    enableGlobalFilter: false,
    enableHiding: false,
    header: ({table}) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : table.getIsAllPageRowsSelected(),
          "onUpdate:modelValue": (value: boolean | "indeterminate") =>
              table.toggleAllPageRowsSelected(!!value),
          "aria-label": "Sélectionner tous les administrateurs",
          disabled: isBulkActionPending.value,
        }),
    cell: ({row}) => {
      return h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") => row.toggleSelected(!!value),
        "aria-label": `Sélectionner l'administrateur ${row.original.user.firstName} ${row.original.user.lastName}`,
        disabled: isBulkActionPending.value,
      });
    },
  },
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorFn: (row: Admin) => `${row.user.firstName} ${row.user.lastName}`,
    cell: ({row}) => `${row.original.user.firstName} ${row.original.user.lastName}`,
  },
  {
    id: "email",
    name: "Email",
    header: "Email",
    accessorFn: (row: Admin) => row.user.email,
    cell: ({row}) => row.original.user.email,
  },
  {
    id: "roles",
    name: "Rôles",
    header: "Rôles",
    accessorFn: (row: Admin) => row.user.roleAssignments.map((assignment) => assignment.role.name).join(" "),
    meta: getWrappingColumnMeta(),
    cell: ({row}) => {
      const organizerRoles = row.original.user.roleAssignments.filter((assignment) => assignment.role.key !== "participant");

      if (organizerRoles.length === 0) {
        return h("span", {class: "text-muted"}, "Aucun");
      }

      return h("div", {class: "flex flex-wrap gap-1"}, organizerRoles.map((assignment) => h(UBadge, {
        key: assignment.roleId,
        color: "neutral",
        variant: "soft",
      }, () => assignment.role.name)));
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
                "aria-label": `Actions pour l'administrateur ${row.original.user.firstName} ${row.original.user.lastName}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'administrateur ${row.original.user.firstName} ${row.original.user.lastName}`,
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
      disabled: isBulkActionPending.value,
      onSelect: () => generateSelectedBadges(),
    });
  }
  if (can("delete", "Admin")) {
    items.push({
      label: "Supprimer la sélection",
      icon: "i-lucide-trash",
      color: "error",
      description: canDeleteSelection.value ? undefined : "La sélection contient votre compte ou des administrateurs que vous ne pouvez pas supprimer.",
      disabled: !canDeleteSelection.value || isBulkActionPending.value,
      onSelect: () => removeSelectedAdmins(),
    });
  }
  return items;
});

function canDeleteAdmin(admin: Admin) {
  const targetIsSuperAdmin = admin.user.roleAssignments.some((assignment) => assignment.role.key === "super_admin");
  return can("delete", "Admin") && canManageRoleAssignments(admin, currentAdmin, roles)
      && admin.id !== currentAdmin.value?.id && (!targetIsSuperAdmin || isSuperAdmin.value);
}

async function openBulkRemoveModal(items: Admin[]) {
  const removedIds = await bulkRemoveModal.open({admins: items});
  if (!removedIds) return;
  await refresh();
}

function getRowItems(row: Row<Admin>): Array<DropdownMenuItem> {
  const canUpdateAdmin = can("update", "Admin");
  const canManageThisAdminRoles = canManageRoleAssignments(row.original, currentAdmin, roles);
  const canDeleteThisAdmin = canDeleteAdmin(row.original);

  return [
    {
      label: "Badge",
      icon: "i-lucide-id-card",
      disabled: !can("print", "Badge"),
      onSelect: async () => {
        if (!can("print", "Badge")) return;

        try {
          const badge = await renderAdminBadge(row.original);
          downloadBlob(badge, `badge-${row.original.user.firstName}-${row.original.user.lastName}.pdf`);
        } catch {
          toast.add({
            title: "Erreur",
            description: "Impossible de générer le badge.",
            color: "error",
          });
        }
      },
    },
    {
      type: "label",
      label: "Administration",
    }, {
      label: "Gérer les rôles",
      icon: "i-lucide-shield-user",
      disabled: !canUpdateAdmin || !canManageThisAdminRoles,
      onSelect: async () => {
        if (!canUpdateAdmin || !canManageThisAdminRoles) return;
        const result = await editRolesModal.open({
          admin: row.original,
          roles: roles.value ?? [],
        });
        if (result) await refresh();
      },
    }, {
      label: "Supprimer",
      icon: "i-lucide-trash",
      color: "error",
      disabled: !canDeleteThisAdmin || isBulkActionPending.value,
      onSelect: async () => {
        if (!canDeleteThisAdmin || isBulkActionPending.value) return;
        const result = await removeModal.open({admin: row.original});
        if (result) await refresh();
      },
    }];
}

async function openInviteModal() {
  if (!can("create", "Admin")) return;

  const result = await inviteModal.open({
    roles: roles.value ?? [],
  });
  if (result) {
    await refresh();
  }
}

setActions(computed(() => [
  {
    icon: "i-lucide-user-plus",
    label: "Ajouter",
    onClick: openInviteModal,
    disabled: !can("create", "Admin"),
  },
]));
</script>

<template>
  <UContainer>
    <div class="flex flex-col gap-1 lg:gap-2">
      <div v-if="status === 'success'" class="flex flex-wrap items-center justify-between gap-2">
        <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..." :disabled="isBulkActionPending"/>

        <div v-if="selectedAdmins.length" class="flex flex-wrap items-center gap-2">
          <UButton variant="ghost" icon="i-lucide-x" color="neutral" :disabled="isBulkActionPending"
                   @click="rowSelection = {}">
            <span class="text-sm text-muted">{{ selectedAdmins.length }} sélectionné(s)</span>
          </UButton>
          <UDropdownMenu v-if="bulkActionItems.length" :items="bulkActionItems" :content="{align: 'end'}">
            <UButton color="neutral" variant="soft" icon="i-lucide-settings" label="Actions"
                     :loading="isBulkActionPending" :disabled="isBulkActionPending"/>
          </UDropdownMenu>
        </div>
      </div>

      <UTable v-model:global-filter="globalFilter" v-model:row-selection="rowSelection" :columns="columns"
              :data="admins" :get-row-id="(admin) => admin.id" sticky :loading="status === 'pending'">
        <template #empty>
          <div class="max-w-1/2 mx-auto">
            <UEmpty title="Aucun admin" description="Aucun administrateur n'est encore enregistré."
                    icon="i-lucide-circle-slash"/>
          </div>
        </template>
      </UTable>
    </div>
  </UContainer>
</template>
