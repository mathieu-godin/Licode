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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFFakMsSUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBRTdCLE9BQU8sRUFBRSxNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7QUFFekIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBR3BCLE1BQU0sVUFBVSxLQUFLLENBQUMsSUFBYztJQUNsQyxJQUFJLE9BQU8sRUFBRTtRQUNYLElBQUksRUFBRSxDQUFDO0tBQ1I7QUFDSCxDQUFDO0FBV0QsTUFBTSxDQUFDLEtBQUssVUFBVSxZQUFZLENBQUMsTUFBb0I7SUFDckQsSUFBSSxFQUFFLE1BQU0sR0FBRyxJQUFJLEVBQUUsS0FBSyxHQUFHLE1BQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQztJQUMvQyxJQUFJLE1BQU0sQ0FBQyxNQUFNO1FBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDO0lBQ25ELE9BQU8sR0FBRyxLQUFLLElBQUksT0FBTyxDQUFDO0lBRTNCLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDWCxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDcEQsTUFBTSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7S0FDcEI7U0FBTTtRQUNMLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ2xCLE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQztnQkFDZCxRQUFRLEVBQUU7b0JBQ1IsT0FBTyxFQUFFLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDO2lCQUNoRDtnQkFDRCxPQUFPLEVBQUU7b0JBQ1AsT0FBTyxFQUFFO3dCQUNQLEtBQUssRUFBRSxPQUFPO3dCQUNkLFFBQVEsRUFBRSxDQUFDLFNBQVMsQ0FBQztxQkFDdEI7aUJBQ0Y7YUFDRixDQUFDLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQzFCO2FBQU07WUFDTCxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUN4QjtLQUNGO0FBQ0gsQ0FBQyJ9