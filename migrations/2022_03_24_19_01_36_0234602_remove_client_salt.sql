ALTER TABLE users DROP COLUMN client_salt;
ALTER TABLE users DROP COLUMN server_salt;
ALTER TABLE users ADD salt BYTEA;