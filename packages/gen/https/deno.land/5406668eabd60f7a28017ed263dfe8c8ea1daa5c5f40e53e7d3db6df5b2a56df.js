import { parseDsn } from "../utils.ts";
function getPgEnv() {
    return {
        database: Deno.env.get("PGDATABASE"),
        hostname: Deno.env.get("PGHOST"),
        port: Deno.env.get("PGPORT"),
        user: Deno.env.get("PGUSER"),
        password: Deno.env.get("PGPASSWORD"),
        applicationName: Deno.env.get("PGAPPNAME"),
    };
}
export class ConnectionParamsError extends Error {
    constructor(message) {
        super(message);
        this.name = "ConnectionParamsError";
    }
}
function formatMissingParams(missingParams) {
    return `Missing connection parameters: ${missingParams.join(", ")}`;
}
function assertRequiredOptions(options, requiredKeys, has_env_access) {
    const missingParams = [];
    for (const key of requiredKeys) {
        if (options[key] === "" ||
            options[key] === null ||
            options[key] === undefined) {
            missingParams.push(key);
        }
    }
    if (missingParams.length) {
        let missing_params_message = formatMissingParams(missingParams);
        if (!has_env_access) {
            missing_params_message +=
                "\nConnection parameters can be read from environment variables only if Deno is run with env permission";
        }
        throw new ConnectionParamsError(missing_params_message);
    }
}
function parseOptionsFromDsn(connString) {
    const dsn = parseDsn(connString);
    if (dsn.driver !== "postgres" && dsn.driver !== "postgresql") {
        throw new ConnectionParamsError(`Supplied DSN has invalid driver: ${dsn.driver}.`);
    }
    let enforceTls = false;
    if (dsn.params.sslmode) {
        const sslmode = dsn.params.sslmode;
        delete dsn.params.sslmode;
        if (sslmode !== "require" && sslmode !== "prefer") {
            throw new ConnectionParamsError(`Supplied DSN has invalid sslmode '${sslmode}'. Only 'require' or 'prefer' are supported`);
        }
        if (sslmode === "require") {
            enforceTls = true;
        }
    }
    return {
        ...dsn,
        tls: { enforce: enforceTls },
        applicationName: dsn.params.application_name,
    };
}
const DEFAULT_OPTIONS = {
    applicationName: "deno_postgres",
    hostname: "127.0.0.1",
    port: "5432",
    tls: {
        enforce: false,
    },
};
export function createParams(params = {}) {
    if (typeof params === "string") {
        params = parseOptionsFromDsn(params);
    }
    let pgEnv = {};
    let has_env_access = true;
    try {
        pgEnv = getPgEnv();
    }
    catch (e) {
        if (e instanceof Deno.errors.PermissionDenied) {
            has_env_access = false;
        }
        else {
            throw e;
        }
    }
    let port;
    if (params.port) {
        port = String(params.port);
    }
    else if (pgEnv.port) {
        port = String(pgEnv.port);
    }
    else {
        port = DEFAULT_OPTIONS.port;
    }
    const connection_options = {
        applicationName: params.applicationName ?? pgEnv.applicationName ??
            DEFAULT_OPTIONS.applicationName,
        database: params.database ?? pgEnv.database,
        hostname: params.hostname ?? pgEnv.hostname ?? DEFAULT_OPTIONS.hostname,
        password: params.password ?? pgEnv.password,
        port,
        tls: {
            enforce: !!params?.tls?.enforce ?? DEFAULT_OPTIONS.tls.enforce,
        },
        user: params.user ?? pgEnv.user,
    };
    assertRequiredOptions(connection_options, ["database", "hostname", "port", "user", "applicationName"], has_env_access);
    const connection_parameters = {
        ...connection_options,
        database: connection_options.database,
        port: parseInt(connection_options.port, 10),
        user: connection_options.user,
    };
    if (isNaN(connection_parameters.port)) {
        throw new ConnectionParamsError(`Invalid port ${connection_parameters.port}`);
    }
    return connection_parameters;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdGlvbl9wYXJhbXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb25uZWN0aW9uX3BhcmFtcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBbUJ2QyxTQUFTLFFBQVE7SUFDZixPQUFPO1FBQ0wsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQztRQUNwQyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUM1QixRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO1FBQ3BDLGVBQWUsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7S0FDM0MsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsS0FBSztJQUM5QyxZQUFZLE9BQWU7UUFDekIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQztJQUN0QyxDQUFDO0NBQ0Y7QUFnQ0QsU0FBUyxtQkFBbUIsQ0FBQyxhQUF1QjtJQUNsRCxPQUFPLGtDQUNMLGFBQWEsQ0FBQyxJQUFJLENBQ2hCLElBQUksQ0FFUixFQUFFLENBQUM7QUFDTCxDQUFDO0FBU0QsU0FBUyxxQkFBcUIsQ0FDNUIsT0FBMEIsRUFDMUIsWUFBeUMsRUFFekMsY0FBdUI7SUFFdkIsTUFBTSxhQUFhLEdBQWdDLEVBQUUsQ0FBQztJQUN0RCxLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRTtRQUM5QixJQUNF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