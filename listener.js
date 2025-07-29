import 'dotenv/config';
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  replication: 'database',
});

async function start() {
  const setupClient = new Client({ connectionString: process.env.DATABASE_URL });
  await setupClient.connect();

  // Ensure the test table exists
  await setupClient.query(`
    CREATE TABLE IF NOT EXISTS test_table (
      id SERIAL PRIMARY KEY,
      name TEXT
    );
  `);

  // Insert a test row
  await setupClient.query(`INSERT INTO test_table (name) VALUES ('hello realtime') RETURNING *;`);
  console.log("Inserted test row into test_table.");

  await setupClient.end();

  // Start replication stream
  await client.connect();
  await client.query(
    "START_REPLICATION SLOT other_db LOGICAL 0/0 (\"pretty-print\" '1')"
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

start().catch(console.error);
