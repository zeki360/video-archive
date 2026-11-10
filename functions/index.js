const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const crypto = require("crypto");

const authProjectId = process.env.AUTH_PROJECT_ID || "video-archive-1f8b8";
admin.initializeApp({ projectId: authProjectId });

const storage = new Storage();
const targetBucketName = process.env.TARGET_STORAGE_BUCKET;
const targetBucket = targetBucketName ? storage.bucket(targetBucketName) : null;
const allowedMethods = ["POST", "OPTIONS"];
const signedUrlLifetimeMs = 15 * 60 * 1000;

function setCors(response) {
  const origin = response.req.get("Origin");
  if (origin === "https://video-archive-1f8b8.web.app" || origin === "http://localhost:8080") {
    response.set("Access-Control-Allow-Origin", origin);
  }
  response.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.set("Access-Control-Allow-Methods", allowedMethods.join(", "));
}

async function authenticate(request) {
  const authorization = request.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) {
    throw new Error("Missing Firebase ID token.");
  }
  return admin.auth().verifyIdToken(authorization.slice("Bearer ".length));
}

function requireUserPath(uid, objectPath) {
  if (typeof objectPath !== "string" || !objectPath.startsWith(`users/${uid}/uploads/`)) {
    throw new Error("Invalid storage path.");
  }
  return objectPath;
}

exports.createUploadUrl = onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const user = await authenticate(request);
    if (!targetBucket) {
      throw new Error("TARGET_STORAGE_BUCKET is not configured.");
    }
    const { contentType, fileName } = request.body || {};
    if (typeof contentType !== "string" || !contentType.startsWith("video/")) {
      response.status(400).json({ error: "Only video uploads are supported." });
      return;
    }
    if (typeof fileName !== "string" || fileName.length === 0 || fileName.length > 255) {
      response.status(400).json({ error: "A valid file name is required." });
      return;
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const objectPath = `users/${user.uid}/uploads/${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;
    const [uploadUrl] = await targetBucket.file(objectPath).getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + signedUrlLifetimeMs,
      contentType
    });

    response.json({ objectPath, uploadUrl, contentType });
  } catch (error) {
    logger.error("Could not create an upload URL.", error);
    response.status(401).json({ error: "Unable to authorize the upload." });
  }
});

exports.createDownloadUrl = onRequest(async (request, response) => {
  setCors(response);
  if (request.method === "OPTIONS") {
    response.status(204).send("");
    return;
  }
  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." });
    return;
  }

  try {
    const user = await authenticate(request);
    if (!targetBucket) {
      throw new Error("TARGET_STORAGE_BUCKET is not configured.");
    }
    const objectPath = requireUserPath(user.uid, request.body && request.body.objectPath);
    const [downloadUrl] = await targetBucket.file(objectPath).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + signedUrlLifetimeMs
    });
    response.json({ downloadUrl });
  } catch (error) {
    logger.error("Could not create a download URL.", error);
    response.status(401).json({ error: "Unable to authorize the download." });
  }
});
