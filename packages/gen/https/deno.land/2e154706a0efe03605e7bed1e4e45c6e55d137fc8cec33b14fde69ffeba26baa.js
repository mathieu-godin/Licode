import { DB_CLIENTS, DB_DIALECTS, URL_BASE_VERSIONED } from "../consts.ts";
export function getConfigTemplate(dialect) {
    let client;
    let importString;
    if (dialect === DB_DIALECTS.PGSQL) {
        client = `const client = new ClientPostgreSQL({
    database: "nessie",
    hostname: "localhost",
    port: 5432,
    user: "root",
    password: "pwd",
});`;
        importString = `import {
    ClientPostgreSQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
    }
    else if (dialect === DB_DIALECTS.MYSQL) {
        client = `const client = new ClientMySQL({
    hostname: "localhost",
    port: 3306,
    username: "root",
    // password: "pwd", // uncomment this line for <8
    db: "nessie",
});`;
        importString = `import {
    ClientMySQL,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
    }
    else if (dialect === DB_DIALECTS.SQLITE) {
        client = `const client = new ClientSQLite("./sqlite.db");`;
        importString = `import {
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
    }
    else {
        client = `/** Select one of the supported clients */
// const client = new ClientPostgreSQL({
//     database: "nessie",
//     hostname: "localhost",
//     port: 5432,
//     user: "root",
//     password: "pwd",
// });

// const client = new ClientMySQL({
//     hostname: "localhost",
//     port: 3306,
//     username: "root",
//     // password: "pwd", // uncomment this line for <8
//     db: "nessie",
// });

// const client = new ClientSQLite("./sqlite.db");`;
        importString = `import {
    ClientMySQL,
    ClientPostgreSQL,
    ClientSQLite,
    NessieConfig,
} from "${URL_BASE_VERSIONED}/mod.ts";`;
    }
    const template = `${importString}

${client}

/** This is the final config object */
const config: NessieConfig = {
    client,
    migrationFolders: ["./db/migrations"],
    seedFolders: ["./db/seeds"],
};

export default config;
`;
    return template;
}
export function getMigrationTemplate(dialect) {
    let generic;
    if (dialect && dialect in DB_CLIENTS) {
        generic = DB_CLIENTS[dialect];
    }
    return `import { AbstractMigration, Info${generic ? `, ${generic}` : ""} } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractMigration${generic ? `<${generic}>` : ""} {
    /** Runs on migrate */
    async up(info: Info): Promise<void> {
    }

    /** Runs on rollback */
    async down(info: Info): Promise<void> {
    }
}
`;
}
export function getSeedTemplate(dialect) {
    let generic;
    if (dialect && dialect in DB_CLIENTS) {
        generic = DB_CLIENTS[dialect];
    }
    return `import { AbstractSeed, Info${generic ? `, ${generic}` : ""} } from "${URL_BASE_VERSIONED}/mod.ts";

export default class extends AbstractSeed${generic ? `<${generic}>` : ""} {
    /** Runs on seed */
    async run(info: Info): Promise<void> {
    }
}
`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9uZXNzaWVAMi4wLjAvY2xpL3RlbXBsYXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUczRSxNQUFNLFVBQVUsaUJBQWlCLENBQUMsT0FBb0I7SUFDcEQsSUFBSSxNQUFjLENBQUM7SUFDbkIsSUFBSSxZQUFvQixDQUFDO0lBRXpCLElBQUksT0FBTyxLQUFLLFdBQVcsQ0FBQyxLQUFLLEVBQUU7UUFDakMsTUFBTSxHQUFHOzs7Ozs7SUFNVCxDQUFDO1FBQ0QsWUFBWSxHQUFHOzs7VUFHVCxrQkFBa0IsV0FBVyxDQUFDO0tBQ3JDO1NBQU0sSUFBSSxPQUFPLEtBQUssV0FBVyxDQUFDLEtBQUssRUFBRTtRQUN4QyxNQUFNLEdBQUc7Ozs7OztJQU1ULENBQUM7UUFDRCxZQUFZLEdBQUc7OztVQUdULGtCQUFrQixXQUFXLENBQUM7S0FDckM7U0FBTSxJQUFJLE9BQU8sS0FBSyxXQUFXLENBQUMsTUFBTSxFQUFFO1FBQ3pDLE1BQU0sR0FBRyxpREFBaUQsQ0FBQztRQUMzRCxZQUFZLEdBQUc7OztVQUdULGtCQUFrQixXQUFXLENBQUM7S0FDckM7U0FBTTtRQUNMLE1BQU0sR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7bURBaUJzQyxDQUFDO1FBQ2hELFlBQVksR0FBRzs7Ozs7VUFLVCxrQkFBa0IsV0FBVyxDQUFDO0tBQ3JDO0lBRUQsTUFBTSxRQUFRLEdBQUcsR0FBRyxZQUFZOztFQUVoQyxNQUFNOzs7Ozs7Ozs7O0NBVVAsQ0FBQztJQUVBLE9BQU8sUUFBUSxDQUFDO0FBQ2xCLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsT0FBb0I7SUFDdkQsSUFBSSxPQUFPLENBQUM7SUFFWixJQUFJLE9BQU8sSUFBSSxPQUFPLElBQUksVUFBVSxFQUFFO1FBQ3BDLE9BQU8sR0FBRyxVQUFVLENBQUMsT0FBc0IsQ0FBQyxDQUFDO0tBQzlDO0lBRUQsT0FBTyxtQ0FDTCxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQzdCLFlBQVksa0JBQWtCOztnREFFZ0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFOzs7Ozs7Ozs7Q0FTNUUsQ0FBQztBQUNGLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLE9BQW9CO0lBQ2xELElBQUksT0FBTyxDQUFDO0lBRVosSUFBSSxPQUFPLElBQUksT0FBTyxJQUFJLFVBQVUsRUFBRTtRQUNwQyxPQUFPLEdBQUcsVUFBVSxDQUFDLE9BQXNCLENBQUMsQ0FBQztLQUM5QztJQUVELE9BQU8sOEJBQ0wsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUM3QixZQUFZLGtCQUFrQjs7MkNBRVcsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFOzs7OztDQUt2RSxDQUFDO0FBQ0YsQ0FBQyJ9