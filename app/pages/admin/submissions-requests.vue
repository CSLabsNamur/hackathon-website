<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import CreateSubmissionRequestModal from "~/components/admin/submission-request/CreateModal.vue";
import EditSubmissionRequestModal from "~/components/admin/submission-request/EditModal.vue";
import RemoveSubmissionRequestModal from "~/components/admin/submission-request/RemoveModal.vue";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import type { Row } from "@tanstack/vue-table";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {
  status: submissionsStatus,
  data: submissionRequests,
  refresh: refreshSubmissionRequests,
} = await useSubmissionsRequests({lazy: true});
const {status: participantsStatus, data: participants} = await useParticipants({lazy: false});

const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

const dayjs = useDayjs();
const overlay = useOverlay();
const createModal = overlay.create(CreateSubmissionRequestModal);
const editModal = overlay.create(EditSubmissionRequestModal);
const removeModal = overlay.create(RemoveSubmissionRequestModal);

const columns = computed<TableColumn<SubmissionRequest>[]>(() => [
  {
    header: "Titre",
    accessorKey: "title",
    cell: ({row}) => h("div", {class: "truncate max-w-36", title: row.original.title}, row.original.title),
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({row}) => h("div", {
      class: "truncate max-w-[40rem]",
      title: row.original.description,
    }, row.original.description!),
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({row}) => {
      if (row.original.type === SubmissionType.FILE) {
        return row.original.multiple ? "Fichiers" : "Fichier";
      } else if (row.original.type === SubmissionType.TEXT) {
        return "Texte";
      }
    },
  },
  {
    header: "Date limite",
    accessorKey: "deadline",
    cell: ({row}) => h("div", {title: dayjs(row.original.deadline).format("DD/MM/YYYY HH:mm")}, dayjs(row.original.deadline).format("DD/MM/YYYY")),
  },
  {
    header: "Date de création",
    accessorKey: "createdAt",
    cell: ({row}) => dayjs(row.original.createdAt).format("DD/MM/YYYY"),
  },
  {
    header: "Taux de soumission",
    accessorFn: (row: SubmissionRequest) => {
      if (!participants.value) return "? %";
      const totalParticipants = participants.value.length;
      const submissionsCount = row.submissions.length;
      const rate = totalParticipants === 0 ? 0 : (submissionsCount / totalParticipants) * 100;
      return `${rate.toFixed(2)} %`;
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
                "aria-label": `Actions pour la demande de soumission ${row.original.title}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour la demande de soumission ${row.original.title}`,
              }),
          ),
      );
    },
  },
]);

const openCreateModal = async () => {
  const result = await createModal.open();
  if (result) await refreshSubmissionRequests();
};

function getRowItems(row: Row<SubmissionRequest>): Array<DropdownMenuItem> {
  return [
    {
      type: "label",
      label: `Créée le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    {
      type: "label",
      label: "Actions",
    },
    // TODO: Implement view submissions functionality
    //{
    //  label: "Voir les soumissions",
    //  icon: "i-lucide-eye",
    //  //onSelect: () => {
    //  //},
    //},
    {
      label: "Éditer",
      icon: "i-lucide-edit-2",
      onSelect: async () => {
        const result = await editModal.open({submissionRequest: row.original});
        if (result) await refreshSubmissionRequests();
      },
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      onSelect: async () => {
        const result = await removeModal.open({submissionRequest: row.original});
        if (result) await refreshSubmissionRequests();
      },
    },
  ];
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Demandes de soumissions">
        <template #right>
          <UButton variant="ghost" icon="i-lucide-plus" :ui="{base: !$device.isDesktopOrTablet ? '!px-1.5' : undefined}"
                   @click="openCreateModal">
            <template v-if="$device.isDesktopOrTablet">Nouvelle demande</template>
          </UButton>
        </template>
      </DashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <UTable :columns="columns" :data="submissionRequests" sticky
                :loading="submissionsStatus === 'pending' || participantsStatus === 'pending'">
          <template #empty>
            <div class="max-w-1/2 mx-auto">
              <UEmpty title="Aucune demande de soumission"
                      description="Aucune demande de soumission n'a encore été créée."
                      icon="i-lucide-circle-slash"/>
            </div>
          </template>
        </UTable>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
