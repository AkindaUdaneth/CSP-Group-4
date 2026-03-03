# CSP-Group-4
SLIIT Tennis Web Application

## Deployment Instructions

This project uses **Entity Framework Core** with migrations and ADO.NET to manage the MySQL database. To ensure the database is created automatically upon startup (including when deploying to Azure), the `Program.cs` calls `Database.Migrate()` which applies any pending migrations.

### Local Setup

1. Install MySQL server and the `mysql` client on your machine.
2. Update the connection string in `server/tmsserver/appsettings.json` (or use environment variables) with your local MySQL credentials.
3. From the server project directory run:
   ```bash
   dotnet ef database update
   dotnet run
   ```
   The initial migration will create the schema and seed admin accounts and roles.

### Azure Deployment

1. Create an **Azure Database for MySQL** instance (Flexible Server or Single Server).
2. Configure firewall rules and obtain the connection string (e.g. `Server=<your-server>.mysql.database.azure.com;Database=tennis_management;User=<user>@<your-server>;Password=<pwd>;`).
3. In the Azure App Service configuration or `appsettings.json`, set `ConnectionStrings:DefaultConnection` to this value.
4. Deploy the app using GitHub Actions, Azure DevOps, or `az webapp deploy`.
5. On first startup, EF Core migrations will run and create the database objects automatically.

> **Note:** The project already includes a migration (`Migrations/20260301094845_InitialCreate.*`) which defines the `Users`, `Roles`, and `RegistrationRequests` tables.

## Roles and Access Control

The application implements role-based access control with the following roles:
- `SystemAdmin` (full access)
- `Admin` (manage players and registrations)
- `Player` (standard user)
- `PendingPlayer` (awaiting approval)

Seeded admin accounts (password `admin123`) exist for initial access.


