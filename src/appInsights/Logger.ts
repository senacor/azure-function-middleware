import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

import { stringify } from '../util/stringify';

interface Logger {
    log(...args: any[]): void;
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

export const consoleLogger: Logger = {
    debug(...args: any[]): void {
        console.debug(args);
    },
    error(...args: any[]): void {
        console.error(args);
    },
    info(...args: any[]): void {
        console.info(args);
    },
    log(...args: any[]): void {
        console.log(args);
    },
    trace(...args: any[]): void {
        console.trace(args);
    },
    warn(...args: any[]): void {
        console.warn(args);
    },
};

export const createAppInsightsLogger = (telemetryClient: TelemetryClient): Logger => {
    return {
        debug(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        error(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Error,
            });
        },
        info(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        log(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        trace(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        warn(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Warning,
            });
        },
    };
};
