import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  replication: 'database',
});

async function start() {
  await client.connect();

  // Start streaming changes from our slot
  await client.query(
    "START_REPLICATION SLOT hakima_db LOGICAL 0/0 (\"pretty-print\" '1')"
  );

  client.on('copyData', (chunk) => {
    const msg = chunk.toString('utf8', 25); // Skip headers
    if (msg.trim()) {
      try {
        const json = JSON.parse(msg);
        console.log('Realtime change:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.error('Parse error', msg);
      }
    }
  });
}

start();
