<script setup lang="ts">
import type { BadgeProps } from "#ui/components/Badge.vue";
import type { Row } from "@tanstack/vue-table";
import type { DropdownMenuItem } from "#ui/components/DropdownMenu.vue";
import { UBadge, UButton, UDropdownMenu } from "#components";
import EditModal from "~/components/admin/teams/EditModal.vue";
import RemoveModal from "~/components/admin/teams/RemoveModal.vue";

definePageMeta({
  layout: "dashboard",
  middleware: "admin-auth",
});

const {status, data: teams, refresh} = await useTeams({lazy: true});

const toast = useToast();
const dayjs = useDayjs();
const overlay = useOverlay();
const {copy} = useClipboard();

const editModal = overlay.create(EditModal);
const removeModal = overlay.create(RemoveModal);

const globalFilter = useSearchQuery();
const validityItems = [
  {label: "Valide", value: "Valide"},
  {label: "Invalide", value: "Invalide"},
] as const;

// TODO: Centralize validity check logic, which is currently duplicated and not the same between admin and participant views.
const getTeamValidity = (team: Team) => {
  return team.members.every((member) => {
    const caution = member.caution;
    return caution !== CautionStatus.NOT_PAID;
  }) ? "Valide" : "Invalide";
};

const columns: NamedTableColumn<Team>[] = [
  {
    id: "name",
    name: "Nom",
    header: ({column}) => getStrSortedHeader(column, "Nom"),
    accessorKey: "name",
  },
  {
    id: "description",
    name: "Description",
    header: "Description",
    accessorKey: "description",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "idea",
    name: "Idée",
    header: "Idée",
    accessorKey: "idea",
    meta: getWrappingColumnMeta(),
  },
  {
    id: "valid",
    name: "Validité",
    header: ({column}) => getSingleSelectFilterHeader(column, "Validité", [...validityItems]),
    accessorFn: (row) => getTeamValidity(row),
    enableGlobalFilter: false,
    filterFn: "equalsString",
    cell: ({row}) => {
      const validity = row.getValue("valid") as "Valide" | "Invalide";
      const color: BadgeProps["color"] = validity === "Valide" ? "success" : "error";

      return h(UBadge, {class: "capitalize", variant: "subtle", color}, () =>
          validity,
      );
    },
  },
  {
    id: "members",
    name: "Membres",
    header: "Membres",
    accessorFn: (row: Team) => row.members.length,
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

const columnVisibility = usePersistentColumnVisibility("admin-teams-table-column-visibility");
const columnVisibilityDropdownItems = useColumnVisibilityDropdownItems(columns, columnVisibility);

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
    // TODO: Email functionality
    //{
    //  label: "Envoyer un email",
    //  icon: "i-lucide-mail",
    //},
    {
      type: "label",
      label: "Administration",
    },
    {
      label: "Éditer l'équipe",
      icon: "i-lucide-edit-2",
      onSelect: async () => {
        const result = await editModal.open({team: row.original, adminEdit: true});
        if (result) await refresh();
      },
    },
    {
      label: "Supprimer",
      icon: "i-lucide-trash",
      onSelect: async () => {
        const result = await removeModal.open({team: row.original});
        if (result) await refresh();
      },
    },
  ];
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <DashboardNavbar title="Équipes"/>
    </template>
    <template #body>
      <UContainer>
        <div class="flex flex-col gap-4 lg:gap-6">
          <AdminTeamStats/>
          <div class="flex flex-col gap-1 lg:gap-2">
            <div v-if="status === 'success'" class="flex justify-between">
              <UInput v-model="globalFilter" class="max-w-sm" placeholder="Rechercher..."/>
              <TourHelperPopover title="Astuce : colonnes personnalisables"
                                 description="Vous pouvez choisir les colonnes à afficher dans le tableau."
                                 status-key="admin-table-column-visibility" placement="top">
                <UDropdownMenu :items="columnVisibilityDropdownItems" content-class="min-w-40" :content="{align: 'end'}"
                               aria-label="Afficher ou masquer les colonnes">
                  <UButton variant="outline" color="neutral" size="sm" label="Colonnes"/>
                </UDropdownMenu>
              </TourHelperPopover>
            </div>
            <UTable v-model:global-filter="globalFilter" v-model:column-visibility="columnVisibility"
                    :columns="columns" :data="teams" sticky :loading="status === 'pending'">
              <template #empty>
                <div class="max-w-1/2 mx-auto">
                  <UEmpty title="Aucune équipe"
                          description="Aucun équipe ne s'est encore formée."
                          icon="i-lucide-circle-slash"/>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
