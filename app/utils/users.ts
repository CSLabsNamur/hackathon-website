export const getAvatarUrl = (user: MaybeRefOrGetter<{ user: { firstName: string, lastName: string } } | undefined>) => {
  const userValue = toValue(user);

  const seed = encodeURIComponent(`${userValue?.user.firstName} ${userValue?.user.lastName}`);
  return `https://api.dicebear.com/6.x/initials/svg?seed=${seed}`;
};
