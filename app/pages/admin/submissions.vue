<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import CreateSubmissionModal from "~/components/admin/CreateSubmissionModal.vue";

definePageMeta({
  layout: "dashboard",
});

const dayjs = useDayjs();

const overlay = useOverlay();
const modal = overlay.create(CreateSubmissionModal);

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
    }, row.original.description),
  },
  {
    header: "Type",
    accessorKey: "type",
    cell: ({row}) => {
      if (row.original.type === "file") {
        return row.original.multiple ? "Fichiers" : "Fichier";
      } else if (row.original.type === "text") {
        return "Texte";
      }
    },
  },
  {
    header: "Date limite",
    accessorKey: "deadline",
    cell: ({row}) => dayjs(row.original.deadline).format("DD/MM/YYYY"),
  },
  {
    header: "Date de création",
    accessorKey: "createdAt",
    cell: ({row}) => dayjs(row.original.createdAt).format("DD/MM/YYYY"),
  },
  {
    header: "Taux de soumission",
    accessorFn: (row: SubmissionRequest) => {
      const totalParticipants = participants.value.length;
      const submissionsCount = participants.value.flatMap(p => p.submissions).filter((s) => s.requestId === row.id).length;
      const rate = totalParticipants === 0 ? 0 : (submissionsCount / totalParticipants) * 100;
      return `${rate.toFixed(2)} %`;
    },
  },
]);
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Demandes de soumissions">
        <template #right>
          <UButton variant="ghost" icon="i-lucide-plus" @click="modal.open()"
                   :ui="{base: !$device.isDesktopOrTablet ? '!px-1.5' : undefined}">
            <template v-if="$device.isDesktopOrTablet">Nouvelle demande</template>
          </UButton>
        </template>
      </DashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <UTable :columns="columns" :data="submissionRequests" sticky/>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
