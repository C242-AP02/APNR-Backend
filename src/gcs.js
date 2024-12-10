import { Storage } from '@google-cloud/storage';
import serviceAccount from "../credentials.json" assert { type: "json" };

const BUCKET_NAME = "vehicle-images-apnr-megalogic"

const storage = new Storage({
  credentials: serviceAccount
});
const bucket = storage.bucket(BUCKET_NAME);

export default async function uploadToGCS(fileBuffer, fileName, contentType) {
  try {
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      metadata: { contentType },
    });

    blobStream.end(fileBuffer);

    await new Promise((resolve, reject) => {
      blobStream.on('finish', resolve);
      blobStream.on('error', reject);
    });

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw new Error('Failed to upload to GCS');
  }
};