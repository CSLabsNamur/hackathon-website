/**
 * 100% AI generated temporary script to backfill supabaseAuthId for existing users.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../server/prisma/generated/prisma/client.js";

type AppUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  supabaseAuthId: string | null;
  admin: { id: string } | null;
  participant: { id: string } | null;
};

type SupabaseAuthUser = {
  id: string;
  email?: string;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({adapter});

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
const supabaseServiceKey = requiredEnv("SUPABASE_SECRET_KEY");

async function supabaseAdminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: supabaseServiceKey,
      Authorization: `Bearer ${supabaseServiceKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase Auth request failed (${response.status} ${response.statusText}): ${text}`);
  }

  return response.json() as Promise<T>;
}

async function listAuthUsers() {
  const users: SupabaseAuthUser[] = [];
  const perPage = 1000;

  for (let page = 1; ; page++) {
    const result = await supabaseAdminRequest<{ users: SupabaseAuthUser[] }>(
      `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
    );

    users.push(...result.users);

    if (result.users.length < perPage) return users;
  }
}

async function createAuthUser(user: AppUser) {
  return supabaseAdminRequest<SupabaseAuthUser>("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email: user.email,
      email_confirm: true,
      user_metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }),
  });
}

function assertSingleProfile(user: AppUser) {
  if (user.admin && user.participant) {
    throw new Error(`User ${user.email} (${user.id}) is both admin and participant.`);
  }

  if (!user.admin && !user.participant) {
    throw new Error(`User ${user.email} (${user.id}) has no admin or participant profile.`);
  }
}

async function main() {
  const appUsers = await prisma.user.findMany({
    where: {
      OR: [
        {admin: {isNot: null}},
        {participant: {isNot: null}},
      ],
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      supabaseAuthId: true,
      admin: {
        select: {
          id: true,
        },
      },
      participant: {
        select: {
          id: true,
        },
      },
    },
  });

  for (const user of appUsers) assertSingleProfile(user);

  const authUsers = await listAuthUsers();
  const authUserByEmail = new Map<string, SupabaseAuthUser>();
  for (const authUser of authUsers) {
    if (authUser.email) authUserByEmail.set(authUser.email.toLowerCase(), authUser);
  }

  for (const user of appUsers) {
    if (user.supabaseAuthId) {
      console.log(`Skipping ${user.email}: already linked to ${user.supabaseAuthId}.`);
      continue;
    }

    let authUser = authUserByEmail.get(user.email.toLowerCase());

    if (!authUser) {
      authUser = await createAuthUser(user);
      authUserByEmail.set(user.email.toLowerCase(), authUser);
      console.log(`Created Supabase Auth user for ${user.email}.`);
    } else {
      console.log(`Found existing Supabase Auth user for ${user.email}.`);
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        supabaseAuthId: authUser.id,
      },
    });

    console.log(`Linked ${user.email} to Supabase Auth user ${authUser.id}.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
