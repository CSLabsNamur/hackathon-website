---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Hackathon Docs"
  text: "Developer documentation for the Hackathon platform"
  actions:
    - theme: brand
      text: Start with Onboarding
      link: /onboarding/
    - theme: alt
      text: Explore the Architecture
      link: /architecture/

features:
  - title: Onboarding
    details: Get the Hackathon platform running on your local machine in a few steps.
    link: /onboarding/
  - title: Architecture
    details: Understand the high-level structure of the application and how the different parts interact.
    link: /architecture/
  - title: Frontend & Backend
    details: Dive into the implementation details of the frontend and backend codebases.
    link: /frontend/
  - title: ADRs
    details: Review the main technical decisions made in the project and their rationale.
    link: /adrs/
---

## Getting started

This documentation is meant for developers maintaining the Hackathon platform.
It is assumed that you already have the basics of web development.
This will also not replace the official documentation of the frameworks and libraries used in the project, but rather
complement it by providing a more focused view on how they are used in this specific context.

The goal is to provide a comprehensive overview of the project, covering everything from the local setup to the
architectural decisions, how authentication is wired, where the API logic lives, which services the application depends
on, etc.

If you are new to the project, start with these pages:

- [Onboarding](/onboarding/) for the local setup and environment variables.
- [Architecture](/architecture/) for the high-level view of the application.
- [Frontend](/frontend/) and [Backend](/backend/) for the day-to-day implementation details.
- [ADRs](/adrs/) for the main technical choices already made in the project.
