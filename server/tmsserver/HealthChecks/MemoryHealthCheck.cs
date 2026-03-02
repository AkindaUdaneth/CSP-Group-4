using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace tmsserver.HealthChecks
{
    public class MemoryHealthCheck : IHealthCheck
    {
        public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        {
            var gcInfo = GC.GetGCMemoryInfo();

            var totalAvailable = gcInfo.TotalAvailableMemoryBytes;
            var memoryLoad = gcInfo.MemoryLoadBytes;

            double usageRatio = totalAvailable > 0
                ? (double)memoryLoad / totalAvailable
                : 0;

            var data = new Dictionary<string, object?>
            {
                ["memoryLoadBytes"] = memoryLoad,
                ["totalAvailableMemoryBytes"] = totalAvailable,
                ["usageRatio"] = usageRatio
            };

            if (usageRatio >= 0.9)
            {
                return Task.FromResult(
                    HealthCheckResult.Degraded(
                        description: "Memory usage is above 90%",
                        data: data));
            }

            return Task.FromResult(
                HealthCheckResult.Healthy(
                    description: "Memory usage is within acceptable range",
                    data: data));
        }
    }
}

