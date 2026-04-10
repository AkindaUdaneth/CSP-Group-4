using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace tmsserver.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthController : ControllerBase
    {
        private readonly string _connectionString;

        public HealthController(IConfiguration configuration)
        {
            _connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTIONSTRING") 
                ?? configuration.GetConnectionString("DefaultConnection");
        }

        // 1. The Real-Time Ping (Used by UptimeRobot & the Status Cards)
        [HttpGet]
        public async Task<IActionResult> CheckHealth()
        {
            try
            {
                if (string.IsNullOrEmpty(_connectionString))
                {
                    return StatusCode(500, new { 
                        status = "Degraded", 
                        database = "Disconnected", 
                        message = "Connection string is missing." 
                    });
                }

                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    using (var command = connection.CreateCommand())
                    {
                        command.CommandText = "SELECT 1";
                        await command.ExecuteScalarAsync();
                    }
                }

                return Ok(new 
                { 
                    status = "Healthy", 
                    database = "Connected", 
                    timestamp = DateTime.UtcNow 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    status = "Unhealthy", 
                    database = "Disconnected", 
                    message = "Database connection failed.",
                    error = ex.Message 
                });
            }
        }

        // 2. The Historical Data (Used for the Uptime Graph)
        [HttpGet("history")]
        public async Task<IActionResult> GetHealthHistory()
        {
            try
            {
                var historyLogs = new List<object>();

                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    using (var command = connection.CreateCommand())
                    {
                        // Fetch the last 24 hours of logs, ordered oldest to newest for graphing
                        command.CommandText = @"
                            SELECT Status, PingedAt 
                            FROM dbo.SystemHealthLogs 
                            WHERE PingedAt >= DATEADD(day, -1, GETUTCDATE())
                            ORDER BY PingedAt ASC;";

                        using (var reader = await command.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                historyLogs.Add(new 
                                {
                                    status = reader["Status"].ToString(),
                                    pingedAt = Convert.ToDateTime(reader["PingedAt"])
                                });
                            }
                        }
                    }
                }

                return Ok(new 
                { 
                    success = true,
                    data = historyLogs
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false,
                    message = "Failed to retrieve health history.",
                    error = ex.Message 
                });
            }
        }
    }
}