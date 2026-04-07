export default defineTask({
  meta: {
    name: "emails:process",
    description: "Send pending email outbox jobs",
  },
  async run() {
    return {
      result: await processEmailOutbox(),
    };
  },
});
