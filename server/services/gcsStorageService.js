import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local fallback uploads directory
const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Uploads a document to Google Cloud Storage Bucket or Local Storage Fallback
 * 
 * Path Hierarchy: gs://<bucket>/loans/<loanId>/<docType>/<timestamp>_<filename>
 */
export async function uploadDocumentToVault({ loanId, docType, fileName, fileBuffer, mimeType, uploadedBy }) {
  const bucketName = process.env.GCS_BUCKET_NAME || 'finvanguard-nbfc-loan-vault';
  const timestamp = Math.floor(Date.now() / 1000);
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const relativePath = `loans/${loanId}/${docType}/${timestamp}_${sanitizedFileName}`;
  const gcsUri = `gs://${bucketName}/${relativePath}`;

  // If GCS client is configured via GOOGLE_APPLICATION_CREDENTIALS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(relativePath);

      await file.save(fileBuffer, {
        contentType: mimeType,
        metadata: {
          loanId,
          docType,
          uploadedBy,
          uploadedAt: new Date().toISOString()
        }
      });

      return {
        docId: `doc_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
        loanId,
        docType,
        fileName: sanitizedFileName,
        gcsUri,
        gcsBucket: bucketName,
        relativePath,
        mimeType,
        fileSize: fileBuffer.length,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        verificationStatus: 'PENDING',
        storageMode: 'GCS_CLOUD'
      };
    } catch (err) {
      console.warn('[GCS Storage Warning] Falling back to local storage vault:', err.message);
    }
  }

  // Local Storage Fallback
  const localLoanDir = path.join(UPLOADS_DIR, loanId, docType);
  if (!fs.existsSync(localLoanDir)) {
    fs.mkdirSync(localLoanDir, { recursive: true });
  }

  const localFilePath = path.join(localLoanDir, `${timestamp}_${sanitizedFileName}`);
  fs.writeFileSync(localFilePath, fileBuffer);

  return {
    docId: `doc_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
    loanId,
    docType,
    fileName: sanitizedFileName,
    gcsUri,
    gcsBucket: bucketName,
    relativePath,
    localFilePath,
    mimeType,
    fileSize: fileBuffer.length,
    uploadedBy,
    uploadedAt: new Date().toISOString(),
    verificationStatus: 'PENDING',
    storageMode: 'LOCAL_FALLBACK'
  };
}

/**
 * Generates a GCS V4 Signed URL (or Local File Endpoint) for secure document preview
 */
export async function getDocumentSignedUrl(docObject, expiresMinutes = 15) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS) && docObject.storageMode === 'GCS_CLOUD') {
    try {
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS });
      const [url] = await storage
        .bucket(docObject.gcsBucket || process.env.GCS_BUCKET_NAME)
        .file(docObject.relativePath)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + expiresMinutes * 60 * 1000,
        });
      return url;
    } catch (err) {
      console.warn('[GCS Signed URL Warning] Could not generate signed URL:', err.message);
    }
  }

  // Fallback endpoint URL
  const serverUrl = process.env.SERVER_URL || '';
  return `${serverUrl}/api/loans/vault-file?path=${encodeURIComponent(docObject.relativePath || '')}`;
}
