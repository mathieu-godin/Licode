ALTER TABLE users DROP COLUMN created_at;
ALTER TABLE users DROP COLUMN updated_at;
ALTER TABLE users ADD created_at TIMESTAMP;
ALTER TABLE users ADD updated_at TIMESTAMP;