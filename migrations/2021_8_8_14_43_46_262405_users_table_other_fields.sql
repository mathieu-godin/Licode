ALTER TABLE users ADD email TEXT;
ALTER TABLE users ADD username VARCHAR(16);
ALTER TABLE users ADD hashed_password BYTEA;
ALTER TABLE users ADD client_salt BYTEA;
ALTER TABLE users ADD server_salt BYTEA;
ALTER TABLE users ADD created_at TIMESTAMP;
ALTER TABLE users ADD updated_at TIMESTAMP;