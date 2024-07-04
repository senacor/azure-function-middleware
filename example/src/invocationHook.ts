import { PostInvocationContext, PreInvocationContext, app } from '@azure/functions';

app.hook.preInvocation((context: PreInvocationContext) => {
    if (context.invocationContext.options.trigger.type === 'httpTrigger') {
        context.invocationContext.log(
            `preInvocation hook executed for http function ${context.invocationContext.functionName}`,
        );
    }
});

app.hook.postInvocation((context: PostInvocationContext) => {
    if (context.invocationContext.options.trigger.type === 'httpTrigger') {
        context.invocationContext.log(
            `postInvocation hook executed for http function ${context.invocationContext.functionName}`,
        );
    }
});
