const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('Error: DATABASE_URL is not defined in .env file');
    process.exit(1);
}

// Debug logs
console.log('--- DB CONNECTION DEBUG ---');
console.log('Reading .env from:', path.join(__dirname, '../.env'));
console.log('Connecting to:', databaseUrl.split('@')[1]); // Show only host part
console.log('---------------------------');

const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running migration...');
        await pool.query(schemaSql);
        console.log('Migration completed successfully.');

        // Seed Admin if not exists
        const adminCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        if (adminCheck.rows.length === 0) {
            console.log('Seeding admin user...');
            const bcrypt = require('bcryptjs');
            const hash = await bcrypt.hash('password123', 12);
            await pool.query(`
                INSERT INTO users (username, email, password_hash, full_name, role)
                VALUES ('admin', 'admin@example.com', $1, 'System Admin', 'admin')
             `, [hash]);
            console.log('Admin user seeded (admin/password123).');
        }

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
