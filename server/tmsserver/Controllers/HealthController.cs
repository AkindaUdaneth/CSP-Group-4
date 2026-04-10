using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System;
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
    }
}