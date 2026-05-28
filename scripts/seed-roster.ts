/**
 * Seed the DynamoDB table with the initial family roster.
 *
 * Prerequisites:
 *   - .env.local must have valid AWS_* and DYNAMODB_TABLE_NAME vars.
 *   - CDK stacks must be deployed.
 *
 * Usage (PowerShell):
 *   $env:SEED_PASSWORD = "YourPassword"; npm run seed
 *
 * Change each user's display name later from their profile inside the app.
 * Change passwords from /admin/users after signing in as CC.
 */

import { createUser } from "../src/lib/repos/users";

const SEED_PASSWORD = process.env.SEED_PASSWORD;

if (!SEED_PASSWORD) {
  console.error("Set SEED_PASSWORD=<password> before running.");
  console.error("PowerShell: $env:SEED_PASSWORD = 'YourPassword'; npm run seed");
  process.exit(1);
}

const ROSTER: Array<{ displayName: string; role: "member" | "admin" }> = [
  { displayName: "CC",      role: "admin"  },
  { displayName: "Precious", role: "member" },
  { displayName: "Jaz",     role: "member" },
  { displayName: "Dessa",   role: "member" },
  { displayName: "Bless",   role: "member" },
  { displayName: "Isaac",   role: "member" },
  { displayName: "Nijae",   role: "member" },
];

async function seed() {
  console.log(`Seeding ${ROSTER.length} users into DynamoDB…`);
  for (const entry of ROSTER) {
    const user = await createUser({
      displayName: entry.displayName,
      plainPassword: SEED_PASSWORD as string,
      role: entry.role,
    });
    console.log(`  ${user.role === "admin" ? "★" : " "} ${user.displayName} (id: ${user.id})`);
  }
  console.log("\nDone. Sign in as CC at your app URL.");
  console.log("Go to /admin/users to manage passwords and accounts.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
