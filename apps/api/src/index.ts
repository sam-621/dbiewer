import { createApp } from '@/app';
import { config } from '@/config';
import { createDatabase } from '@/persistence/database';
import { createLogger } from '@/services/logger';

const logger = createLogger('server');
const database = createDatabase(config.DATABASE_URL);
const adminDatabase = createDatabase(config.ADMIN_DATABASE_URL);

const server = createApp(database.db, adminDatabase.db).listen(config.PORT, () => {
  logger.info(`api listening on http://localhost:${config.PORT}/graphql`);
});

const shutdown = () => {
  server.close(async () => {
    await Promise.all([database.pool.end(), adminDatabase.pool.end()]);
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
