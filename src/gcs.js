import { Storage } from '@google-cloud/storage';
import { config } from 'dotenv';
config();

const BUCKET_NAME = "vehicle-images-apnr-megalogic"
const credentials = JSON.parse(
  Buffer.from(process.env.GCP_CREDENTIALS, 'base64').toString('utf8')
);

const storage = new Storage({
  credentials
});
const bucket = storage.bucket(BUCKET_NAME);

export async function uploadToGCS(fileBuffer, fileName, contentType) {
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

export async function deleteFromGCS(publicUrl) {
  try {
    const fileName = publicUrl.split(`https://storage.googleapis.com/${BUCKET_NAME}/`)[1];

    if (!fileName) {
      throw new Error("Invalid public URL");
    }
    const file = bucket.file(fileName);
    await file.delete();
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    throw new Error('Failed to delete from GCS');
  }
}