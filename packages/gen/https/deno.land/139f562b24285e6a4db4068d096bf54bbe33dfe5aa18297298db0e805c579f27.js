import { COL_FILE_NAME, TABLE_MIGRATIONS } from "../consts.ts";
import { green } from "../deps.ts";
import { getDurationFromTimestamp } from "../cli/utils.ts";
import { NessieError } from "../cli/errors.ts";
export class AbstractClient {
    logger = () => undefined;
    client;
    migrationFiles = [];
    seedFiles = [];
    dialect;
    QUERY_GET_LATEST = `SELECT ${COL_FILE_NAME} FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC LIMIT 1;`;
    QUERY_GET_ALL = `SELECT ${COL_FILE_NAME} FROM ${TABLE_MIGRATIONS} ORDER BY ${COL_FILE_NAME} DESC;`;
    QUERY_MIGRATION_INSERT = (fileName) => `INSERT INTO ${TABLE_MIGRATIONS} (${COL_FILE_NAME}) VALUES ('${fileName}');`;
    QUERY_MIGRATION_DELETE = (fileName) => `DELETE FROM ${TABLE_MIGRATIONS} WHERE ${COL_FILE_NAME} = '${fileName}';`;
    constructor(options) {
        this.client = options.client;
    }
    _parseAmount(amount, maxAmount = 0, isMigration = true) {
        const defaultAmount = isMigration ? maxAmount : 1;
        if (amount === "all")
            return maxAmount;
        if (amount === undefined)
            return defaultAmount;
        if (typeof amount === "string") {
            amount = isNaN(parseInt(amount)) ? defaultAmount : parseInt(amount);
        }
        return Math.min(maxAmount, amount);
    }
    async _migrate(amount, latestMigration, queryHandler) {
        this.logger(amount, "Amount pre");
        this.logger(latestMigration, "Latest migrations");
        this._sliceMigrationFiles(latestMigration);
        amount = this._parseAmount(amount, this.migrationFiles.length, true);
        this.logger(this.migrationFiles, "Filtered and sorted migration files");
        if (amount < 1) {
            console.info("Nothing to migrate");
            return;
        }
        console.info(green(`Starting migration of ${this.migrationFiles.length} files`), "\n----\n");
        const t1 = performance.now();
        for (const [i, file] of this.migrationFiles.entries()) {
            if (i >= amount)
                break;
            console.info(green(`Migrating ${file.name}`));
            const t2 = performance.now();
            await this._migrationHandler(file, queryHandler);
            const duration2 = getDurationFromTimestamp(t2);
            console.info(`Done in ${duration2} seconds\n----\n`);
        }
        const duration1 = getDurationFromTimestamp(t1);
        console.info(green(`Migrations completed in ${duration1} seconds`));
    }
    async _rollback(amount, allMigrations, queryHandler) {
        this.logger(allMigrations, "Files to rollback");
        this.logger(amount, "Amount pre");
        if (!allMigrations || allMigrations.length < 1) {
            console.info("Nothing to rollback");
            return;
        }
        amount = this._parseAmount(amount, allMigrations.length, false);
        this.logger(amount, "Received amount to rollback");
        console.info(green(`Starting rollback of ${amount} files`), "\n----\n");
        const t1 = performance.now();
        for (const [i, fileName] of allMigrations.entries()) {
            if (i >= amount)
                break;
            const file = this.migrationFiles
                .find((migrationFile) => migrationFile.name === fileName);
            if (!file) {
                throw new NessieError(`Migration file '${fileName}' is not found`);
            }
            console.info(`Rolling back ${file.name}`);
            const t2 = performance.now();
            await this._migrationHandler(file, queryHandler, true);
            const duration2 = getDurationFromTimestamp(t2);
            console.info(`Done in ${duration2} seconds\n----\n`);
        }
        const duration1 = getDurationFromTimestamp(t1);
        console.info(green(`Rollback completed in ${duration1} seconds`));
    }
    async _seed(matcher = ".+.ts") {
        const files = this.seedFiles.filter((el) => el.name === matcher || new RegExp(matcher).test(el.name));
        if (files.length < 1) {
            console.info(`No seed file found with matcher '${matcher}'`);
            return;
        }
        console.info(green(`Starting seeding of ${files.length} files`), "\n----\n");
        const t1 = performance.now();
        for await (const file of files) {
            const exposedObject = {
                dialect: this.dialect,
            };
            console.info(`Seeding ${file.name}`);
            const SeedClass = (await import(file.path)).default;
            const seed = new SeedClass({ client: this.client });
            const t2 = performance.now();
            await seed.run(exposedObject);
            const duration2 = getDurationFromTimestamp(t2);
            console.info(`Done in ${duration2} seconds\n----\n`);
        }
        const duration1 = getDurationFromTimestamp(t1);
        console.info(green(`Seeding completed in ${duration1} seconds`));
    }
    setLogger(fn) {
        this.logger = fn;
    }
    splitAndTrimQueries(query) {
        return query.split(";").filter((el) => el.trim() !== "");
    }
    _sliceMigrationFiles(queryResult) {
        if (!queryResult)
            return;
        const sliceIndex = this.migrationFiles
            .findIndex((file) => file.name >= queryResult);
        if (sliceIndex !== undefined) {
            this.migrationFiles = this.migrationFiles.slice(sliceIndex + 1);
        }
    }
    async _migrationHandler(file, queryHandler, isDown = false) {
        const exposedObject = {
            dialect: this.dialect,
        };
        const MigrationClass = (await import(file.path)).default;
        const migration = new MigrationClass({ client: this.client });
        if (isDown) {
            await migration.down(exposedObject);
            await queryHandler(this.QUERY_MIGRATION_DELETE(file.name));
        }
        else {
            await migration.up(exposedObject);
            await queryHandler(this.QUERY_MIGRATION_INSERT(file.name));
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJzdHJhY3RDbGllbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJBYnN0cmFjdENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpQkEsT0FBTyxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUMvRCxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBQ25DLE9BQU8sRUFBRSx3QkFBd0IsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQzNELE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUcvQyxNQUFNLE9BQWdCLGNBQWM7SUFDeEIsTUFBTSxHQUFhLEdBQUcsRUFBRSxDQUFDLFNBQVMsQ0FBQztJQUU3QyxNQUFNLENBQVM7SUFFZixjQUFjLEdBQWlCLEVBQUUsQ0FBQztJQUVsQyxTQUFTLEdBQWlCLEVBQUUsQ0FBQztJQUU3QixPQUFPLENBQXVCO0lBRVgsZ0JBQWdCLEdBQ2pDLFVBQVUsYUFBYSxTQUFTLGdCQUFnQixhQUFhLGFBQWEsZ0JBQWdCLENBQUM7SUFDMUUsYUFBYSxHQUM5QixVQUFVLGFBQWEsU0FBUyxnQkFBZ0IsYUFBYSxhQUFhLFFBQVEsQ0FBQztJQUUzRSxzQkFBc0IsR0FBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUMvRCxlQUFlLGdCQUFnQixLQUFLLGFBQWEsY0FBYyxRQUFRLEtBQUssQ0FBQztJQUNyRSxzQkFBc0IsR0FBb0IsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUMvRCxlQUFlLGdCQUFnQixVQUFVLGFBQWEsT0FBTyxRQUFRLElBQUksQ0FBQztJQUU1RSxZQUFZLE9BQXNDO1FBQ2hELElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUMvQixDQUFDO0lBRVMsWUFBWSxDQUNwQixNQUF1QixFQUN2QixTQUFTLEdBQUcsQ0FBQyxFQUNiLFdBQVcsR0FBRyxJQUFJO1FBRWxCLE1BQU0sYUFBYSxHQUFHLFdBQVcs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