/*
  Warnings:

  - A unique constraint covering the columns `[supabaseAuthId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "supabaseAuthId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseAuthId_key" ON "User" ("supabaseAuthId");

-- A user cannot be both admin and participant.
DO
$$
    BEGIN
        IF EXISTS (SELECT 1
                   FROM "Admin" a
                            JOIN "Participant" p ON p."userId" = a."userId") THEN
            RAISE EXCEPTION 'A User cannot be both Admin and Participant.';
        END IF;
    END;
$$;

CREATE OR REPLACE FUNCTION "enforce_user_single_profile"()
    RETURNS trigger
    LANGUAGE plpgsql
AS
$$
BEGIN
    IF TG_TABLE_NAME = 'Admin' THEN
        IF EXISTS (SELECT 1 FROM "Participant" WHERE "userId" = NEW."userId") THEN
            RAISE EXCEPTION 'A User cannot be both Admin and Participant.';
        END IF;
    ELSIF TG_TABLE_NAME = 'Participant' THEN
        IF EXISTS (SELECT 1 FROM "Admin" WHERE "userId" = NEW."userId") THEN
            RAISE EXCEPTION 'A User cannot be both Admin and Participant.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "Admin_enforce_user_single_profile"
    BEFORE INSERT OR UPDATE OF "userId"
    ON "Admin"
    FOR EACH ROW
EXECUTE FUNCTION "enforce_user_single_profile"();

CREATE TRIGGER "Participant_enforce_user_single_profile"
    BEFORE INSERT OR UPDATE OF "userId"
    ON "Participant"
    FOR EACH ROW
EXECUTE FUNCTION "enforce_user_single_profile"();
