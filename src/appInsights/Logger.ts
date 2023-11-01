import { Logger } from '@azure/functions';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

import { stringify } from '../util/stringify';

const consoleDefaultLog = (...args: unknown[]): void => {
    console.log(args);
};

consoleDefaultLog.error = (...args: unknown[]): void => {
    console.error(args);
};

consoleDefaultLog.warn = (...args: unknown[]): void => {
    console.warn(args);
};

consoleDefaultLog.info = (...args: unknown[]): void => {
    console.info(args);
};

consoleDefaultLog.verbose = (...args: unknown[]): void => {
    console.debug(args);
};

export const consoleLogger: Logger = consoleDefaultLog;

export const createAppInsightsLogger = (telemetryClient: TelemetryClient): Logger => {
    const appInsightsLogger = (...args: unknown[]): void => {
        telemetryClient.trackTrace({
            message: stringify(args),
            severity: SeverityLevel.Information,
        });
    };

    appInsightsLogger.error = (...args: unknown[]): void => {
        telemetryClient.trackTrace({
            message: stringify(args),
            severity: SeverityLevel.Error,
        });
    };

    appInsightsLogger.warn = (...args: unknown[]): void => {
        telemetryClient.trackTrace({
            message: stringify(args),
            severity: SeverityLevel.Warning,
        });
    };

    appInsightsLogger.info = (...args: unknown[]): void => {
        telemetryClient.trackTrace({
            message: stringify(args),
            severity: SeverityLevel.Information,
        });
    };

    appInsightsLogger.verbose = (...args: unknown[]): void => {
        telemetryClient.trackTrace({
            message: stringify(args),
            severity: SeverityLevel.Verbose,
        });
    };

    return appInsightsLogger;
};
