import { Logger } from '@azure/functions';
import { TelemetryClient } from 'applicationinsights';
import { SeverityLevel } from 'applicationinsights/out/Declarations/Contracts';

const consoleDefaultLog = (message: string): void => {
    console.log(message);
};

consoleDefaultLog.error = (message: string): void => {
    console.error(message);
};

consoleDefaultLog.warn = (message: string): void => {
    console.warn(message);
};

consoleDefaultLog.info = (message: string): void => {
    console.info(message);
};

consoleDefaultLog.verbose = (message: string): void => {
    console.debug(message);
};

export const consoleLogger: Logger = consoleDefaultLog;

export const createAppInsightsLogger = (telemetryClient: TelemetryClient): Logger => {
    const appInsightsLogger = (message: string): void => {
        telemetryClient.trackTrace({
            message,
            severity: SeverityLevel.Information,
        });
    };

    appInsightsLogger.error = (message: string): void => {
        telemetryClient.trackTrace({
            message,
            severity: SeverityLevel.Error,
        });
    };

    appInsightsLogger.warn = (message: string): void => {
        telemetryClient.trackTrace({
            message,
            severity: SeverityLevel.Warning,
        });
    };

    appInsightsLogger.info = (message: string): void => {
        telemetryClient.trackTrace({
            message,
            severity: SeverityLevel.Information,
        });
    };

    appInsightsLogger.verbose = (message: string): void => {
        telemetryClient.trackTrace({
            message,
            severity: SeverityLevel.Verbose,
        });
    };

    return appInsightsLogger;
};
