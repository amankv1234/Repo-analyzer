import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

interface MetricsState {
  httpRequestsTotal: Map<string, number>;
  requestDurationSum: number;
  requestDurationCount: number;
}

const metrics: MetricsState = {
  httpRequestsTotal: new Map(),
  requestDurationSum: 0,
  requestDurationCount: 0,
};

const metricsPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.addHook("onResponse", async (request, reply) => {
    const route = request.routeOptions?.url || request.url;
    const method = request.method;
    const status = reply.statusCode;
    const key = `${method}_${route}_${status}`;

    const current = metrics.httpRequestsTotal.get(key) || 0;
    metrics.httpRequestsTotal.set(key, current + 1);

    const duration = reply.getResponseTime() / 1000;
    metrics.requestDurationSum += duration;
    metrics.requestDurationCount += 1;
  });

  // GET /metrics
  fastify.get("/metrics", async (_request, reply) => {
    const lines: string[] = [];

    lines.push("# HELP repomentor_http_requests_total Total HTTP requests handled");
    lines.push("# TYPE repomentor_http_requests_total counter");
    for (const [key, val] of metrics.httpRequestsTotal.entries()) {
      const [method, route, status] = key.split("_");
      lines.push(`repomentor_http_requests_total{method="${method}",route="${route}",status="${status}"} ${val}`);
    }

    lines.push("# HELP repomentor_http_request_duration_seconds Average HTTP latency");
    lines.push("# TYPE repomentor_http_request_duration_seconds gauge");
    const avg = metrics.requestDurationCount > 0 ? metrics.requestDurationSum / metrics.requestDurationCount : 0;
    lines.push(`repomentor_http_request_duration_seconds ${avg.toFixed(4)}`);

    lines.push("# HELP repomentor_process_uptime_seconds Process uptime");
    lines.push("# TYPE repomentor_process_uptime_seconds gauge");
    lines.push(`repomentor_process_uptime_seconds ${process.uptime().toFixed(1)}`);

    reply.header("Content-Type", "text/plain; version=0.0.4");
    return reply.send(lines.join("\n") + "\n");
  });
};

export default fp(metricsPluginCallback, { name: "metrics-plugin" });

