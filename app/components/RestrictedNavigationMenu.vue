<script setup lang="ts">
import type { Permission as PermissionKey } from "#shared/utils/authorization";
import type { NavigationMenuItem, NavigationMenuProps } from "@nuxt/ui";

const props = defineProps<{
  user?: CurrentAuthorizedUser | null;
  items?: RestrictedNavigationItem[] | RestrictedNavigationItem[][];
} & Omit<NavigationMenuProps, "items" | "class">>();

const navigationMenuProps = computed(() => {
  const {user: _user, items: _items, ...forwardedProps} = props;
  return forwardedProps;
});
const {canPermissions} = useAbility(() => props.user);

export type RestrictedNavigationItem = Omit<NavigationMenuItem, "children"> & {
  requiredPermissions?: PermissionKey[];
  children?: RestrictedNavigationItem[];
};

const hasRequiredPermissions = (requiredPermissions?: PermissionKey[]) => canPermissions(requiredPermissions);

const groupedItems = computed<RestrictedNavigationItem[][]>(() => {
  if (props.items?.length === 0) {
    return [];
  }

  return Array.isArray(props.items?.[0])
      ? props.items as RestrictedNavigationItem[][]
      : [props.items as RestrictedNavigationItem[]];
});

const links: ComputedRef<NavigationMenuItem[][]> = computed(() => groupedItems.value
    .map((group) => group
        .filter((item) => hasRequiredPermissions(item.requiredPermissions))
        .map(({requiredPermissions: _requiredPermissions, children, ...item}) => ({
          ...item,
          children: children
              ?.filter((child) => hasRequiredPermissions(child.requiredPermissions))
              .map(({requiredPermissions: _childRequiredPermissions, ...child}) => child),
        }))),
);
</script>

<template>
  <UNavigationMenu v-bind="{...$attrs, ...navigationMenuProps}" :items="links" orientation="vertical" tooltip popover/>
</template>
