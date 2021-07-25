import {
    AbstractMigration,
    Info,
    ClientPostgreSQL,
} from "https://deno.land/x/nessie@2.0.0/mod.ts";

export default class extends AbstractMigration<ClientPostgreSQL> {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
        await this.client.queryArray(
            "CREATE TABLE users (id BIGSERIAL PRIMARY KEY, email TEXT, " +
                "username VARCHAR(16), hashed_password BYTEA(512), " +
                "client_salt BYTEA(1024), " +
                "server_salt BYTEA(1024), " +
                "created_at TIMESTAMP, updated_at TIMESTAMP)"
        );
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {}
}
