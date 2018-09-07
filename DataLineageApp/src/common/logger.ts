import appInsights = require("applicationinsights");
import { SeverityLevel } from "applicationinsights/out/Declarations/Contracts/Generated/index";
import exitHook = require("exit-hook");

appInsights.setup().start(); // assuming ikey is in env var

export enum LogLevel {
    Information,
    Warning,
    Error
}

export interface ILoggerProvider {
    log(msg: string, level: LogLevel):void;
}

export class ConsoleLoggerProvider implements ILoggerProvider {
    log(msg: string, level: LogLevel): void {
        switch (level) {
        case LogLevel.Information:
            console.log(`${LogLevel[level]}: ${msg}`);
            return;
        case LogLevel.Warning:
            console.warn(`${LogLevel[level]}: ${msg}`);
            return;
        case LogLevel.Error:
            console.error(`${LogLevel[level]}: ${msg}`);
            return;
        default:
            console.error(`Unknown log level ${level}, use Error instead`);
            console.error(`${LogLevel[level]}: ${msg}`);
            return;
        }
    }
}

export class AppInsightProvider implements ILoggerProvider {

    log(msg: string, level: LogLevel): void {
        const client = appInsights.defaultClient;
        let l: SeverityLevel;
        switch (level) {
        case LogLevel.Information:
            l = SeverityLevel.Information;
            break;
        case LogLevel.Warning:
            l = SeverityLevel.Warning;
            break;
        case LogLevel.Error:
            l = SeverityLevel.Error;
            break;
        default:
            client.trackTrace({ message: `Unknown log level ${level}, use Error instead`, severity: SeverityLevel.Critical });
            l = SeverityLevel.Error;
            break;
        }
        client.trackTrace({ message: msg, severity: l });
    }
}

export class Logger {
    private static readonly providers: ILoggerProvider[] = [];

    public static registerProviders(providers: ILoggerProvider[]): void {
        if (providers) {
            providers.forEach(p => Logger.providers.push(p));
        }
    }

    public static log(msg: string, level: LogLevel = LogLevel.Information): string {
        Logger.providers.forEach(p => p.log(msg, level));
        return msg;
    }

    public static error(msg: string): string {
        return Logger.log(msg, LogLevel.Error);
    }

    public static warn(msg: string): string {
        return Logger.log(msg, LogLevel.Warning);
    }
}

Logger.registerProviders([new ConsoleLoggerProvider(), new AppInsightProvider()]);

//save package information memory cache to file, this is fix for hosting on IISNode, which will terminate the nodejs application where no request for a while
exitHook(() => {
    appInsights.defaultClient.flush();
});

//every 3 minutes to save the cache, as IISNode terminate the nodejs process won't trigger exitHook
setInterval(() => { appInsights.defaultClient.flush(); }, 1000 * 60 * 3);