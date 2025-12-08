const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '../.env');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n--- Setup Database Connection ---');
console.log('Paste your Neon connection string below (postgresql://...):');

rl.question('> ', (answer) => {
    const newUrl = answer.trim();

    if (!newUrl.startsWith('postgresql://') && !newUrl.startsWith('postgres://')) {
        console.error('\nError: Invalid connection string. Must start with postgresql://');
        rl.close();
        return;
    }

    try {
        let envContent = '';
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        } else {
            // Create default content if missing
            envContent = [
                'PORT=5000',
                'JWT_SECRET=development_secret_key_123',
                'FRONTEND_URL=http://localhost:5173',
                ''
            ].join('\n');
        }

        const lines = envContent.split('\n');
        let found = false;

        const newLines = lines.map(line => {
            if (line.startsWith('DATABASE_URL=')) {
                found = true;
                return `DATABASE_URL=${newUrl}`;
            }
            return line;
        });

        if (!found) {
            newLines.push(`DATABASE_URL=${newUrl}`);
        }

        fs.writeFileSync(envPath, newLines.join('\n'));
        console.log('\n✅ Successfully updated DATABASE_URL in .env file!');
        console.log('You can now run: npm run db:push');
    } catch (error) {
        console.error('Failed to write .env file:', error);
    }

    rl.close();
});
