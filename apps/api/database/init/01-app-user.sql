CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user';
GRANT USAGE ON SCHEMA public TO app_user;
