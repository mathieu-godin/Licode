import {
    ClientPostgreSQL,
    NessieConfig,
} from "https://deno.land/x/nessie/mod.ts";

const client = new ClientPostgreSQL({
    database: "licode",
    hostname: "localhost",
    port: 5432,
    user: "licode",
    password: "edocil",
});

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
