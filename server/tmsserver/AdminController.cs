using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using tmsserver.Models;
using tmsserver.Services;
using tmsserver.Data.Repositories;

[Route("api/[controller]")]
[ApiController]
[Authorize(Policy = "AdminOnly")]
public class AdminController : ControllerBase
{
    private readonly tmsserver.Services.IAuthorizationService _authorizationService;
    private readonly IUserRepository _userRepository;
    private readonly IRegistrationRequestRepository _registrationRequestRepository;
    private readonly UserService _userService;

    public AdminController(
        tmsserver.Services.IAuthorizationService authorizationService,
        IUserRepository userRepository,
        IRegistrationRequestRepository registrationRequestRepository,
        UserService userService)
    {
        _authorizationService = authorizationService;
        _userRepository = userRepository;
        _registrationRequestRepository = registrationRequestRepository;
        _userService = userService;
    }

    private bool TryGetAdminId(out int adminId)
    {
        adminId = 0;
        var adminIdClaim = User.FindFirst("sub")
            ?? User.FindFirst(ClaimTypes.NameIdentifier)
            ?? User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")
            ?? User.FindFirst("userId");

        if (adminIdClaim == null || !int.TryParse(adminIdClaim.Value, out adminId))
        {
            return false;
        }

        return true;
    }

    private static object GetUserPublicFields(User? user)
    {
        if (user == null) return new { };

        return new
        {
            user.Id,
            user.Username,
            user.Email,
            user.IdentityNumber,
            Role = user.Role.ToString(),
            user.IsApproved,
            user.ApprovedByAdminId,
            user.CreatedAt,
            user.ApprovedAt
        };
    }

    public class CreateUserRequest
    {
        public string Username { get; set; } = string.Empty;
        public string IdentityNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

        // Accepts enum name (e.g. "SystemAdmin") to avoid Json enum binding config changes.
        public string Role { get; set; } = string.Empty;
        public bool IsApproved { get; set; } = false;
    }

    public class UpdateUserRequest
    {
        public string? Username { get; set; }
        public string? IdentityNumber { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }

        public string? Role { get; set; }
        public bool? IsApproved { get; set; }
    }

    /// <summary>
    /// Create a new user account (System Admin / Admin only).
    /// </summary>
    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.IdentityNumber) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Username, identity number, email, password and role are required" });
            }

            // Normalize user inputs.
            var username = request.Username.Trim();
            var identityNumber = request.IdentityNumber.Trim();
            var email = request.Email.Trim();

            if (request.Password.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            if (!_userService.ValidateEmailDomain(email))
            {
                return BadRequest(new { message = "Email must be from @sliit.lk or @my.sliit.lk domain" });
            }

            if (!_userService.ValidateIdentityNumber(identityNumber))
            {
                return BadRequest(new { message = "Identity number must contain both letters and numbers" });
            }

            if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var parsedRole))
            {
                return BadRequest(new { message = "Invalid role. Expected one of: SystemAdmin, Admin, Player, PendingPlayer" });
            }

            if (parsedRole == UserRole.PendingPlayer && request.IsApproved)
            {
                // Pending players are never approved.
                request.IsApproved = false;
            }

            var existingByUsername = await _userRepository.GetUserByUsernameAsync(username);
            if (existingByUsername != null)
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var existingByEmail = await _userRepository.GetUserByEmailAsync(email);
            if (existingByEmail != null)
            {
                return BadRequest(new { message = "Email already registered" });
            }

            var existingByIdentity = await _userRepository.GetUserByIdentityNumberAsync(identityNumber);
            if (existingByIdentity != null)
            {
                return BadRequest(new { message = "Identity number already registered" });
            }

            if (!TryGetAdminId(out var adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var now = DateTime.UtcNow;
            var created = new User
            {
                Username = username,
                IdentityNumber = identityNumber,
                Email = email,
                PasswordHash = UserService.HashPassword(request.Password),
                Role = parsedRole,
                IsApproved = request.IsApproved,
                ApprovedByAdminId = request.IsApproved ? adminId : null,
                ApprovedAt = request.IsApproved ? now : null,
                CreatedAt = now
            };

            await _userRepository.CreateUserAsync(created);

            // Keep "Pending player approvals" consistent: pending players need a registration request row.
            if (parsedRole == UserRole.PendingPlayer && !created.IsApproved)
            {
                await _registrationRequestRepository.CreateRequestAsync(new RegistrationRequest
                {
                    UserId = created.Id,
                    Status = "Pending",
                    CreatedAt = now
                });
            }

            return Ok(new
            {
                success = true,
                message = "User created successfully",
                data = GetUserPublicFields(created)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error creating user", error = ex.Message });
        }
    }

    /// <summary>
    /// Edit/update user details (System Admin / Admin only).
    /// </summary>
    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            if (request == null)
            {
                return BadRequest(new { message = "Request body is required" });
            }

            var existing = await _userRepository.GetUserByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!TryGetAdminId(out var adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var target = existing;

            if (!string.IsNullOrWhiteSpace(request.Username))
                target.Username = request.Username.Trim();
            if (!string.IsNullOrWhiteSpace(request.IdentityNumber))
                target.IdentityNumber = request.IdentityNumber.Trim();
            if (!string.IsNullOrWhiteSpace(request.Email))
                target.Email = request.Email.Trim();

            if (request.IsApproved.HasValue)
                target.IsApproved = request.IsApproved.Value;

            if (!string.IsNullOrWhiteSpace(request.Role))
            {
                if (!Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var parsedRole))
                {
                    return BadRequest(new { message = "Invalid role. Expected one of: SystemAdmin, Admin, Player, PendingPlayer" });
                }

                target.Role = parsedRole;
            }

            // If role is PendingPlayer, the account must be unapproved.
            if (target.Role == UserRole.PendingPlayer)
            {
                target.IsApproved = false;
            }

            // Password update: only hash if provided.
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                if (request.Password.Length < 6)
                    return BadRequest(new { message = "Password must be at least 6 characters" });

                target.PasswordHash = UserService.HashPassword(request.Password);
            }

            // Validate updated email + identity.
            if (!_userService.ValidateEmailDomain(target.Email))
            {
                return BadRequest(new { message = "Email must be from @sliit.lk or @my.sliit.lk domain" });
            }

            if (!_userService.ValidateIdentityNumber(target.IdentityNumber))
            {
                return BadRequest(new { message = "Identity number must contain both letters and numbers" });
            }

            // Uniqueness checks (only if changed).
            if (!string.IsNullOrWhiteSpace(request.Username) && target.Username != existing.Username)
            {
                var byUsername = await _userRepository.GetUserByUsernameAsync(target.Username);
                if (byUsername != null && byUsername.Id != id)
                    return BadRequest(new { message = "Username already exists" });
            }

            if (!string.IsNullOrWhiteSpace(request.Email) && target.Email != existing.Email)
            {
                var byEmail = await _userRepository.GetUserByEmailAsync(target.Email);
                if (byEmail != null && byEmail.Id != id)
                    return BadRequest(new { message = "Email already registered" });
            }

            if (!string.IsNullOrWhiteSpace(request.IdentityNumber) && target.IdentityNumber != existing.IdentityNumber)
            {
                var byIdentity = await _userRepository.GetUserByIdentityNumberAsync(target.IdentityNumber);
                if (byIdentity != null && byIdentity.Id != id)
                    return BadRequest(new { message = "Identity number already registered" });
            }

            // If approved status changed, update audit fields.
            var now = DateTime.UtcNow;
            if (target.IsApproved)
            {
                target.ApprovedByAdminId = adminId;
                target.ApprovedAt = now;
            }
            else
            {
                target.ApprovedByAdminId = null;
                target.ApprovedAt = null;
            }

            var updated = await _userRepository.UpdateUserAsync(target);
            if (!updated)
            {
                return BadRequest(new { success = false, message = "Failed to update user" });
            }

            // Registration request consistency for PendingPlayer.
            if (target.Role == UserRole.PendingPlayer && !target.IsApproved)
            {
                var req = await _registrationRequestRepository.GetRequestByUserIdAsync(id);
                if (req == null)
                {
                    await _registrationRequestRepository.CreateRequestAsync(new RegistrationRequest
                    {
                        UserId = id,
                        Status = "Pending",
                        CreatedAt = now
                    });
                }
                else if (!string.Equals(req.Status, "Pending", System.StringComparison.OrdinalIgnoreCase))
                {
                    await _registrationRequestRepository.UpdateRequestStatusAsync(req.Id, "Pending", adminId, null);
                }
            }
            else
            {
                // If the user is now approved, remove Pending status from requests.
                var req = await _registrationRequestRepository.GetRequestByUserIdAsync(id);
                if (req != null &&
                    string.Equals(req.Status, "Pending", System.StringComparison.OrdinalIgnoreCase) &&
                    target.IsApproved)
                {
                    await _registrationRequestRepository.ApproveRequestAsync(req.Id, adminId);
                }
            }

            return Ok(new
            {
                success = true,
                message = "User updated successfully",
                data = GetUserPublicFields(target)
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error updating user", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a user account (System Admin / Admin only).
    /// </summary>
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        try
        {
            var existing = await _userRepository.GetUserByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (!TryGetAdminId(out var adminId))
            {
                return Unauthorized(new { message = "Unable to identify admin" });
            }

            var req = await _registrationRequestRepository.GetRequestByUserIdAsync(id);
            if (req != null)
            {
                await _registrationRequestRepository.UpdateRequestStatusAsync(
                    req.Id,
                    "Deleted",
                    adminId,
                    "Deleted by admin"
                );
            }

            var deleted = await _userRepository.DeleteUserAsync(id);
            if (!deleted)
            {
                return BadRequest(new { success = false, message = "Failed to delete user" });
            }

            return Ok(new { success = true, message = "User deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error deleting user", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all pending player approval requests
    /// </summary>
    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        try
        {
            var pendingUsers = await _authorizationService.GetPendingApprovalAsync();
            var result = pendingUsers.Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.IdentityNumber,
                u.CreatedAt,
                Status = "Pending"
            }).ToList();

            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching pending approvals", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all registration requests with status
    /// </summary>
    [HttpGet("registration-requests")]
    public async Task<IActionResult> GetRegistrationRequests([FromQuery] string? status = null)
    {
        try
        {
            List<RegistrationRequest> requests;
            
            if (!string.IsNullOrEmpty(status))
            {
                requests = await _registrationRequestRepository.GetRequestsByStatusAsync(status);
            }
            else
            {
                requests = await _registrationRequestRepository.GetAllPendingRequestsAsync();
            }

            var result = new List<dynamic>();
            foreach (var request in requests)
            {
                var user = await _userRepository.GetUserByIdAsync(request.UserId);
                if (user != null)
                {
                    result.Add(new
                    {
                        request.Id,
                        request.UserId,
                        User = new { user.Id, user.Username, user.Email, user.IdentityNumber },
                        request.Status,
                        request.CreatedAt,
                        request.ReviewedAt,
                        request.RejectionReason
                    });
                }
            }

            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching registration requests", error = ex.Message });
        }
    }

    /// <summary>
    /// Approve a pending player registration
    /// </summary>
    [HttpPost("approve-player/{userId}")]
    public async Task<IActionResult> ApprovePlayer(int userId)
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
                return Forbid("You don't have permission to approve players");
            }

            // Approve the user
            var approved = await _authorizationService.ApproveUserAsync(userId, adminId);
            
            if (approved)
            {
                var user = await _userRepository.GetUserByIdAsync(userId);
                return Ok(new
                {
                    success = true,
                    message = "Player approved successfully",
                    user = new
                    {
                        user?.Id,
                        user?.Username,
                        user?.Email,
                        user?.Role,
                        user?.IsApproved
                    }
                });
            }

            return BadRequest(new { success = false, message = "Failed to approve player" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error approving player", error = ex.Message });
        }
    }

    /// <summary>
    /// Reject a pending player registration
    /// </summary>
    [HttpPost("reject-player/{userId}")]
    public async Task<IActionResult> RejectPlayer(int userId, [FromBody] RejectRequest request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.Reason))
            {
                return BadRequest(new { message = "Rejection reason is required" });
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
                return Forbid("You don't have permission to reject players");
            }

            // Reject the user
            var rejected = await _authorizationService.RejectUserAsync(userId, adminId, request.Reason);

            if (rejected)
            {
                return Ok(new
                {
                    success = true,
                    message = "Player registration rejected",
                    reason = request.Reason
                });
            }

            return BadRequest(new { success = false, message = "Failed to reject player" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error rejecting player", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all users
    /// </summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers([FromQuery] string? role = null)
    {
        try
        {
            List<User> users;

            if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var userRole))
            {
                users = await _userRepository.GetUsersByRoleAsync(userRole);
            }
            else
            {
                users = await _userRepository.GetAllUsersAsync();
            }

            var result = users.Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.IdentityNumber,
                Role = u.Role.ToString(),
                u.IsApproved,
                u.CreatedAt,
                u.ApprovedAt
            }).ToList();

            return Ok(new { success = true, data = result, count = result.Count });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching users", error = ex.Message });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("users/{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        try
        {
            var user = await _userRepository.GetUserByIdAsync(id);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(new
            {
                success = true,
                data = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.IdentityNumber,
                    Role = user.Role.ToString(),
                    user.IsApproved,
                    user.ApprovedByAdminId,
                    user.CreatedAt,
                    user.ApprovedAt
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Error fetching user", error = ex.Message });
        }
    }
}

public class RejectRequest
{
    public string Reason { get; set; } = string.Empty;
}
