import { Context, HttpRequest } from '@azure/functions';
import * as appInsights from 'applicationinsights';
import { TelemetryClient } from 'applicationinsights';

import { consoleLogger, createAppInsightsLogger } from './Logger';

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

const setupAppInsight = async (context: Context): Promise<void> => {
    if (isDisabled) {
        context.log = consoleLogger;
        return;
    }

    context.log('Setting up AppInsights');

    const telemetryClient = new TelemetryClient();
    telemetryClient.setAutoPopulateAzureProperties(true);
    telemetryClients[context.invocationId] = telemetryClient;
    context.log = createAppInsightsLogger(telemetryClient);

    // excluding headers because it contains sensible data
    const { headers, ...includedProperties } = context.bindingData;

    telemetryClient.commonProperties = {
        ...includedProperties,
        ...appInsights.defaultClient.commonProperties,
    };

    context.log('Set up AppInsights');
};

const finalizeAppInsightForHttpTrigger = async (context: Context, req: HttpRequest): Promise<void> => {
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

    const properties: { [key: string]: unknown } = {};

    if (context?.res?.status >= 400) {
        properties.body = context.req?.body ?? 'NO_REQ_BODY';
    }

    telemetryClient.trackRequest({
        name: context.executionContext.functionName,
        resultCode: context.res?.status ?? '0',
        // important so that requests with a non-OK response show up as failed
        success: context.res?.status < 400 ?? 'true',
        url: req.url,
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
        properties,
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

    const properties: { [key: string]: unknown } = {};

    telemetryClient.trackRequest({
        name: context.executionContext.functionName,
        resultCode: 0,
        // important so that requests with a non-OK response show up as failed
        success: true,
        url: '',
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
        properties,
    });

    telemetryClient.flush();
    delete telemetryClients[context.invocationId];
};

const AppInsightForHttpTrigger = {
    setup: setupAppInsight,
    finalizeAppInsight: finalizeAppInsightForHttpTrigger,
};

const AppInsightForNoNHttpTrigger = {
    setup: setupAppInsight,
    finalizeAppInsight: finalizeAppInsightForNonHttpTrigger,
};

export { AppInsightForHttpTrigger, AppInsightForNoNHttpTrigger };
