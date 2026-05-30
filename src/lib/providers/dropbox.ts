import { env } from "@/lib/env";
import type { ProviderConnection } from "@/lib/repos/provider-connections";
import { updateProviderAccessToken } from "@/lib/repos/provider-connections";

const API_ORIGIN = "https://api.dropboxapi.com";
const CONTENT_ORIGIN = "https://content.dropboxapi.com";

export interface DropboxListEntry {
  id: string;
  tag: "file" | "folder";
  name: string;
  pathLower?: string;
  pathDisplay?: string;
  size?: number;
  clientModified?: string;
  serverModified?: string;
}

interface DropboxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  account_id?: string;
}

interface DropboxListResponse {
  entries: Array<Record<string, unknown>>;
  cursor: string;
  has_more: boolean;
}

export function getDropboxConfig() {
  if (!env.DROPBOX_APP_KEY || !env.DROPBOX_APP_SECRET || !env.DROPBOX_REDIRECT_URI) {
    throw new Error("Dropbox is not configured.");
  }

  return {
    appKey: env.DROPBOX_APP_KEY,
    appSecret: env.DROPBOX_APP_SECRET,
    redirectUri: env.DROPBOX_REDIRECT_URI,
  };
}

export function createDropboxAuthorizationUrl(state: string): string {
  const config = getDropboxConfig();
  const url = new URL("https://www.dropbox.com/oauth2/authorize");
  url.searchParams.set("client_id", config.appKey);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("token_access_type", "offline");
  url.searchParams.set("scope", "files.metadata.read files.content.read account_info.read");
  return url.toString();
}

export async function exchangeDropboxCode(code: string): Promise<DropboxTokenResponse> {
  const config = getDropboxConfig();
  const body = new URLSearchParams({
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  return dropboxTokenRequest(body);
}

export async function getFreshDropboxAccessToken(
  connection: ProviderConnection
): Promise<string> {
  if (
    connection.expiresAt &&
    new Date(connection.expiresAt).getTime() > Date.now() + 60_000
  ) {
    return connection.accessToken;
  }

  if (!connection.refreshToken) return connection.accessToken;

  const refreshed = await refreshDropboxToken(connection.refreshToken);
  await updateProviderAccessToken({
    ownerUserId: connection.ownerUserId,
    provider: "dropbox",
    accessToken: refreshed.access_token,
    expiresInSeconds: refreshed.expires_in,
  });

  return refreshed.access_token;
}

export async function listDropboxFolder(
  accessToken: string,
  path: string
): Promise<{ entries: DropboxListEntry[]; cursor: string; hasMore: boolean }> {
  const response = await dropboxRpc<DropboxListResponse>(
    accessToken,
    "/2/files/list_folder",
    {
      path,
      recursive: false,
      include_deleted: false,
      include_mounted_folders: true,
      limit: 100,
    }
  );

  return {
    entries: response.entries.map(toListEntry).filter(Boolean) as DropboxListEntry[],
    cursor: response.cursor,
    hasMore: response.has_more,
  };
}

export async function getDropboxMetadata(
  accessToken: string,
  path: string
): Promise<DropboxListEntry> {
  const response = await dropboxRpc<Record<string, unknown>>(
    accessToken,
    "/2/files/get_metadata",
    { path, include_deleted: false }
  );
  const metadata = toListEntry(response);
  if (!metadata) throw new Error("Dropbox did not return metadata.");
  return metadata;
}

export async function downloadDropboxFile(
  accessToken: string,
  path: string
): Promise<{ body: Buffer; metadata: DropboxListEntry; mimeType: string }> {
  const response = await fetch(`${CONTENT_ORIGIN}/2/files/download`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });

  if (!response.ok) throw new Error(await response.text());

  const metadataHeader = response.headers.get("dropbox-api-result");
  const metadata = metadataHeader
    ? toListEntry(JSON.parse(metadataHeader) as Record<string, unknown>)
    : undefined;

  if (!metadata || metadata.tag !== "file") throw new Error("Dropbox did not return file metadata.");

  return {
    body: Buffer.from(await response.arrayBuffer()),
    metadata,
    mimeType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

async function refreshDropboxToken(refreshToken: string): Promise<DropboxTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  return dropboxTokenRequest(body);
}

async function dropboxTokenRequest(body: URLSearchParams): Promise<DropboxTokenResponse> {
  const config = getDropboxConfig();
  const auth = Buffer.from(`${config.appKey}:${config.appSecret}`).toString("base64");
  const response = await fetch(`${API_ORIGIN}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as DropboxTokenResponse;
}

async function dropboxRpc<T>(
  accessToken: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${API_ORIGIN}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as T;
}

function toListEntry(entry: Record<string, unknown>): DropboxListEntry | null {
  const tag = entry[".tag"];
  if (tag !== "file" && tag !== "folder") return null;

  return {
    id: entry.id as string,
    tag,
    name: entry.name as string,
    ...(entry.path_lower ? { pathLower: entry.path_lower as string } : {}),
    ...(entry.path_display ? { pathDisplay: entry.path_display as string } : {}),
    ...(typeof entry.size === "number" ? { size: entry.size } : {}),
    ...(entry.client_modified ? { clientModified: entry.client_modified as string } : {}),
    ...(entry.server_modified ? { serverModified: entry.server_modified as string } : {}),
  };
}
