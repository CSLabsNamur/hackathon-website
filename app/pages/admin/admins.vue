<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import InviteAdminModal from "~/components/admin/admins/InviteAdminModal.vue";

definePageMeta({
  layout: "dashboard",
});

const {status, data: admins, refresh} = await useAdmins({lazy: true});

const dayjs = useDayjs();
const overlay = useOverlay();
const inviteModal = overlay.create(InviteAdminModal);

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
