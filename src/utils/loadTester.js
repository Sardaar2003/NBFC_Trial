/**
 * Interactive Load Testing & Latency Benchmarking Engine
 */
import { getConfig } from '../config/nbfcConfig';
import { logEvent } from './logger';

export async function runLoadTest(virtualUsers = 100, onProgress = null) {
  const startTime = performance.now();
  const config = getConfig();
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const latencies = [];

  logEvent("INFO", "LOAD_TEST", `Initiating Load Test with ${virtualUsers} Virtual Users`);

  const batchSize = Math.min(50, virtualUsers);
  const totalBatches = Math.ceil(virtualUsers / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const currentBatchCount = Math.min(batchSize, virtualUsers - batch * batchSize);
    
    // Simulate concurrent requests
    const promises = Array.from({ length: currentBatchCount }).map(async (_, idx) => {
      const reqStart = performance.now();
      try {
        // Simulate auth permission check and config evaluation
        const roles = Object.keys(config.roles);
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        const roleObj = config.roles[randomRole];
        
        // Evaluate permission check
        const hasAccess = roleObj.permissions.includes("*") || roleObj.permissions.length > 0;
        
        // Micro-delay simulation
        await new Promise((res) => setTimeout(res, Math.random() * 5 + 1));
        
        const reqEnd = performance.now();
        const duration = reqEnd - reqStart;
        latencies.push(duration);
        successfulRequests++;
      } catch (err) {
        failedRequests++;
      } finally {
        totalRequests++;
      }
    });

    await Promise.all(promises);

    if (onProgress) {
      const progressPercent = Math.round(((batch + 1) / totalBatches) * 100);
      onProgress(progressPercent);
    }
  }

  const endTime = performance.now();
  const totalDurationMs = endTime - startTime;
  const avgLatencyMs = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const minLatencyMs = Math.min(...latencies).toFixed(2);
  const maxLatencyMs = Math.max(...latencies).toFixed(2);
  const requestsPerSec = ((totalRequests / totalDurationMs) * 1000).toFixed(0);

  const results = {
    virtualUsers,
    totalRequests,
    successfulRequests,
    failedRequests,
    totalDurationMs: totalDurationMs.toFixed(2),
    avgLatencyMs,
    minLatencyMs,
    maxLatencyMs,
    requestsPerSec,
    errorRate: ((failedRequests / totalRequests) * 100).toFixed(2) + "%"
  };

  logEvent(
    "INFO",
    "LOAD_TEST",
    `Load Test Completed: ${virtualUsers} VUs | Avg Latency: ${avgLatencyMs}ms | RPS: ${requestsPerSec}`,
    results
  );

  return results;
}
