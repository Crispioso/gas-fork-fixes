

// Modify next.config.js
module.exports = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ['@middleware.io/agent-apm-nextjs']
  }
}

// Create instrumentation.ts file
import tracker from '@middleware.io/agent-apm-nextjs';
export function register() {
    tracker.track({
        serviceName: "<SERVICE-NAME>",
        accessToken: "<ACCESS-TOKEN>",
        target: "vercel",
    });
}

// For logs
export default async function handler(req, res) {
    tracker.warn("Warning", { "tester": "Alex" });
    tracker.error("Error");
}