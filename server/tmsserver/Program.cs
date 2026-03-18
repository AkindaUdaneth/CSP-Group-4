using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Data;
using Microsoft.Data.SqlClient;
using Scalar.AspNetCore;
using tmsserver.Data;
using tmsserver.Data.Repositories;
using tmsserver.Services;

LoadDotEnv();

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddControllers();
 
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// Use AZURE_SQL_CONNECTIONSTRING environment variable
var connectionString = Environment.GetEnvironmentVariable("AZURE_SQL_CONNECTIONSTRING");

if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Environment variable 'AZURE_SQL_CONNECTIONSTRING' is not configured.");
}

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddAuthorization(options =>
{
    // Policy: Only Admins can manage users
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireRole("SystemAdmin", "Admin"));

    // Policy: Admin or System Admin can approve registrations
    options.AddPolicy("ApproveRegistrations", policy =>
        policy.RequireRole("SystemAdmin", "Admin"));

    // Policy: Only approved players
    options.AddPolicy("ApprovedPlayersOnly", policy =>
        policy.RequireRole("SystemAdmin", "Admin", "Player"));
});

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRegistrationRequestRepository, RegistrationRequestRepository>();
builder.Services.AddScoped<IRoleRepository, RoleRepository>();
builder.Services.AddScoped<ITournamentRepository, TournamentRepository>();

// Add services
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<IAuthorizationService, AuthorizationService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", builder =>
    {
        builder.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:3000",
                "https://csp-group-4.vercel.app"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

await InitializeDatabaseAsync(connectionString);

app.MapOpenApi();
app.MapScalarApiReference();

app.UseCors("AllowLocalhost");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void LoadDotEnv()
{
    var candidates = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(AppContext.BaseDirectory, ".env")
    };

    var envPath = candidates.FirstOrDefault(File.Exists);
    if (string.IsNullOrWhiteSpace(envPath))
    {
        return;
    }

    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        var line = rawLine.Trim();

        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
        {
            continue;
        }

        var separatorIndex = line.IndexOf('=');
        if (separatorIndex <= 0)
        {
            continue;
        }

        var key = line[..separatorIndex].Trim();
        var value = line[(separatorIndex + 1)..].Trim();

        if (value.StartsWith('"') && value.EndsWith('"') && value.Length >= 2)
        {
            value = value[1..^1];
        }

        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, value);
        }
    }
}

static async Task InitializeDatabaseAsync(string connectionString)
{
    try
    {
        using (var connection = new SqlConnection(connectionString))
        {
            await connection.OpenAsync();
            
            using (var command = connection.CreateCommand())
            {
                command.CommandText = @"
                    IF OBJECT_ID('dbo.Tournaments', 'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.Tournaments (
                            Id INT PRIMARY KEY IDENTITY(1,1),
                            Name VARCHAR(100) NOT NULL,
                            Description VARCHAR(500),
                            Status TINYINT NOT NULL DEFAULT 0,
                            StartDate DATETIME NOT NULL,
                            EndDate DATETIME NOT NULL,
                            CreatedByAdminId INT NOT NULL,
                            CreatedAt DATETIME NOT NULL DEFAULT GETUTCDATE(),
                            UpdatedAt DATETIME NULL,
                            UpdatedByAdminId INT NULL,
                            CONSTRAINT FK_Tournaments_CreatedByAdmin FOREIGN KEY (CreatedByAdminId) REFERENCES dbo.Users(Id) ON DELETE NO ACTION,
                            CONSTRAINT FK_Tournaments_UpdatedByAdmin FOREIGN KEY (UpdatedByAdminId) REFERENCES dbo.Users(Id) ON DELETE SET NULL
                        );
                        CREATE INDEX idx_tournaments_status ON dbo.Tournaments(Status);
                        CREATE INDEX idx_tournaments_dates ON dbo.Tournaments(StartDate, EndDate);
                    END
                ";
                await command.ExecuteNonQueryAsync();
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Database initialization warning: {ex.Message}");
    }
}