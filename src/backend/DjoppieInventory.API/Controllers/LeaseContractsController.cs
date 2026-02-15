using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DjoppieInventory.API.Controllers;

/// <summary>
/// API controller for managing lease contracts.
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class LeaseContractsController : ControllerBase
{
    private readonly ILeaseContractRepository _leaseContractRepository;

    public LeaseContractsController(ILeaseContractRepository leaseContractRepository)
    {
        _leaseContractRepository = leaseContractRepository;
    }

    /// <summary>
    /// Retrieves all lease contracts for a specific asset.
    /// </summary>
    /// <param name="assetId">The asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("by-asset/{assetId}")]
    [ProducesResponseType(typeof(IEnumerable<LeaseContractDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LeaseContractDto>>> GetByAssetId(
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var leases = await _leaseContractRepository.GetByAssetIdAsync(assetId, cancellationToken);
        var dtos = leases.Select(lc => new LeaseContractDto(
            lc.Id,
            lc.AssetId,
            lc.ContractNumber,
            lc.Vendor,
            lc.StartDate,
            lc.EndDate,
            lc.MonthlyRate,
            lc.TotalValue,
            lc.Status.ToString(),
            lc.Notes
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves the currently active lease for an asset (if any).
    /// </summary>
    /// <param name="assetId">The asset ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("active/{assetId}")]
    [ProducesResponseType(typeof(LeaseContractDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaseContractDto>> GetActiveLeaseForAsset(
        int assetId,
        CancellationToken cancellationToken = default)
    {
        var lease = await _leaseContractRepository.GetActiveLeaseForAssetAsync(assetId, cancellationToken);
        if (lease == null)
            return NotFound($"No active lease found for asset {assetId}");

        var dto = new LeaseContractDto(
            lease.Id,
            lease.AssetId,
            lease.ContractNumber,
            lease.Vendor,
            lease.StartDate,
            lease.EndDate,
            lease.MonthlyRate,
            lease.TotalValue,
            lease.Status.ToString(),
            lease.Notes
        );

        return Ok(dto);
    }

    /// <summary>
    /// Retrieves lease contracts that are expiring within a specified number of days.
    /// </summary>
    /// <param name="daysAhead">Number of days to look ahead (default: 90)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("expiring")]
    [ProducesResponseType(typeof(IEnumerable<LeaseContractDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<LeaseContractDto>>> GetExpiring(
        [FromQuery] int daysAhead = 90,
        CancellationToken cancellationToken = default)
    {
        if (daysAhead < 1 || daysAhead > 365)
            return BadRequest("Days ahead must be between 1 and 365");

        var leases = await _leaseContractRepository.GetExpiringLeasesAsync(daysAhead, cancellationToken);
        var dtos = leases.Select(lc => new LeaseContractDto(
            lc.Id,
            lc.AssetId,
            lc.ContractNumber,
            lc.Vendor,
            lc.StartDate,
            lc.EndDate,
            lc.MonthlyRate,
            lc.TotalValue,
            lc.Status.ToString(),
            lc.Notes
        ));

        return Ok(dtos);
    }

    /// <summary>
    /// Retrieves a specific lease contract by ID.
    /// </summary>
    /// <param name="id">The lease contract ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(LeaseContractDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaseContractDto>> GetById(int id, CancellationToken cancellationToken = default)
    {
        var lease = await _leaseContractRepository.GetByIdAsync(id, cancellationToken);
        if (lease == null)
            return NotFound($"Lease contract with ID {id} not found");

        var dto = new LeaseContractDto(
            lease.Id,
            lease.AssetId,
            lease.ContractNumber,
            lease.Vendor,
            lease.StartDate,
            lease.EndDate,
            lease.MonthlyRate,
            lease.TotalValue,
            lease.Status.ToString(),
            lease.Notes
        );

        return Ok(dto);
    }

    /// <summary>
    /// Creates a new lease contract.
    /// </summary>
    /// <param name="dto">The lease contract creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    [ProducesResponseType(typeof(LeaseContractDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<LeaseContractDto>> Create(
        CreateLeaseContractDto dto,
        CancellationToken cancellationToken = default)
    {
        // Validate dates
        if (dto.EndDate <= dto.StartDate)
            return BadRequest("End date must be after start date");

        var lease = new LeaseContract
        {
            AssetId = dto.AssetId,
            ContractNumber = dto.ContractNumber,
            Vendor = dto.Vendor,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MonthlyRate = dto.MonthlyRate,
            TotalValue = dto.TotalValue,
            Notes = dto.Notes,
            Status = LeaseStatus.Active
        };

        var created = await _leaseContractRepository.CreateAsync(lease, cancellationToken);

        var resultDto = new LeaseContractDto(
            created.Id,
            created.AssetId,
            created.ContractNumber,
            created.Vendor,
            created.StartDate,
            created.EndDate,
            created.MonthlyRate,
            created.TotalValue,
            created.Status.ToString(),
            created.Notes
        );

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, resultDto);
    }

    /// <summary>
    /// Updates an existing lease contract.
    /// </summary>
    /// <param name="id">The lease contract ID to update</param>
    /// <param name="dto">The updated lease contract data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(LeaseContractDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LeaseContractDto>> Update(
        int id,
        UpdateLeaseContractDto dto,
        CancellationToken cancellationToken = default)
    {
        var lease = await _leaseContractRepository.GetByIdAsync(id, cancellationToken);
        if (lease == null)
            return NotFound($"Lease contract with ID {id} not found");

        // Validate dates
        if (dto.EndDate <= dto.StartDate)
            return BadRequest("End date must be after start date");

        // Parse status
        if (!Enum.TryParse<LeaseStatus>(dto.Status, true, out var status))
            return BadRequest($"Invalid lease status: {dto.Status}");

        lease.ContractNumber = dto.ContractNumber;
        lease.Vendor = dto.Vendor;
        lease.StartDate = dto.StartDate;
        lease.EndDate = dto.EndDate;
        lease.MonthlyRate = dto.MonthlyRate;
        lease.TotalValue = dto.TotalValue;
        lease.Status = status;
        lease.Notes = dto.Notes;

        var updated = await _leaseContractRepository.UpdateAsync(lease, cancellationToken);

        var resultDto = new LeaseContractDto(
            updated.Id,
            updated.AssetId,
            updated.ContractNumber,
            updated.Vendor,
            updated.StartDate,
            updated.EndDate,
            updated.MonthlyRate,
            updated.TotalValue,
            updated.Status.ToString(),
            updated.Notes
        );

        return Ok(resultDto);
    }

    /// <summary>
    /// Deletes a lease contract.
    /// </summary>
    /// <param name="id">The lease contract ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var deleted = await _leaseContractRepository.DeleteAsync(id, cancellationToken);
        if (!deleted)
            return NotFound($"Lease contract with ID {id} not found");

        return NoContent();
    }
}
