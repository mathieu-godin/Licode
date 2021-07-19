import { basename, CliffySelect, CliffyToggle, exists, format, fromFileUrl, resolve, } from "../deps.ts";
import { arrayIsUnique, getLogger, isFileUrl, isMigrationFile, isUrl, } from "./utils.ts";
import { DEFAULT_MIGRATION_FOLDER, DEFAULT_SEED_FOLDER, REGEXP_FILE_NAME, } from "../consts.ts";
import { getMigrationTemplate, getSeedTemplate } from "./templates.ts";
import { NessieError } from "./errors.ts";
export class State {
    #config;
    #migrationFolders;
    #seedFolders;
    #migrationFiles;
    #seedFiles;
    client;
    logger = () => { };
    constructor(options) {
        this.#config = options.config;
        this.#migrationFolders = options.migrationFolders;
        this.#seedFolders = options.seedFolders;
        this.#migrationFiles = options.migrationFiles;
        this.#seedFiles = options.seedFiles;
        if (options.debug || this.#config.debug) {
            this.logger = getLogger();
        }
        this.client = options.config.client;
        this.client.setLogger(this.logger);
        this.logger({
            migrationFolders: this.#migrationFolders,
            seedFolders: this.#seedFolders,
            migrationFiles: this.#migrationFiles,
            seedFiles: this.#seedFiles,
        }, "State");
    }
    static async init(options) {
        if (options.debug)
            console.log("Checking config path");
        const path = isUrl(options.config)
            ? options.config
            : "file://" + resolve(Deno.cwd(), options.config);
        if (!isFileUrl(path) && !(await exists(fromFileUrl(path)))) {
            throw new NessieError(`Config file is not found at ${path}`);
        }
        const configRaw = await import(path);
        const config = configRaw.default;
        if (!config.client) {
            throw new NessieError("Client is not valid");
        }
        const { migrationFolders, seedFolders } = this
            ._parseMigrationAndSeedFolders(config);
        const { migrationFiles, seedFiles } = this._parseMigrationAndSeedFiles(config, migrationFolders, seedFolders);
        config.client.migrationFiles = migrationFiles;
        config.client.seedFiles = seedFiles;
        return new State({
            config,
            debug: options.debug,
            migrationFolders,
            migrationFiles,
            seedFolders,
            seedFiles,
        });
    }
    static _parseMigrationAndSeedFolders(options) {
        const migrationFolders = [];
        const seedFolders = [];
        if (options.migrationFolders && !arrayIsUnique(options.migrationFolders)) {
            throw new NessieError("Entries for the migration folders has to be unique");
        }
        if (options.seedFolders && !arrayIsUnique(options.seedFolders)) {
            throw new NessieError("Entries for the seed folders has to be unique");
        }
        options.migrationFolders?.forEach((folder) => {
            migrationFolders.push(resolve(Deno.cwd(), folder));
        });
        if (migrationFolders.length < 1 &&
            options.additionalMigrationFiles === undefined) {
            migrationFolders.push(resolve(Deno.cwd(), DEFAULT_MIGRATION_FOLDER));
        }
        if (!arrayIsUnique(migrationFolders)) {
            throw new NessieError("Entries for the resolved migration folders has to be unique");
        }
        options.seedFolders?.forEach((folder) => {
            seedFolders.push(resolve(Deno.cwd(), folder));
        });
        if (seedFolders.length < 1 && options.additionalSeedFiles === undefined) {
            seedFolders.push(resolve(Deno.cwd(), DEFAULT_SEED_FOLDER));
        }
        if (!arrayIsUnique(seedFolders)) {
            throw new NessieError("Entries for the resolved seed folders has to be unique");
        }
        return { migrationFolders, seedFolders };
    }
    static _parseMigrationAndSeedFiles(options, migrationFolders, seedFolders) {
        const migrationFiles = [];
        const seedFiles = [];
        migrationFolders.forEach((folder) => {
            const filesRaw = Array.from(Deno.readDirSync(folder))
                .filter((file) => file.isFile && isMigrationFile(file.name))
                .map((file) => ({
                name: file.name,
                path: "file://" + resolve(folder, file.name),
            }));
            migrationFiles.push(...filesRaw);
        });
        options.additionalMigrationFiles?.forEach((file) => {
            const path = isUrl(file) ? file : "file://" + resolve(Deno.cwd(), file);
            const fileName = basename(path);
            if (isMigrationFile(fileName)) {
                migrationFiles.push({
                    name: fileName,
                    path,
                });
            }
        });
        if (!arrayIsUnique(migrationFiles.map((file) => file.name))) {
            throw new NessieError("Entries for the migration files has to be unique");
        }
        migrationFiles.sort((a, b) => parseInt(a.name) - parseInt(b.name));
        seedFolders.forEach((folder) => {
            const filesRaw = Array.from(Deno.readDirSync(folder))
                .filter((file) => file.isFile)
                .map((file) => ({
                name: file.name,
                path: "file://" + resolve(folder, file.name),
            }));
            seedFiles.push(...filesRaw);
        });
        options.additionalSeedFiles?.forEach((file) => {
            const path = isUrl(file) ? file : "file://" + resolve(Deno.cwd(), file);
            const fileName = basename(path);
            seedFiles.push({
                name: fileName,
                path,
            });
        });
        if (!arrayIsUnique(seedFiles.map((file) => file.name))) {
            throw new NessieError("Entries for the resolved seed files has to be unique");
        }
        seedFiles.sort((a, b) => a.name.localeCompare(b.name));
        return { migrationFiles, seedFiles };
    }
    async makeMigration(migrationName = "migration") {
        if (!REGEXP_FILE_NAME.test(migrationName) || migrationName.length >= 80) {
            throw new NessieError("Migration name has to be snakecase and only include a-z (all lowercase) and 1-9");
        }
        const prefix = format(new Date(), "yyyyMMddHHmmss");
        const fileName = `${prefix}_${migrationName}.ts`;
        this.logger(fileName, "Migration file name");
        if (!isMigrationFile(fileName)) {
            throw new NessieError(`Migration name '${fileName}' is not valid`);
        }
        const selectedFolder = await this._folderPrompt(this.#migrationFolders.filter((folder) => !isUrl(folder)));
        const template = getMigrationTemplate(this.client.dialect);
        const filePath = resolve(selectedFolder, fileName);
        if (await exists(filePath)) {
            const overwrite = await this._fileExistsPrompt(filePath);
            if (!overwrite)
                return;
        }
        await Deno.writeTextFile(filePath, template);
        console.info(`Created migration ${filePath}`);
    }
    async makeSeed(seedName = "seed") {
        if (!REGEXP_FILE_NAME.test(seedName)) {
            throw new NessieError("Seed name has to be snakecase and only include a-z (all lowercase) and 1-9");
        }
        const fileName = `${seedName}.ts`;
        this.logger(fileName, "Seed file name");
        const selectedFolder = await this._folderPrompt(this.#seedFolders.filter((folder) => !isUrl(folder)));
        const template = getSeedTemplate(this.client.dialect);
        const filePath = resolve(selectedFolder, fileName);
        if (await exists(filePath)) {
            const overwrite = await this._fileExistsPrompt(filePath);
            if (!overwrite)
                return;
        }
        await Deno.writeTextFile(filePath, template);
        console.info(`Created seed ${fileName} at ${selectedFolder}`);
    }
    async _folderPrompt(folders) {
        let promptSelection = 0;
        if (folders.length > 1) {
            const promptResult = await CliffySelect.prompt({
                message: `You have multiple folder sources, where do you want to create the new file?`,
                options: folders.map((folder, i) => ({
                    value: i.toString(),
                    name: folder,
                })),
            });
            promptSelection = parseInt(promptResult);
        }
        this.logger(promptSelection, "Prompt input final");
        return folders[promptSelection];
    }
    async _fileExistsPrompt(file) {
        const result = await CliffyToggle.prompt(`The file ${file} already exists, do you want to overwrite the existing file?`);
        this.logger(result, "Toggle selection");
        return result;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJodHRwczovL2Rlbm8ubGFuZC94L25lc3NpZUAyLjAuMC9jbGkvc3RhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFFBQVEsRUFDUixZQUFZLEVBQ1osWUFBWSxFQUNaLE1BQU0sRUFDTixNQUFNLEVBQ04sV0FBVyxFQUNYLE9BQU8sR0FDUixNQUFNLFlBQVksQ0FBQztBQUNwQixPQUFPLEVBQ0wsYUFBYSxFQUNiLFNBQVMsRUFDVCxTQUFTLEVBQ1QsZUFBZSxFQUNmLEtBQUssR0FDTixNQUFNLFlBQVksQ0FBQztBQVFwQixPQUFPLEVBQ0wsd0JBQXdCLEVBQ3hCLG1CQUFtQixFQUNuQixnQkFBZ0IsR0FDakIsTUFBTSxjQUFjLENBQUM7QUFDdEIsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFNMUMsTUFBTSxPQUFPLEtBQUs7SUFDUCxPQUFPLENBQWU7SUFDdEIsaUJBQWlCLENBQVc7SUFDNUIsWUFBWSxDQUFXO0lBQ3ZCLGVBQWUsQ0FBZTtJQUM5QixVQUFVLENBQWU7SUFDbEMsTUFBTSxDQUF5QjtJQUUvQixNQUFNLEdBQWEsR0FBRyxFQUFFLEdBQUUsQ0FBQyxDQUFDO0lBRTVCLFlBQVksT0FBcUI7UUFDL0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzlCLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUM7UUFDbEQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUM5QyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFFcEMsSUFBSSxP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