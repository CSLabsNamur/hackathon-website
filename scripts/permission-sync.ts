import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../server/prisma/generated/prisma/client.js";
import { PERMISSIONS } from "../shared/utils/authorization.js";
import type { Permission } from "../server/prisma/generated/prisma/browser.js";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({adapter});

async function main() {
  const permissionsDb: Permission[] = await prisma.permission.findMany();

  const permissionsToAdd = PERMISSIONS.filter(
    (permission) => !permissionsDb.some((dbPermission) => dbPermission.key === permission),
  );
  const permissionsToRemove = permissionsDb.filter(
    (dbPermission) => !PERMISSIONS.includes(dbPermission.key),
  );

  if (permissionsToAdd.length > 0) {
    await prisma.permission.createMany({
      data: permissionsToAdd.map((name) => ({name})),
    });
    await prisma.rolePermission.createMany({
      data: permissionsToAdd.flatMap((name) => ({
          roleId: "super-admin",
          permissionName: name,
        }),
      ),
    });
    console.log(`Added permissions: ${permissionsToAdd.join(", ")}`);
  }

  if (permissionsToRemove.length > 0) {
    console.warn(`The following permissions are in the database but not in the code: ${permissionsToRemove.map((p) => p.name).join(", ")}.`);
    console.warn(`This may be intentional (e.g. for legacy permissions) or it may indicate that some permissions were removed from the code but not from the database.`);
    console.warn("Do you want to remove these permissions from the database? (y/n)");

    const answer = await new Promise<string>((resolve) => {
      process.stdin.once("data", (data) => resolve(data.toString().trim().toLowerCase()));
    });

    if (answer !== "y") {
      console.log("Aborting permission synchronization.");
      return;
    }

    await prisma.permission.deleteMany({
      where: {
        name: {
          in: permissionsToRemove.map((permission) => permission.name),
        },
      },
    });
    console.log(`Removed permissions: ${permissionsToRemove.map((p) => p.name).join(", ")}`);
  }

  if (permissionsToAdd.length === 0 && permissionsToRemove.length === 0) {
    console.log("Permissions are already synchronized.");
  }
}

main()
  .then(() => {
    console.log("Permissions synchronized successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error synchronizing permissions:", error);
    process.exit(1);
  });
