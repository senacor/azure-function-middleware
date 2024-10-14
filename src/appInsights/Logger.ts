import { KnownSeverityLevel, TelemetryClient } from 'applicationinsights';

import { stringify } from '../util/stringify';

interface Logger {
    log(...args: any[]): void;
    trace(...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
}

export const createAppInsightsLogger = (telemetryClient: TelemetryClient): Logger => {
    return {
        debug(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Information,
            });
        },
        error(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Error,
            });
        },
        info(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Information,
            });
        },
        log(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Information,
            });
        },
        trace(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Information,
            });
        },
        warn(...args: any[]): void {
            telemetryClient.trackTrace({
                message: stringify(args),
                severity: KnownSeverityLevel.Warning,
            });
        },
    };
};
