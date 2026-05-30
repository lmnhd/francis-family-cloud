import { DeleteCommand, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "@/lib/aws/ddb";
import { decryptSecret, encryptSecret } from "@/lib/crypto/tokens";

export type ProviderId = "dropbox";

export interface ProviderConnection {
  ownerUserId: string;
  provider: ProviderId;
  accountId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getProviderConnection(
  userId: string,
  provider: ProviderId
): Promise<ProviderConnection | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `PROVIDER#${provider}` },
    })
  );
  return result.Item ? itemToProviderConnection(result.Item) : null;
}

export async function upsertProviderConnection(params: {
  ownerUserId: string;
  provider: ProviderId;
  accountId?: string;
  accessToken: string;
  refreshToken?: string;
  expiresInSeconds?: number;
  scope?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = params.expiresInSeconds
    ? new Date(Date.now() + params.expiresInSeconds * 1000).toISOString()
    : undefined;

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${params.ownerUserId}`,
        SK: `PROVIDER#${params.provider}`,
        ownerUserId: params.ownerUserId,
        provider: params.provider,
        accessTokenEncrypted: encryptSecret(params.accessToken),
        ...(params.refreshToken
          ? { refreshTokenEncrypted: encryptSecret(params.refreshToken) }
          : {}),
        ...(params.accountId ? { accountId: params.accountId } : {}),
        ...(expiresAt ? { expiresAt } : {}),
        ...(params.scope ? { scope: params.scope } : {}),
        createdAt: now,
        updatedAt: now,
      },
    })
  );
}

export async function updateProviderAccessToken(params: {
  ownerUserId: string;
  provider: ProviderId;
  accessToken: string;
  expiresInSeconds?: number;
}): Promise<void> {
  const now = new Date().toISOString();
  const expiresAt = params.expiresInSeconds
    ? new Date(Date.now() + params.expiresInSeconds * 1000).toISOString()
    : undefined;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${params.ownerUserId}`, SK: `PROVIDER#${params.provider}` },
      UpdateExpression:
        "SET accessTokenEncrypted = :token, updatedAt = :now" +
        (expiresAt ? ", expiresAt = :expiresAt" : ""),
      ExpressionAttributeValues: {
        ":token": encryptSecret(params.accessToken),
        ":now": now,
        ...(expiresAt ? { ":expiresAt": expiresAt } : {}),
      },
    })
  );
}

export async function deleteProviderConnection(
  userId: string,
  provider: ProviderId
): Promise<void> {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `PROVIDER#${provider}` },
    })
  );
}

function itemToProviderConnection(item: Record<string, unknown>): ProviderConnection {
  return {
    ownerUserId: item.ownerUserId as string,
    provider: item.provider as ProviderId,
    accessToken: decryptSecret(item.accessTokenEncrypted as string),
    createdAt: item.createdAt as string,
    updatedAt: item.updatedAt as string,
    ...(item.refreshTokenEncrypted
      ? { refreshToken: decryptSecret(item.refreshTokenEncrypted as string) }
      : {}),
    ...(item.accountId ? { accountId: item.accountId as string } : {}),
    ...(item.expiresAt ? { expiresAt: item.expiresAt as string } : {}),
    ...(item.scope ? { scope: item.scope as string } : {}),
  };
}
