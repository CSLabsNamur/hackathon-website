<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
// TODO: uniformize import paths throughout modals
import { AdminParticipantCautionModal, AdminParticipantsRemoveModal, ParticipantEditModal } from "#components";
import { CautionStatus, translateCautionStatus } from "#shared/utils/types";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: participants, refresh} = await useParticipants({lazy: true});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const supabase = useSupabaseClient();
const toast = useToast();
const dayjs = useDayjs();
const overlay = useOverlay();

const cautionModal = overlay.create(AdminParticipantCautionModal);
const editModal = overlay.create(ParticipantEditModal);
const removeModal = overlay.create(AdminParticipantsRemoveModal);

const downloadCV = async (participant: Participant) => {
  if (!participant.curriculumVitae) {
    return;
  }
  const blob = await supabase.storage.from("cvs").download(participant.curriculumVitae);

  if (blob.error || !blob.data) {
    toast.add({
      title: "Erreur",
      description: "Impossible de télécharger le CV.",
      color: "error",
    });
    return;
  }

  const url = URL.createObjectURL(blob.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = participant.curriculumVitae.split("/").pop() || "cv.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const columns: TableColumn<Participant>[] = [
  {
    id: "name",
    header: "Nom",
    accessorFn: (row) => `${row.user.firstName} ${row.user.lastName}`,
  },
  {
    header: "Email",
    accessorFn: (row) => row.user.email,
  },
  {
    header: "Caution",
    accessorKey: "caution",
    cell: ({row}) => {
      const val = row.getValue("caution") as CautionStatus;
      let color: BadgeProps["color"] = "neutral";

      if (val === CautionStatus.PAID) color = "success";
      else if (val === CautionStatus.NOT_PAID) color = "error";
      else if (val === CautionStatus.REFUNDED) color = "neutral";
      else if (val === CautionStatus.WAIVED) color = "warning";

      return h(UBadge, {
            class: "capitalize",
            variant: "subtle",
            color,
          }, () => translateCautionStatus(val),
      );
    },
  },
  {
    header: "Équipe",
    accessorFn: (row) => row.team?.name,
  },
  {
    header: "Réseaux",
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        external: true,
        to: `https://github.com/${row.original.githubAccount.split("/").pop()}`,
      }) : null;
      const linkedIn = row.original.linkedInAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        external: true,
        to: `https://linkedin.com/in/${row.original.linkedInAccount.split("/").pop()}`,
      }) : null;
      return h("div", {class: "flex space-x-2"}, [github, linkedIn]);
    },
  },
  {
    header: "CV",
    accessorKey: "curriculumVitae",
    cell: ({row}) => {
      const cvLink = row.getValue("curriculumVitae") as string | null;
      if (cvLink) {
        return h(UButton, {
          variant: "link",
          size: "sm",
          icon: "i-lucide-download",
          onClick: () => downloadCV(row.original),
        });
      }
    },
  },
  {
    header: "École",
    accessorKey: "school",
  },
  {
    header: "Régime alimentaire",
    accessorKey: "diet",
  },
  {
    header: "Besoins spéciaux",
    accessorKey: "needs",
  },
  {
    header: "Accords",
    cell: ({row}) => {
      const newsletter = h(UCheckbox, {
        label: "Newsletter",
        modelValue: row.original.newsletter ? true : "indeterminate",
        color: row.original.newsletter ? "success" : "error",
        indeterminateIcon: "i-lucide-x",
        disabled: true,
        ui: {base: "cursor-default", label: "cursor-default"},
      });
      const imageAgreement = h(UCheckbox, {
        label: "Droit à l'image",
        modelValue: row.original.imageAgreement ? true : "indeterminate",
        color: row.original.imageAgreement ? "success" : "error",
        indeterminateIcon: "i-lucide-x",
        disabled: true,
        ui: {base: "cursor-default", label: "cursor-default"},
      });
      return h("div", {class: "flex flex-col space-y-2"}, [newsletter, imageAgreement]);
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
                "aria-label": `Actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'utilisateur ${row.original.user.firstName} ${row.original.user.lastName}`,
              }),
          ),
      );
    },
  },
  //{
  //  header: "Inscrit le",
  //  accessorKey: "createdAt",
  //  cell: ({row}) => {
  //    const date = new Date(row.getValue("createdAt") as string);
  //    return date.toLocaleDateString();
  //  },
  //}
];

function getRowItems(row: Row<Participant>): Array<DropdownMenuItem> {
  return [
    {
      type: "label",
      label: `Inscrit le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    // TODO: View profile?
    // TODO: Send email actions
    //{
    //  type: "label",
    //  label: "Actions",
    //},
    //{
    //  label: "Voir le profil",
    //  icon: "i-lucide-user",
    //},
    //{
    //  label: "Envoyer un email",
    //  icon: "i-lucide-mail",
    //},
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Gérer la caution",
      icon: "i-lucide-wallet",
      onSelect: async () => {
        const result = await cautionModal.open({participant: row.original});
        if (result) await refresh();
      },
    },
    {
      label: "Éditer l'utilisateur",
      icon: "i-lucide-edit-2",
      onSelect: async () => {
        const result = await editModal.open({participant: row.original, adminEdit: true});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer l'utilisateur",
      icon: "i-lucide-trash-2",
      onSelect: async () => {
        const result = await removeModal.open({participant: row.original});
        if (result) await refresh();
      },
    },
  ];
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Utilisateurs">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <AdminParticipantStats/>
          <UTable :columns="columns" :data="participants" sticky :loading="status === 'pending'">
            <template #empty>
              <div class="max-w-1/2 mx-auto">
                <UEmpty title="Aucun participant"
                        description="Aucun participant ne s'est encore inscrit à l'événement... Mais ça va arriver !"
                        icon="i-lucide-circle-slash"/>
              </div>
            </template>
          </UTable>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
