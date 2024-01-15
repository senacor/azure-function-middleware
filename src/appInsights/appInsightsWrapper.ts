import { Context, HttpRequest } from '@azure/functions';
import * as appInsights from 'applicationinsights';
import { TelemetryClient } from 'applicationinsights';

import { consoleLogger, createAppInsightsLogger } from './Logger';

type LogBehavior = 'always' | 'on_error' | 'on_success' | 'never';
type LogDataSanitizer = (data: unknown) => unknown;
const noOpLogDataSanitizer: LogDataSanitizer = (data) => data;

const telemetryClients: { [key: string]: TelemetryClient } = {};

const isDisabled =
    process.env.APPINSIGHTS_INSTRUMENTATIONKEY === undefined &&
    process.env.APPLICATIONINSIGHTS_CONNECTION_STRING === undefined;

if (!isDisabled) {
    console.log('Starting appInsights');

    appInsights
        .setup()
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(false, false)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setUseDiskRetryCaching(false)
        .setSendLiveMetrics(false)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C)
        .setAutoCollectHeartbeat(false)
        .setInternalLogging(true);

    appInsights.defaultClient.commonProperties = {
        environment: process.env.ENVIRONMENT ?? 'UNDEFINED',
        ...appInsights.defaultClient.commonProperties,
    };

    appInsights.start();

    console.log('Started appInsights');
}

const setupTelemetryClient = (context: Context, additionalProperties: object) => {
    context.log('Setting up AppInsights');

    const telemetryClient = new TelemetryClient();
    telemetryClient.setAutoPopulateAzureProperties(true);
    telemetryClients[context.invocationId] = telemetryClient;
    context.log = createAppInsightsLogger(telemetryClient);

    const { invocationId, sys } = context.bindingData;

    telemetryClient.commonProperties = {
        invocationId,
        sys,
        ...additionalProperties,
        ...appInsights.defaultClient.commonProperties,
    };

    context.log('Set up AppInsights');
};

const setupAppInsightForHttpTrigger = async (context: Context): Promise<void> => {
    if (isDisabled) {
        context.log = consoleLogger;
        return;
    }

    setupTelemetryClient(context, { params: context.req?.params });
};

const setupAppInsightForNonHttpTrigger = async (context: Context): Promise<void> => {
    if (isDisabled) {
        context.log = consoleLogger;
        return;
    }

    setupTelemetryClient(context, { workflowData: context.bindingData.workflowData });
};

const shouldLog = (logBehavior: LogBehavior, isError: boolean) => {
    switch (logBehavior) {
        case 'always':
            return true;
        case 'on_error':
            return isError;
        case 'on_success':
            return !isError;
        case 'never':
            return false;
    }
};

const finalizeAppInsightForHttpTrigger = async (
    context: Context,
    req: HttpRequest,
    logBodyBehavior: LogBehavior = 'on_error',
    bodySanitizer: LogDataSanitizer = noOpLogDataSanitizer,
): Promise<void> => {
    if (isDisabled) {
        return;
    }

    context.log('Finalizing AppInsights');

    const telemetryClient = telemetryClients[context.invocationId];

    if (telemetryClient === undefined) {
        context.log.error(`No telemetry client could be found for invocationId ${context.invocationId}`);
        return;
    }

    const correlationContext = appInsights.getCorrelationContext();
    telemetryClient.commonProperties = {
        ['traceparent']: correlationContext?.operation.traceparent?.toString() ?? 'UNDEFINED',
        ...telemetryClient.commonProperties,
    };

    if (context.res === undefined) {
        context.log.warn("context.res is empty and properly shouldn't be");
    }

    if (shouldLog(logBodyBehavior, context?.res?.status >= 400)) {
        context.log('Request body:', context.req?.body ? bodySanitizer(context.req?.body) : 'NO_REQ_BODY');
        context.log('Response body:', context.res?.body ? bodySanitizer(context.res?.body) : 'NO_RES_BODY');
    }

    telemetryClient.trackRequest({
        name: context.executionContext.functionName,
        resultCode: context.res?.status ?? '0',
        // important so that requests with a non-OK response show up as failed
        success: context.res?.status < 400 ?? 'true',
        url: req.url,
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
    });

    telemetryClient.flush();
    delete telemetryClients[context.invocationId];
    context.log('Finalized AppInsights');
};

const finalizeAppInsightForNonHttpTrigger = async (context: Context): Promise<void> => {
    if (isDisabled) {
        return;
    }
    const telemetryClient = telemetryClients[context.invocationId];

    if (telemetryClient === undefined) {
        context.log.error(`No telemetry client could be found for invocationId ${context.invocationId}`);
        return;
    }

    const correlationContext = appInsights.getCorrelationContext();
    telemetryClient.commonProperties = {
        ['traceparent']: correlationContext?.operation?.traceparent?.toString() ?? 'UNDEFINED',
        ...telemetryClient.commonProperties,
    };

    telemetryClient.trackRequest({
        name: context.executionContext.functionName,
        resultCode: 0,
        // important so that requests with a non-OK response show up as failed
        success: true,
        url: '',
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
    });

    telemetryClient.flush();
    delete telemetryClients[context.invocationId];
};

const AppInsightForHttpTrigger = {
    setup: setupAppInsightForHttpTrigger,
    finalizeAppInsight: finalizeAppInsightForHttpTrigger,
    finalizeWithConfig:
        (logBodyBehavior: LogBehavior, bodySanitizer: LogDataSanitizer) => (context: Context, req: HttpRequest) =>
            finalizeAppInsightForHttpTrigger(context, req, logBodyBehavior, bodySanitizer),
};

const AppInsightForNoNHttpTrigger = {
    setup: setupAppInsightForNonHttpTrigger,
    finalizeAppInsight: finalizeAppInsightForNonHttpTrigger,
};

export { AppInsightForHttpTrigger, AppInsightForNoNHttpTrigger, LogBehavior, LogDataSanitizer };
