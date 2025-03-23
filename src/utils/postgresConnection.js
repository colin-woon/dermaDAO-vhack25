import { Pool } from 'pg';

let pool;

if (!global.pool) {
	pool = new Pool({
		connectionString: process.env.DATABASE_URL,
		ssl: process.env.NODE_ENV === 'production' ? {
			rejectUnauthorized: false
		} : false
	});

	// Test the connection
	pool.connect((err, client, release) => {
		if (err) {
			console.error('Database connection error:', err.stack);
		} else {
			console.log('Database connected successfully');
			release();
		}
	});

	pool.on('error', (err) => {
		console.error('Unexpected error on idle client', err);
		process.exit(-1);
	});

	global.pool = pool;
} else {
	pool = global.pool;
}

export { pool };
