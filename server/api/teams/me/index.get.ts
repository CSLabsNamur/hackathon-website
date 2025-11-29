export default defineEventHandler(async (event) => {
  const user = await requireAuth(event, UserRole.USER);

  //return prisma.participant.findUnique({where: {id: user.sub}}).team();

  return {
    id: "cmhxk94fi0000nsaikk69ody4",
    name: "Team Alpha",
    description: "Platform integration squad focused on auth and SSO.",
    idea: "Build a unified login experience across products.",
    token: "cmhxk94fi0001nsaihdfbklc3",
    roomId: null,
    members: [{
      "id": "cmhxk94pb0008nsaip1tjm1ce",
      "email": "aline@example.com",
      "firstName": "Aline",
      "lastName": "Boulanger",
      "githubAccount": "alineBO",
      "linkedInAccount": "aline-linkedin",
      "school": "UNamur",
      "diet": null,
      "needs": null,
      "caution": "NOT_PAID",
      "curriculumVitae": "/cvs/aline.pdf",
      "teamId": "cmhxk94fi0000nsaikk69ody4",
      "imageAgreement": true,
      "newsletter": false,
      "createdAt": "2025-11-13T15:05:11.952",
      "updatedAt": "2025-11-13T15:05:11.952",
    }, {
      "id": "cmhxk94pc0009nsaiz4mw81xh",
      "email": "bob@example.com",
      "firstName": "Bob",
      "lastName": "Baker",
      "githubAccount": "bobGH",
      "linkedInAccount": null,
      "school": "Henallux",
      "diet": "Végétarien",
      "needs": null,
      "caution": "NOT_PAID",
      "curriculumVitae": null,
      "teamId": "cmhxk94fi0000nsaikk69ody4",
      "imageAgreement": true,
      "newsletter": false,
      "createdAt": "2025-11-13T15:05:11.952",
      "updatedAt": "2025-11-13T15:05:11.952",
    }],
    createdAt: new Date("2025-11-13 15:05:11.599"),
    updatedAt: new Date("2025-11-13 15:05:11.599"),
  };
});
