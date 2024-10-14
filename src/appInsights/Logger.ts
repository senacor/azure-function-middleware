import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

import { stringify } from '../util/stringify';

interface Logger {
    log(...args: unknown[]): void;
    trace(...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
}

export const createAppInsightsLogger = (telemetryClient: TelemetryClient): Logger => {
    return {
        debug(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Verbose,
            });
        },
        error(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Error,
            });
        },
        info(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        log(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Information,
            });
        },
        trace(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Verbose,
            });
        },
        warn(...args: unknown[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: SeverityLevel.Warning,
            });
        },
    };
};
