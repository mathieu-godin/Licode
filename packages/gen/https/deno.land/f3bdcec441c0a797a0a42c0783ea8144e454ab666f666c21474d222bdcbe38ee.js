import { log } from "../deps.ts";
let logger = log.getLogger();
export { logger as log };
let isDebug = false;
export function debug(func) {
    if (isDebug) {
        func();
    }
}
export async function configLogger(config) {
    let { enable = true, level = "INFO" } = config;
    if (config.logger)
        level = config.logger.levelName;
    isDebug = level == "DEBUG";
    if (!enable) {
        logger = new log.Logger("fakeLogger", "NOTSET", {});
        logger.level = 100;
    }
    else {
        if (!config.logger) {
            await log.setup({
                handlers: {
                    console: new log.handlers.ConsoleHandler(level),
                },
                loggers: {
                    default: {
                        level: "DEBUG",
                        handlers: ["console"],
                    },
                },
            });
            logger = log.getLogger();
        }
        else {
            logger = config.logger;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaHR0cHM6Ly9kZW5vLmxhbmQveC9teXNxbEB2Mi45LjAvc3JjL2xvZ2dlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBRWpDLElBQUksTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztBQUU3QixPQUFPLEVBQUUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRXpCLElBQUksT0FBTyxHQUFHLEtBQUssQ0FBQztBQUdwQixNQUFNLFVBQVUsS0FBSyxDQUFDLElBQWM7SUFDbEMsSUFBSSxPQUFPLEVBQUU7UUFDWCxJQUFJLEVBQUUsQ0FBQztLQUNSO0FBQ0gsQ0FBQztBQVdELE1BQU0sQ0FBQyxLQUFLLFVBQVUsWUFBWSxDQUFDLE1BQW9CO0lBQ3JELElBQUksRUFBRSxNQUFNLEdBQUcsSUFBSSxFQUFFLEtBQUssR0FBRyxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUM7SUFDL0MsSUFBSSxNQUFNLENBQUMsTUFBTTtRQUFFLEtBQUssR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQztJQUNuRCxPQUFPLEdBQUcsS0FBSyxJQUFJLE9BQU8sQ0FBQztJQUUzQixJQUFJLENBQUMsTUFBTSxFQUFFO1FBQ1gsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3BELE1BQU0sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO0tBQ3BCO1NBQU07UUFDTCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRTtZQUNsQixNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUM7Z0JBQ2QsUUFBUSxFQUFFO29CQUNSLE9BQU8sRUFBRSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQztpQkFDaEQ7Z0JBQ0QsT0FBTyxFQUFFO29CQUNQLE9BQU8sRUFBRTt3QkFDUCxLQUFLLEVBQUUsT0FBTzt3QkFDZCxRQUFRLEVBQUUsQ0FBQyxTQUFTLENBQUM7cUJBQ3RCO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUMxQjthQUFNO1lBQ0wsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDeEI7S0FDRjtBQUNILENBQUMifQ==