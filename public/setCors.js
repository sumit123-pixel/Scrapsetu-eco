const { Storage } = require('@google-cloud/storage');

const storage = new Storage({ keyFilename: './serviceAccountKey.json' });

async function run() {
  await storage.bucket('scrapsetu-92ce6.firebasestorage.app').setCorsConfiguration([
    {
      origin: ['*'],
      method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      maxAgeSeconds: 3600,
      responseHeader: ['Content-Type', 'Authorization', 'Content-Length', 'x-goog-resumable']
    }
  ]);
  console.log('CORS config applied ✅');
}

run().catch((err) => {
  console.error('MESSAGE:', err.message);
  console.error('CODE:', err.code);
});