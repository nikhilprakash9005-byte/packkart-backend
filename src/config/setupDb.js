const fs = require('fs');
const path = require('path');
const pool = require('./db');
async function setupDatabase() {
  try {
    console.log('Setting up database...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  }
}
setupDatabase();