import { lookup as getMimeExtension } from "mime-types";

const DEFAULT_CONTENT_TYPE = "image/jpeg";

function getContainerSasUrl() {
  return process.env.AZURE_BLOB_SAS_URL?.trim() || "";
}

export function hasBlobStorageConfig() {
  return Boolean(getContainerSasUrl());
}

function parseContainerSasUrl() {
  const raw = getContainerSasUrl();

  if (!raw) {
    return null;
  }

  const url = new URL(raw);
  const segments = url.pathname.split("/").filter(Boolean);
  const container = segments[0];

  if (!container) {
    throw new Error("AZURE_BLOB_SAS_URL must point to a blob container");
  }

  return {
    url,
    origin: url.origin,
    container,
    query: url.search,
  };
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid card image payload");
  }

  const contentType = match[1] || DEFAULT_CONTENT_TYPE;
  const base64 = match[2];
  const buffer = Buffer.from(base64, "base64");
  const extension = getExtensionFromContentType(contentType);

  return { contentType, buffer, extension };
}

function getExtensionFromContentType(contentType: string) {
  const extension = getMimeExtension(contentType);

  if (!extension || Array.isArray(extension)) {
    return "jpg";
  }

  return extension === "jpeg" ? "jpg" : extension;
}

function normalizeBlobName(blobName: string) {
  return blobName
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function buildSignedBlobUrl(blobUrl: string) {
  const config = parseContainerSasUrl();

  if (!config) {
    return blobUrl;
  }

  const url = new URL(blobUrl);

  if (url.origin !== config.origin) {
    return blobUrl;
  }

  if (!url.pathname.startsWith(`/${config.container}/`)) {
    return blobUrl;
  }

  url.search = config.query;
  return url.toString();
}

function buildCanonicalBlobUrl(blobName: string) {
  const config = parseContainerSasUrl();

  if (!config) {
    throw new Error("Azure Blob storage is not configured");
  }

  const normalizedName = normalizeBlobName(blobName);
  return `${config.origin}/${config.container}/${normalizedName}`;
}

export function resolveCardImageUrl(cardImage?: string | null) {
  if (!cardImage) {
    return undefined;
  }

  if (cardImage.startsWith("data:")) {
    return cardImage;
  }

  if (cardImage.includes("blob.core.windows.net")) {
    return buildSignedBlobUrl(cardImage);
  }

  return cardImage;
}

export function getStoredCardImageValue(cardImage?: string | null) {
  if (!cardImage) {
    return undefined;
  }

  if (cardImage.startsWith("data:")) {
    return cardImage;
  }

  if (cardImage.includes("blob.core.windows.net")) {
    return cardImage.split("?")[0];
  }

  return cardImage;
}

export async function uploadCardImageToBlob(input: {
  cardImage: string;
  userId: string;
  contactId: string;
}) {
  if (!hasBlobStorageConfig()) {
    return input.cardImage;
  }

  if (!input.cardImage.startsWith("data:")) {
    return input.cardImage;
  }

  const config = parseContainerSasUrl();

  if (!config) {
    return input.cardImage;
  }

  const { contentType, buffer, extension } = parseDataUrl(input.cardImage);
  const blobName = `cards/${input.userId}/${input.contactId}-${Date.now()}.${extension}`;
  const canonicalUrl = buildCanonicalBlobUrl(blobName);
  const signedUrl = buildSignedBlobUrl(canonicalUrl);

  const response = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": contentType || DEFAULT_CONTENT_TYPE,
    },
    body: buffer,
  });

  if (!response.ok) {
    throw new Error(`Azure Blob upload failed: ${response.status}`);
  }

  return canonicalUrl;
}

export async function deleteCardImageFromBlob(cardImage?: string | null) {
  if (!cardImage || !hasBlobStorageConfig()) {
    return;
  }

  if (cardImage.startsWith("data:")) {
    return;
  }

  if (!cardImage.includes("blob.core.windows.net")) {
    return;
  }

  const signedUrl = buildSignedBlobUrl(cardImage);

  const response = await fetch(signedUrl, {
    method: "DELETE",
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Azure Blob delete failed: ${response.status}`);
  }
}
