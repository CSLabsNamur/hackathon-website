<script setup lang="ts">
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";
import { UBadge, UButton, UDropdownMenu } from "#components";
import EditRolesModal from "~/components/admin/admins/EditRolesModal.vue";
import InviteAdminModal from "~/components/admin/admins/InviteAdminModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
  requiredPermissions: ["admins.read", "roles.read"],
});

const {status, data: admins, refresh} = await useAdmins({lazy: true});
const {data: currentAdmin} = await useCurrentAdmin();
const {data: roles} = await useRoles();
const {renderAdminBadge} = useAdminsActions();
const {can} = useAbility(currentAdmin);

const overlay = useOverlay();
const inviteModal = overlay.create(InviteAdminModal);
const editRolesModal = overlay.create(EditRolesModal);
const toast = useToast();

const globalFilter = useSearchQuery();

const columns: NamedTableColumn<Admin>[] = [
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
    id: "badge",
    name: "Badge",
    header: "Badge",
    enableGlobalFilter: false,
    cell: ({row}) => {
      const canPrintBadge = can("print", "Badge");

      return h(UButton, {
        icon: "i-lucide-id-card",
        color: "neutral",
        variant: "ghost",
        disabled: !canPrintBadge,
        "aria-label": `Générer le badge pour ${row.original.user.firstName} ${row.original.user.lastName}`,
        loadingAuto: true,
        onClick: async () => {
          if (!canPrintBadge) return;

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
      }, () => "Générer");
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

function getRowItems(row: Row<Admin>): Array<DropdownMenuItem> {
  const canUpdateAdmin = can("update", "Admin");
  const canManageThisAdminRoles = canManageRoleAssignments(row.original, currentAdmin, roles);

  return [{
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
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Administrateurs">
        <template #right>
          <UButton icon="i-lucide-user-plus" :disabled="!can('create', 'Admin')" @click="openInviteModal">
            Ajouter
          </UButton>
        </template>
      </DashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-1 lg:gap-2">
          <div v-if="status === 'success'" class="flex justify-between">
            <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
          </div>
          <UTable v-model:global-filter="globalFilter" :columns="columns" :data="admins" sticky
                  :loading="status === 'pending'">
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
  </UDashboardPanel>
</template>
