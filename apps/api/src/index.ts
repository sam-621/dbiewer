import { createApp } from '@/app';
import { createDatabase } from '@/persistence/database';
import { config } from '@/shared/config';

const { db } = createDatabase(config.DATABASE_URL);

createApp(db).listen(config.PORT, () => {
  console.info(`api listening on http://localhost:${config.PORT}/graphql`);
});
