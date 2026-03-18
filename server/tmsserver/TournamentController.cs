using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using tmsserver.Models;
using tmsserver.Data.Repositories;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = "AdminOnly")]
public class TournamentController : ControllerBase
{
    private readonly ITournamentRepository _tournamentRepository;
    private readonly IUserRepository _userRepository;

    public TournamentController(ITournamentRepository tournamentRepository, IUserRepository userRepository)
    {
        _tournamentRepository = tournamentRepository;
        _userRepository = userRepository;
    }

    /// <summary>
    /// Get all tournaments
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllTournaments()
    {
        try
        {
            var tournaments = await _tournamentRepository.GetAllTournamentsAsync();
            var result = tournaments.Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                Status = t.Status.ToString(),
                t.StartDate,
                t.EndDate,
                t.CreatedAt,
                t.UpdatedAt
            }).ToList();

            return Ok(new { success = true, data = result, count = result.Count });
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
    [AllowAnonymous]
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
                data = new
                {
                    tournament.Id,
                    tournament.Name,
                    tournament.Description,
                    Status = tournament.Status.ToString(),
                    tournament.StartDate,
                    tournament.EndDate,
                    tournament.CreatedAt,
                    tournament.UpdatedAt,
                    tournament.CreatedByAdminId,
                    tournament.UpdatedByAdminId
                }
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
    [AllowAnonymous]
    public async Task<IActionResult> GetTournamentsByStatus(string status)
    {
        try
        {
            if (!Enum.TryParse<TournamentStatus>(status, out var tournamentStatus))
            {
                return BadRequest(new { message = "Invalid tournament status. Valid values: Scheduled, InProgress, Completed, Cancelled" });
            }

            var tournaments = await _tournamentRepository.GetTournamentsByStatusAsync(tournamentStatus);
            var result = tournaments.Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                Status = t.Status.ToString(),
                t.StartDate,
                t.EndDate,
                t.CreatedAt
            }).ToList();

            return Ok(new { success = true, data = result, count = result.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching tournaments", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new tournament (Admin only)
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateTournament([FromBody] TournamentRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Tournament name is required" });
            }

            if (request.EndDate <= request.StartDate)
            {
                return BadRequest(new { message = "End date must be after start date" });
            }

            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid("You don't have permission to create tournaments");
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
                data = new
                {
                    tournament.Id,
                    tournament.Name,
                    tournament.Description,
                    Status = tournament.Status.ToString(),
                    tournament.StartDate,
                    tournament.EndDate,
                    tournament.CreatedAt
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating tournament", error = ex.Message });
        }
    }

    /// <summary>
    /// Update tournament details (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTournament(int id, [FromBody] TournamentRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Tournament name is required" });
            }

            if (request.EndDate <= request.StartDate)
            {
                return BadRequest(new { message = "End date must be after start date" });
            }

            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid("You don't have permission to update tournaments");
            }

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
                return BadRequest(new { success = false, message = "Failed to update tournament" });
            }

            return Ok(new
            {
                success = true,
                message = "Tournament updated successfully",
                data = new
                {
                    tournament.Id,
                    tournament.Name,
                    tournament.Description,
                    Status = tournament.Status.ToString(),
                    tournament.StartDate,
                    tournament.EndDate,
                    tournament.UpdatedAt
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating tournament", error = ex.Message });
        }
    }

    /// <summary>
    /// Update tournament status (Admin only)
    /// </summary>
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateTournamentStatus(int id, [FromBody] TournamentStatusUpdate request)
    {
        try
        {
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid("You don't have permission to update tournament status");
            }

            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            var updated = await _tournamentRepository.UpdateTournamentStatusAsync(id, request.Status, adminId);
            if (!updated)
            {
                return BadRequest(new { success = false, message = "Failed to update tournament status" });
            }

            return Ok(new
            {
                success = true,
                message = "Tournament status updated successfully",
                data = new
                {
                    id = tournament.Id,
                    Status = request.Status.ToString(),
                    UpdatedAt = DateTime.UtcNow
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating tournament status", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete tournament (Admin only) - only for cancelled tournaments
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTournament(int id)
    {
        try
        {
            var adminIdClaim = User.FindFirst("sub")
                ?? User.FindFirst(ClaimTypes.NameIdentifier)
                ?? User.FindFirst("userId");

            if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out int adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var admin = await _userRepository.GetUserByIdAsync(adminId);
            if (admin?.Role != UserRole.Admin && admin?.Role != UserRole.SystemAdmin)
            {
                return Forbid("You don't have permission to delete tournaments");
            }

            var tournament = await _tournamentRepository.GetTournamentByIdAsync(id);
            if (tournament == null)
            {
                return NotFound(new { message = "Tournament not found" });
            }

            if (tournament.Status != TournamentStatus.Cancelled && tournament.Status != TournamentStatus.Scheduled)
            {
                return BadRequest(new { message = "Only cancelled or scheduled tournaments can be deleted" });
            }

            var deleted = await _tournamentRepository.DeleteTournamentAsync(id);
            if (!deleted)
            {
                return BadRequest(new { success = false, message = "Failed to delete tournament" });
            }

            return Ok(new
            {
                success = true,
                message = "Tournament deleted successfully",
                id = id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting tournament", error = ex.Message });
        }
    }
}
