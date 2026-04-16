---
title: ADRs
description: Architecture Decision Records for the project.
---

# ADRs

ADR means `Architecture Decision Record`.

An ADR is a short document describing:

- the context of a technical choice;
- the decision that was made;
- the main alternatives that were considered;
- the consequences of the decision.

The goal is give the next maintainer enough context to understand why the code looks the way it does.

## When to add one

Add an ADR when a decision is likely to matter months later, for example:

- changing the deployment model;
- choosing a major library (e.g. for test suites);
- changing the UI library;
- changing how authorization or data storage works, etc.

Do not create ADRs for every small refactor. The goal is to capture decisions that are likely to be relevant in the
future, not to document every change.

## Existing ADRs

- [Nuxt](/adrs/nuxt)
- [Prisma](/adrs/prisma)
- [Supabase](/adrs/supabase)
