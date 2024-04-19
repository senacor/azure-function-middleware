import { FunctionHandler, HttpHandler, InvocationContext } from '@azure/functions';
import * as appInsights from 'applicationinsights';
import { TelemetryClient } from 'applicationinsights';
import { ActivityHandler } from 'durable-functions';

import { BeforeExecutionFunction, PostExecutionFunction, isErrorResult } from '../middleware';
import { createAppInsightsLogger } from './Logger';

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
    appInsights.defaultClient.config.disableAppInsights = isDisabled;

    appInsights.start();

    console.log('Started appInsights');
}

const setupTelemetryClient = (
    req: unknown,
    context: InvocationContext,
    additionalProperties?: {
        [key: string]: string;
    },
) => {
    context.log('Setting up AppInsights');

    const telemetryClient = new TelemetryClient();
    telemetryClient.setAutoPopulateAzureProperties(true);
    telemetryClients[context.invocationId] = telemetryClient;
    Object.assign(context, { ...createAppInsightsLogger(telemetryClient) });

    const { invocationId, triggerMetadata } = context;

    telemetryClient.commonProperties = {
        invocationId,
        ...(triggerMetadata !== undefined && triggerMetadata),
        ...additionalProperties,
        ...appInsights.defaultClient.commonProperties,
    };

    context.log('Set up AppInsights');
};

const setupAppInsightForHttpTrigger: BeforeExecutionFunction<HttpHandler> = async (req, context) => {
    if (isDisabled) {
        return;
    }
    setupTelemetryClient(req, context);
};

const setupAppInsightForNonHttpTrigger: BeforeExecutionFunction = async (req, context) => {
    if (isDisabled) {
        return;
    }
    setupTelemetryClient(req, context);
};

type FinalizeAppInsightWithConfig<S = FunctionHandler, T = PostExecutionFunction<S>> = T extends (
    ...a: infer U
) => infer R
    ? (...a: [...U, LogBehavior, LogDataSanitizer]) => R
    : never;
type FinalizeAppInsightWithCurriedConfiguration<S = FunctionHandler> = (
    logBodyBehavior: LogBehavior,
    bodySanitizer: LogDataSanitizer,
) => PostExecutionFunction<S>;

type LogBehavior = 'always' | 'on_error' | 'on_success' | 'never';
type LogDataSanitizer = (data: unknown) => unknown;
const noOpLogDataSanitizer: LogDataSanitizer = (data) => data;

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

const finalizeAppInsightForHttpTrigger: PostExecutionFunction<HttpHandler> = async (req, context, result) =>
    finalizeAppInsightForHttpTriggerWithConfig(req, context, result, 'on_error', noOpLogDataSanitizer);
const finalizeAppInsightForHttpTriggerWithConfig: FinalizeAppInsightWithConfig<HttpHandler> = async (
    req,
    context,
    res,
    logBodyBehavior,
    bodySanitizer,
): Promise<void> => {
    if (isDisabled) {
        return;
    }
    context.log('Finalizing AppInsights');

    const telemetryClient = telemetryClients[context.invocationId];
    if (telemetryClient === undefined) {
        context.error(`No telemetry client could be found for invocationId ${context.invocationId}`);
        return;
    }

    const correlationContext = appInsights.getCorrelationContext();
    telemetryClient.commonProperties = {
        ['traceparent']: correlationContext?.operation.traceparent?.toString() ?? 'UNDEFINED',
        ...telemetryClient.commonProperties,
    };

    if (res === undefined) {
        context.warn("res is empty and properly shouldn't be");
    }

    if (isErrorResult(res)) {
        return;
    }

    const result = res.$result;

    if (result == undefined) {
        context.warn("res is empty and properly shouldn't be");
        return;
    }

    if (shouldLog(logBodyBehavior, result.status ? result.status >= 400 : true)) {
        context.log('Request body:', result.body ? bodySanitizer(result.body) : 'NO_REQ_BODY');
        context.log('Response body:', result.body ? bodySanitizer(result.body) : 'NO_RES_BODY');
    }

    telemetryClient.trackRequest({
        name: context.functionName,
        resultCode: result.status ?? '0',
        // important so that requests with a non-OK response show up as failed
        success: result.status ? result.status < 400 : true,
        url: req.url,
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
    });

    telemetryClient.flush();
    delete telemetryClients[context.invocationId];
    context.log('Finalized AppInsights');
};

const finalizeAppInsightForNonHttpTrigger: PostExecutionFunction<ActivityHandler> = async (req, context, result) =>
    finalizeAppInsightForNonHttpTriggerWithConfig(req, context, result, 'on_error', noOpLogDataSanitizer);
const finalizeAppInsightForNonHttpTriggerWithConfig: FinalizeAppInsightWithConfig<ActivityHandler> = async (
    req,
    context,
    result,
    logBodyBehavior: LogBehavior = 'on_error',
    bodySanitizer: LogDataSanitizer = noOpLogDataSanitizer,
): Promise<void> => {
    if (isDisabled) {
        return;
    }

    context.log('Finalizing AppInsights');
    const telemetryClient = telemetryClients[context.invocationId];
    if (telemetryClient === undefined) {
        context.error(`No telemetry client could be found for invocationId ${context.invocationId}`);
        return;
    }

    const correlationContext = appInsights.getCorrelationContext();
    telemetryClient.commonProperties = {
        ['traceparent']: correlationContext?.operation?.traceparent?.toString() ?? 'UNDEFINED',
        ...telemetryClient.commonProperties,
    };

    telemetryClient.trackRequest({
        name: context.functionName,
        resultCode: 0,
        // important so that requests with a non-OK response show up as failed
        success: !isErrorResult(result),
        url: context.functionName,
        duration: 0,
        id: correlationContext?.operation?.id ?? 'UNDEFINED',
    });

    telemetryClient.flush();
    delete telemetryClients[context.invocationId];
};

type AppInsightsObject<S = FunctionHandler> = {
    setup: BeforeExecutionFunction<S>;
    finalize: PostExecutionFunction<S>;
    finalizeWithConfig: FinalizeAppInsightWithCurriedConfiguration<S>;
};

const AppInsightForHttpTrigger: AppInsightsObject<HttpHandler> = {
    setup: setupAppInsightForHttpTrigger,
    finalize: finalizeAppInsightForHttpTrigger,
    finalizeWithConfig: (logBodyBehavior: LogBehavior, bodySanitizer: LogDataSanitizer) => (req, context, res) =>
        finalizeAppInsightForHttpTriggerWithConfig(req, context, res, logBodyBehavior, bodySanitizer),
};

const AppInsightForNoNHttpTrigger: AppInsightsObject<ActivityHandler> = {
    setup: setupAppInsightForNonHttpTrigger,
    finalize: finalizeAppInsightForNonHttpTrigger,
    finalizeWithConfig: (logBodyBehavior: LogBehavior, bodySanitizer: LogDataSanitizer) => (req, context, res) =>
        finalizeAppInsightForHttpTriggerWithConfig(req, context, res, logBodyBehavior, bodySanitizer),
};

export { AppInsightForHttpTrigger, AppInsightForNoNHttpTrigger, LogBehavior, LogDataSanitizer };
