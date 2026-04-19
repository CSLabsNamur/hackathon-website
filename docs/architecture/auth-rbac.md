---
title: Auth & RBAC
description: Authentication, application users, roles and permissions.
---

# Auth & RBAC

Authentication and authorization are two separate concerns in the application:

- Supabase proves who the user is,
- The application database decides what the user is allowed to do.

That distinction is important because a valid Supabase account is not enough on its own.
The user also needs a valid application-side profile and matching roles.

![AuthRBAC-seqdiag.png](/diagrams/AuthRBAC-seqdiag.png)

## Identity model

There are three important layers to keep in mind:

- Supabase Auth user: the identity stored by Supabase, used for sign-in and session tokens.
    - We store the Supabase user ID in `User.supabaseAuthId`, because we need it to link a JWT to an application user.
- `User`: the application-side user model, which includes profile information and role assignments.
- profile table: exactly one of `Admin` or `Participant`.

The application enforces that a user has exactly one profile type.
A user cannot be both an admin and a participant, and they cannot be neither.

## What happens on a protected API call

For a protected route, the server does the following:

1. Read the signed-in user from the request via its JWT.
2. Resolve the matching application `User` through `supabaseAuthId`.
3. Load the user's role assignments and permission keys.
4. Build (or get from cache) the CASL ability from those permissions.
5. Check the required permission before doing any sensitive work.

This logic is centralized in the server utilities, which means new routes should reuse the existing helpers instead of
rolling their own auth checks. Read more about this in the [API documentation](/backend/api#authorization-patterns).

## Roles and permissions

Permissions are defined in the shared permission catalog.
Each permission maps to a CASL action/subject pair, for example:

- `participants.read` -> `read` on `Participant`
- `teams.update.own` -> `updateOwn` on `Team`
- `broadcasts.send` -> `send` on `Broadcast`

Roles are linked to permissions through `RolePermission`.
Users receive roles through `UserRoleAssignment`.

Two system roles are seeded by default and **HAVE** to be in the database:

- `participant`
- `super_admin`

The application assumes that these roles keys always exist, and they are used in various places as special cases.
Please check `server/prisma/seed.ts` for the exact permissions assigned to them.

Additional organizer roles can be created from the admin dashboard.

## Client-side guards vs server-side enforcement

The dashboards use route middleware to keep users away from pages they should not access.
This is useful for UX, but it is not the source of truth. Even if a user manages to load a page they should not see, the
API will still reject any unauthorized actions.

That means:

- missing middleware is a UX problem;
- missing server permission checks is a huge security problem.

## Delegation rules

Role management is strictly hierarchical: only a super-admin can assign or remove the `super_admin` role from an
organizer, and only an admin with a given permission can delegate that permission to another user.

In practice, this prevents an organizer from creating a stronger role than their own role set.
The helper that enforces this is `assertCanDelegatePermissions` in `server/utils/ability.ts`.

## Common debugging cases

### I created a user on Supabase but they cannot log in

This is because you didn't go through the API, and the user does not have a matching `User` row in the application
database, which is required to link them to a profile (Admin XOR Participant) and roles.
To fix this, create a `User` row with the correct `supabaseAuthId` and link it to a profile and roles.

### I created a user and they can log in, but they get "Forbidden" when they try to do something

This is because the user does not have the required permissions for that action.
Check the user's assigned roles and the permissions linked to those roles.
Check the permission catalog to see which permission is required for the action you're trying to perform.

If nothing else works, check the logic for that endpoint or page to see if the required permission is correct, and if
the server is properly checking the user's permissions.
In the case of API routes, check if it's correctly making the difference between the Supabase user and the application
user. If the two are swapped, it won't work.
