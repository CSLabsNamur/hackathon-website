<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { AdminParticipantCautionModal, ParticipantEditModal } from "#components";

definePageMeta({
  layout: "dashboard",
});

const {status: participantsStatus, data: participants} = await useParticipants({lazy: true});
const {status: teamsStatus, data: teams} = await useTeams({lazy: true});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const dayjs = useDayjs();
const overlay = useOverlay();

const cautionModal = overlay.create(AdminParticipantCautionModal);
const editModal = overlay.create(ParticipantEditModal);


const columns: TableColumn<ParticipantWithTeam>[] = [
  {
    id: "name",
    header: "Nom",
    accessorFn: (row: ParticipantWithTeam) => `${row.firstName} ${row.lastName}`,
  },
  {
    header: "Email",
    accessorKey: "email",
  },
  {
    header: "Caution",
    accessorKey: "caution",
    cell: ({row}) => {
      const val = row.getValue("caution") as string;
      let color: BadgeProps["color"] = "neutral";

      if (val === CautionStatus.PAID) color = "success";
      else if (val === CautionStatus.NOT_PAID) color = "error";
      else if (val === CautionStatus.REFUNDED) color = "neutral";
      else if (val === CautionStatus.WAIVED) color = "warning";

      return h(UBadge, {class: "capitalize", variant: "subtle", color}, () =>
          val,
      );
    },
  },
  {
    header: "Équipe",
    accessorFn: (row: ParticipantWithTeam) => {
      return row.team ? teams.value?.find(t => t.id === row.team?.id)?.name : "Aucune";
    },
  },
  {
    header: "Réseaux",
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        external: true,
        to: `https://github.com/${row.original.githubAccount}`,
      }) : null;
      const linkedIn = row.original.linkedInAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        external: true,
        to: `https://github.com/${row.original.linkedInAccount}`,
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
          to: cvLink,
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
                "aria-label": `Actions pour l'utilisateur ${row.original.firstName} ${row.original.lastName}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'utilisateur ${row.original.firstName} ${row.original.lastName}`,
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

function getRowItems(row: Row<ParticipantWithTeam>): Array<DropdownMenuItem> {
  return [
    {
      type: "label",
      label: `Inscrit le ${dayjs(row.original.createdAt).format("DD/MM/YYYY")}`,
      class: "text-muted",
    },
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Voir le profil",
      icon: "i-lucide-user",
    },
    {
      label: "Envoyer un email",
      icon: "i-lucide-mail",
    },
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Éditer l'utilisateur",
      icon: "i-lucide-edit-2",
      onSelect: () => {
        editModal.open({participant: row.original});
      },
    },
    {
      label: "Gérer la caution",
      icon: "i-lucide-wallet",
      onSelect: () => {
        cautionModal.open({participant: row.original});
      },
    },
    {
      label: "Réinitialiser le mot de passe",
      icon: "i-lucide-key",
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
          <UTable :columns="columns" :data="participants!" sticky/>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
