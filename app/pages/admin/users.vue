<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { AdminUserCautionModal, AdminUserEditModal } from "#components";

definePageMeta({
  layout: "dashboard",
});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const dayjs = useDayjs();
const overlay = useOverlay();

const cautionModal = overlay.create(AdminUserCautionModal);
const editModal = overlay.create(AdminUserEditModal);

const columns: TableColumn<User>[] = [
  {
    id: "name",
    header: "Nom",
    accessorFn: (row: User) => `${row.firstName} ${row.lastName}`,
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

      if (val === CautionStatus.Paid) color = "success";
      else if (val === CautionStatus.NotPaid) color = "error";
      else if (val === CautionStatus.Refunded) color = "neutral";
      else if (val === CautionStatus.Waived) color = "warning";

      return h(UBadge, {class: "capitalize", variant: "subtle", color}, () =>
          val,
      );
    },
  },
  {
    header: "Équipe",
    accessorFn: (row: User) => {
      return row.team ? teams.find(t => t.id === row.team)?.name : "Aucune";
    },
  },
  {
    header: "Réseaux",
    cell: ({row}) => {
      const github = row.original.githubAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-github",
        to: row.original.githubAccount,
      }) : null;
      const linkedin = row.original.linkedinAccount ? h(UButton, {
        variant: "link",
        size: "sm",
        icon: "i-simple-icons-linkedin",
        to: row.original.linkedinAccount,
      }) : null;
      return h("div", {class: "flex space-x-2"}, [github, linkedin]);
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

function getRowItems(row: Row<User>): Array<DropdownMenuItem> {
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
        editModal.open({user: row.original});
      },
    },
    {
      label: "Gérer la caution",
      icon: "i-lucide-wallet",
      onSelect: () => {
        cautionModal.open({user: row.original});
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
          <AdminUserStats/>
          <UTable :columns="columns" :data="users" sticky/>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
* {
  --ui-container: 90rem;
}
</style>