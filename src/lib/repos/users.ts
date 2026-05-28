import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { hash, verify } from "@node-rs/argon2";
import { ulid } from "ulid";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";

export interface User {
  id: string;
  displayName: string;
  email?: string;
  role: "member" | "admin";
  passwordHash: string;
  showOnLoginRoster: boolean;
  disabledAt?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getUserById(userId: string): Promise<User | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    })
  );
  if (!result.Item) return null;
  return itemToUser(result.Item);
}

export async function createUser(params: {
  displayName: string;
  plainPassword: string;
  role?: "member" | "admin";
  email?: string;
}): Promise<User> {
  const now = new Date().toISOString();
  const userId = ulid();
  const passwordHash = await hash(params.plainPassword);

  const item = {
    PK: `USER#${userId}`,
    SK: "PROFILE",
    id: userId,
    displayName: params.displayName,
    role: params.role ?? "member",
    passwordHash,
    showOnLoginRoster: true,
    createdAt: now,
    updatedAt: now,
    ...(params.email ? { email: params.email } : {}),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  // Write roster anchor so listActiveRoster() can find this user.
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: "ROSTER#ACTIVE",
        SK: `USER#${params.displayName.toLowerCase()}`,
        userId,
        displayName: params.displayName,
      },
    })
  );

  return itemToUser(item);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}

export async function recordLastLogin(userId: string): Promise<void> {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET lastLoginAt = :now, updatedAt = :now",
      ExpressionAttributeValues: { ":now": new Date().toISOString() },
    })
  );
}

// ── Admin functions ──────────────────────────────────────────────────────────

export async function listAllUsers(): Promise<User[]> {
  const result = await ddb.send(
    new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "SK = :profile",
      ExpressionAttributeValues: { ":profile": "PROFILE" },
    })
  );
  return (result.Items ?? []).map(itemToUser);
}

export async function disableUser(
  userId: string,
  displayName: string
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: "PROFILE" },
        UpdateExpression:
          "SET disabledAt = :now, showOnLoginRoster = :false, updatedAt = :now",
        ExpressionAttributeValues: { ":now": now, ":false": false },
      })
    ),
    ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: "ROSTER#ACTIVE",
          SK: `USER#${displayName.toLowerCase()}`,
        },
      })
    ),
  ]);
}

export async function enableUser(
  userId: string,
  displayName: string
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `USER#${userId}`, SK: "PROFILE" },
        UpdateExpression:
          "SET showOnLoginRoster = :true, updatedAt = :now REMOVE disabledAt",
        ExpressionAttributeValues: { ":true": true, ":now": now },
      })
    ),
    ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: "ROSTER#ACTIVE",
          SK: `USER#${displayName.toLowerCase()}`,
          userId,
          displayName,
        },
      })
    ),
  ]);
}

export async function resetUserPassword(
  userId: string,
  newPlainPassword: string
): Promise<void> {
  const passwordHash = await hash(newPlainPassword);
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET passwordHash = :hash, updatedAt = :now",
      ExpressionAttributeValues: {
        ":hash": passwordHash,
        ":now": new Date().toISOString(),
      },
    })
  );
}

function itemToUser(item: Record<string, unknown>): User {
  return {
    id: item.id as string,
    displayName: item.displayName as string,
    role: item.role as "member" | "admin",
    passwordHash: item.passwordHash as string,
    showOnLoginRoster: item.showOnLoginRoster as boolean,
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
    ...(item.email ? { email: item.email as string } : {}),
    ...(item.disabledAt ? { disabledAt: item.disabledAt as string } : {}),
    ...(item.lastLoginAt ? { lastLoginAt: item.lastLoginAt as string } : {}),
  };
}
