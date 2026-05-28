/**
 * Seed the DynamoDB table with the initial family roster.
 *
 * Prerequisites:
 *   - .env.local must contain valid AWS_* and DYNAMODB_TABLE_NAME vars.
 *   - The CDK stacks must have been deployed (aws/cdk).
 *
 * Usage:
 *   node --env-file=.env.local --import tsx/esm scripts/seed-roster.ts
 *
 * The initial password for all users is set via SEED_PASSWORD env var.
 * Change each user's password through the admin UI after first login.
 */

import { createUser } from "../src/lib/repos/users";

const SEED_PASSWORD = process.env.SEED_PASSWORD;

if (!SEED_PASSWORD) {
  console.error("Set SEED_PASSWORD=<password> before running this script.");
  process.exit(1);
}

const ROSTER: Array<{
  displayName: string;
  role?: "member" | "admin";
  email?: string;
}> = [
  { displayName: "Angela", role: "member" },
  { displayName: "Maria", role: "member" },
  { displayName: "Nina", role: "member" },
  { displayName: "Sofia", role: "member" },
];

async function seed() {
  console.log(`Seeding ${ROSTER.length} users into DynamoDB…`);

  for (const entry of ROSTER) {
    const user = await createUser({
      displayName: entry.displayName,
      plainPassword: SEED_PASSWORD as string,
      role: entry.role,
      email: entry.email,
    });
    console.log(`  Created ${user.displayName} (id: ${user.id})`);
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
