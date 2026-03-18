using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using tmsserver.Models;
using tmsserver.Data.Repositories;

[Route("api/[controller]")]
[ApiController]
public class TournamentsController : ControllerBase
{
    private readonly ITournamentRepository _tournamentRepository;
    private readonly IUserRepository _userRepository;

    public TournamentsController(
        ITournamentRepository tournamentRepository,
        IUserRepository userRepository)
    {
        _tournamentRepository = tournamentRepository;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get all tournaments
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAllTournaments()
    {
        try
        {
            var tournaments = await _tournamentRepository.GetAllTournamentsAsync();
            return Ok(new
            {
                success = true,
                data = tournaments,
                count = tournaments.Count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching tournaments", error = ex.Message });
        }
    }

    /// <summary>
    /// Get tournament by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTournament(int id)
    {
        try
        {
            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            return Ok(new
            {
                success = true,
                data = tournament
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching tournament", error = ex.Message });
        }
    }

    /// <summary>
    /// Get tournaments by status
    /// </summary>
    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetTournamentsByStatus(int status)
    {
        try
        {
            if (!Enum.IsDefined(typeof(TournamentStatus), status))
            {
                return BadRequest(new { message = "Invalid tournament status" });
            }

            var tournaments = await _tournamentRepository.GetTournamentsByStatusAsync((TournamentStatus)status);
            return Ok(new
            {
                success = true,
                data = tournaments,
                count = tournaments.Count
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching tournaments by status", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new tournament (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> CreateTournament([FromBody] TournamentRequest request)
    {
        try
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Tournament name is required" });
            }

            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(new { message = "End date must be after start date" });
            }

            // Get admin ID from JWT token
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            // Verify admin is admin or system admin
            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid();
            }

            var tournament = new Tournament
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                Status = TournamentStatus.Scheduled,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                CreatedByAdminId = adminId,
                CreatedAt = DateTime.UtcNow
            };

            await _tournamentRepository.CreateTournamentAsync(tournament);

            return CreatedAtAction(nameof(GetTournament), new { id = tournament.Id }, new
            {
                success = true,
                message = "Tournament created successfully",
                data = tournament
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating tournament", error = ex.Message });
        }
    }

    /// <summary>
    /// Update tournament status (Admin only)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateTournamentStatus(int id, [FromBody] TournamentStatusUpdate request)
    {
        try
        {
            // Get admin ID from JWT token
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            // Verify admin is admin or system admin
            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid();
            }

            // Check if tournament exists
            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            var updated = await _tournamentRepository.UpdateTournamentStatusAsync(id, request.Status, adminId);

            if (!updated)
            {
                return BadRequest(new { message = "Failed to update tournament status" });
            }

            var updatedTournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            return Ok(new
            {
                success = true,
                message = "Tournament status updated successfully",
                data = updatedTournament
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating tournament status", error = ex.Message });
        }
    }

    /// <summary>
    /// Update tournament details (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> UpdateTournament(int id, [FromBody] TournamentRequest request)
    {
        try
        {
            // Validation
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Tournament name is required" });
            }

            if (request.StartDate >= request.EndDate)
            {
                return BadRequest(new { message = "End date must be after start date" });
            }

            // Get admin ID from JWT token
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            // Verify admin is admin or system admin
            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid();
            }

            // Check if tournament exists
            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            tournament.Name = request.Name.Trim();
            tournament.Description = request.Description?.Trim() ?? string.Empty;
            tournament.StartDate = request.StartDate;
            tournament.EndDate = request.EndDate;
            tournament.UpdatedByAdminId = adminId;

            var updated = await _tournamentRepository.UpdateTournamentAsync(tournament);

            if (!updated)
            {
                return BadRequest(new { message = "Failed to update tournament" });
            }

            var updatedTournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            return Ok(new
            {
                success = true,
                message = "Tournament updated successfully",
                data = updatedTournament
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating tournament", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a tournament (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> DeleteTournament(int id)
    {
        try
        {
            // Get admin ID from JWT token
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            // Verify admin is admin or system admin
            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid();
            }

            // Check if tournament exists
            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            var deleted = await _tournamentRepository.DeleteTournamentAsync(id);

            if (!deleted)
            {
                return BadRequest(new { message = "Failed to delete tournament" });
            }

            return Ok(new
            {
                success = true,
                message = "Tournament deleted successfully",
                deletedId = id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting tournament", error = ex.Message });
        }
    }
}
