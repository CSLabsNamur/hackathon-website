<script setup lang="ts">
import type { TableColumn } from "#ui/components/Table.vue";
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";

definePageMeta({
  layout: "dashboard",
});

const {status, data: teams} = await useTeams({lazy: true});

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UCheckbox = resolveComponent("UCheckbox");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();
const dayjs = useDayjs();
//const overlay = useOverlay();
const {copy} = useClipboard();

const columns: TableColumn<Team>[] = [
  {
    header: "Nom",
    accessorKey: "name",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Idée",
    accessorKey: "idea",
  },
  {
    header: "Validité",
    accessorKey: "valid",
    cell: ({row}) => {
      const members = row.original.members;
      const valid = members.every(member => {
        const caution = member.caution;
        return caution === CautionStatus.PAID || caution === CautionStatus.WAIVED;
      });
      let color: BadgeProps["color"] = valid ? "success" : "error";

      return h(UBadge, {class: "capitalize", variant: "subtle", color}, () =>
          valid ? "Valide" : "Invalide",
      );
    },
  },
  {
    header: "Membres",
    accessorFn: (row: Team) => {
      return row.members.length;
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
                "aria-label": `Actions pour l'équipe ${row.original.name}`,
              },
              () => h(UButton, {
                icon: "i-lucide-ellipsis-vertical",
                color: "neutral",
                variant: "ghost",
                class: "ml-auto",
                "aria-label": `Ouvrir le menu des actions pour l'équipe ${row.original.name}`,
              }),
          ),
      );
    },
  },
  //{
  //  header: "Créée le",
  //  accessorKey: "createdAt",
  //  cell: ({row}) => {
  //    const date = new Date(row.getValue("createdAt") as string);
  //    return date.toLocaleDateString();
  //  },
  //}
];

function getRowItems(row: Row<Team>): Array<DropdownMenuItem> {
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
    {
      label: "Copier le token",
      icon: "i-lucide-clipboard-copy",
      onSelect: () => {
        copy(row.original.token);
        toast.add({
          title: "Token copié",
          description: `Le token de l'équipe ${row.original.name} a été copié dans le presse-papier.`,
          color: "success",
          duration: 1500,
        });
      },
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
      label: "Éditer l'équipe",
      icon: "i-lucide-edit-2",
      onSelect: () => {
        //editModal.open({user: row.original});
      },
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
    },
  ];
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Équipes">
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <AdminTeamStats/>
          <UTable :columns="columns" :data="teams ?? []" sticky>
            <UEmpty>
              LOADING MAYBE IDK
            </UEmpty>
          </UTable>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
