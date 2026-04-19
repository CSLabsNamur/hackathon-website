---
title: Data Model
description: The core entities in the application and how they relate to each other.
---

# Data Model

The Prisma schema is the source of truth for the data model, that is, the tables, their fields, and their relationships.
This page is not a replacement for reading the schema, but rather a high-level guide to the most important entities and
how they fit together.
Its goal is to give high-level context on the main categories of tables and the key rules to keep in mind when working
with them.

## Identity and access

These tables define who exists in the application and what they can do:

- `User`
- `Admin`
- `Participant`
- `Role`
- `Permission`
- `UserRoleAssignment`
- `RolePermission`

The main rules to keep in mind are:

- every authenticated person maps to one `User`;
- every `User` must have exactly one profile: `Admin` XOR `Participant`;
- a person's permissions are granted through roles assigned in `UserRoleAssignment`;
- permissions are defined in the shared permission catalog and linked to roles through `RolePermission`.

![Identity-erdiag.png](/diagrams/Identity-erdiag.png)

## Teams and submissions

These tables describe the actual event participation:

- `Team`
- `SubmissionRequest`
- `Submission`
- `SubmissionFile`
- `Room`
- `ScheduleItem`

A submission request can be either individual or team-level, controlled by `SubmissionRequest.teamRequest`.

In practice, this means:

- some requests create one submission per participant;
- some requests create one submission per team, but they are still attached to a participant record for storage.

![Participation-erdiag.png](/diagrams/Participation-erdiag.png)

## Settings and event configuration

These tables store the various settings that control how the event runs and what content is shown on the public website:

- `WebsiteSettings`
- `EventSettings`
- `SocialLink`

You can control things such as the event name, date, registration open/close dates, and the links shown in the website
header and footer.

## Communication and operations

Operational features have their own small models:

- `EmailOutbox` for queued emails and retries;
- `Guest` for invited people and badge generation;
- `Sponsor` for partner management and badge generation.

Sponsors are also linked to the public website "/partenaires" page.

## Practical notes

### Sensitive participant data

Participant data is not all treated equally.
Some fields such as dietary preferences, specific needs, and newsletter choices are considered sensitive and are only
returned when the current ability includes the matching permission.

### Supabase is not the main domain database

Even though Supabase provides the PostgreSQL database, the project's actual domain model is described and accessed
through Prisma.
You should think in terms of Prisma models first.

### Storage paths are references to Supabase Storage

Fields such as uploaded CVs, submission files, and event assets are stored in Supabase Storage, and the database only
keeps references to their paths.
The actual file content lives in Supabase Storage, not in the repository and not on the application container's local
filesystem, and the application code is responsible for keeping those references in sync with the actual storage
content.

If you were to add a new file field, you would need to:

1. Create the corresponding path field in the Prisma schema, for example `cvPath` for a CV upload.
2. Handle the file upload in the API route, by using the Supabase Storage client to upload the file and get its path.
3. Store the path in the database through Prisma.
4. When serving the file, use the Supabase Storage client to generate a signed URL from the stored path, and return that
   URL to the client.
