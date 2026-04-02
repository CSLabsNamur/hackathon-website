<script setup lang="ts">
import { UButton } from "#components";
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
    id: "badge",
    name: "Badge",
    header: "Badge",
    enableGlobalFilter: false,
    cell: ({row}) => h(UButton, {
      icon: "i-lucide-id-card",
      color: "neutral",
      variant: "ghost",
      "aria-label": `Générer le badge pour ${row.original.user.firstName} ${row.original.user.lastName}`,
      loadingAuto: true,
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
