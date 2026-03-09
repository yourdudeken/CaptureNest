const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const STORAGE = process.env.STORAGE_TYPE || 'local'; // 'local'|'s3'
const LOCAL_PATH = process.env.LOCAL_MEDIA_PATH || './media';

let s3;
if (STORAGE === 's3') {
  s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    endpoint: process.env.S3_ENDPOINT || undefined, // for MinIO
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true'
  });
}

async function saveFileLocal(fileBuffer, filename) {
  await fs.promises.mkdir(LOCAL_PATH, { recursive: true });
  const dest = path.join(LOCAL_PATH, filename);
  await fs.promises.writeFile(dest, fileBuffer);
  return { storage: 'local', path: dest, key: filename };
}

async function saveFileS3(fileBuffer, filename, contentType) {
  const bucket = process.env.S3_BUCKET || 'CaptureNest';
  await s3.putObject({ Bucket: bucket, Key: filename, Body: fileBuffer, ContentType: contentType }).promise();
  return { storage: 's3', key: filename };
}

module.exports = {
  async save(buffer, filename, contentType) {
    if (STORAGE === 's3') return saveFileS3(buffer, filename, contentType);
    return saveFileLocal(buffer, filename);
  }
};
