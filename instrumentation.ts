// @ts-ignore
import tracker from '@middleware.io/agent-apm-nextjs';

export function register() {
    tracker.track({
        serviceName: "<SERVICE-NAME>",
        accessToken: "<ACCESS-TOKEN>",
        target: "vercel",
    });
}