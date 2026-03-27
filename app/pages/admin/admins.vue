<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import InviteAdminModal from "~/components/admin/admins/InviteAdminModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: admins, refresh} = await useAdmins({lazy: true});
const {renderAdminBadge} = useAdminsActions();

const overlay = useOverlay();
const inviteModal = overlay.create(InviteAdminModal);
const toast = useToast();
const UButton = resolveComponent("UButton");

const columns: TableColumn<Admin>[] = [
  {
    header: "Email",
    accessorFn: (row: Admin) => row.user.email,
    cell: ({row}) => row.original.user.email,
  },
  {
    header: "Prénom",
    accessorFn: (row: Admin) => row.user.firstName,
    cell: ({row}) => row.original.user.firstName,
  },
  {
    header: "Nom",
    accessorFn: (row: Admin) => row.user.lastName,
    cell: ({row}) => row.original.user.lastName,
  },
  {
    id: "badge",
    header: "Badge",
    cell: ({row}) => h(UButton, {
      icon: "i-lucide-id-card",
      color: "neutral",
      variant: "ghost",
      "aria-label": `Générer le badge pour ${row.original.user.firstName} ${row.original.user.lastName}`,
      onClick: async () => {
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
    }, () => "Générer"),
  },
];

async function openInviteModal() {
  const result = await inviteModal.open();
  if (result) {
    await refresh();
  }
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Administrateurs">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>

        <template #right>
          <UButton icon="i-lucide-user-plus" @click="openInviteModal">Ajouter</UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <UTable :columns="columns" :data="admins" sticky :loading="status === 'pending'">
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
