const { Storage } = require('@google-cloud/storage');

const storage = new Storage({ keyFilename: './serviceAccountKey.json' });

async function run() {
  const [buckets] = await storage.getBuckets();
  buckets.forEach(b => console.log(b.name));
}

run().catch((err) => console.error('ERROR:', err.message));