import { createApp } from '@/app';
import { createDatabase } from '@/persistence/database';
import { config } from '@/shared/config';
import { createLogger } from '@/shared/logger/logger';

const logger = createLogger('server');
const { db } = createDatabase(config.DATABASE_URL);

createApp(db).listen(config.PORT, () => {
  logger.info(`api listening on http://localhost:${config.PORT}/graphql`);
});
