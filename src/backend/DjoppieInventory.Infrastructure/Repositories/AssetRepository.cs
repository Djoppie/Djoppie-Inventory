using DjoppieInventory.Core.Entities;
using DjoppieInventory.Core.Interfaces;
using DjoppieInventory.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DjoppieInventory.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for Asset data access operations
/// </summary>
public class AssetRepository : IAssetRepository
{
    private readonly ApplicationDbContext _context;

    public AssetRepository(ApplicationDbContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Asset>> GetAllAsync(string? statusFilter = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<AssetStatus>(statusFilter, true, out var status))
            {
                query = query.Where(a => a.Status == status);
            }
        }

        var assets = await query
            .OrderByDescending(a => a.CreatedAt)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Populate PhysicalWorkplace for assets assigned via equipment slots
        await PopulatePhysicalWorkplaceFromEquipmentSlots(assets, cancellationToken);

        return assets;
    }

    public async Task<(IEnumerable<Asset> Items, int TotalCount)> GetPagedAsync(
        string? statusFilter = null,
        int pageNumber = 1,
        int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .AsQueryable();

        if (!string.IsNullOrEmpty(statusFilter))
        {
            if (Enum.TryParse<AssetStatus>(statusFilter, true, out var status))
            {
                query = query.Where(a => a.Status == status);
            }
        }

        // Get total count before pagination
        var totalCount = await query.CountAsync(cancellationToken);

        // Apply pagination
        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Populate PhysicalWorkplace for assets assigned via equipment slots
        await PopulatePhysicalWorkplaceFromEquipmentSlots(items, cancellationToken);

        return (items, totalCount);
    }

    public async Task<Asset?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByIdsAsync(IEnumerable<int> ids, CancellationToken cancellationToken = default)
    {
        var idList = ids.ToList();
        if (!idList.Any()) return Enumerable.Empty<Asset>();

        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .Where(a => idList.Contains(a.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByEmployeeIdAsync(int employeeId, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
            .Where(a => a.EmployeeId == employeeId)
            .OrderBy(a => a.Category)
            .ThenBy(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<Asset?> GetByAssetCodeAsync(string assetCode, CancellationToken cancellationToken = default)
    {
        // Case-insensitive comparison - relies on database collation (SQL Server default: SQL_Latin1_General_CP1_CI_AS)
        // Input is normalized (uppercase) at the controller level for consistency
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Service)
                    .ThenInclude(s => s!.Sector)
            .Include(a => a.PhysicalWorkplace)
                .ThenInclude(pw => pw!.Building)
            .FirstOrDefaultAsync(a => a.AssetCode == assetCode, cancellationToken);
    }

    public async Task<Asset> CreateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        asset.CreatedAt = DateTime.UtcNow;
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Add(asset);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .FirstAsync(a => a.Id == asset.Id, cancellationToken);
    }

    public async Task<Asset> UpdateAsync(Asset asset, CancellationToken cancellationToken = default)
    {
        asset.UpdatedAt = DateTime.UtcNow;

        _context.Assets.Update(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return asset;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var asset = await _context.Assets.FindAsync(new object[] { id }, cancellationToken);
        if (asset == null)
            return false;

        _context.Assets.Remove(asset);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AssetCodeExistsAsync(string assetCode, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .AnyAsync(a => a.AssetCode == assetCode, cancellationToken);
    }

    public async Task<int> GetNextAssetNumberAsync(string prefix, bool isDummy = false, CancellationToken cancellationToken = default)
    {
        var prefixPattern = prefix + "-";
        var assetCodes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        if (isDummy)
        {
            // For dummy assets: find max number >= 9000, start at 9000 if none exist
            int maxDummyNumber = 8999;
            foreach (var code in assetCodes)
            {
                var numberPart = code.Substring(prefixPattern.Length);
                if (int.TryParse(numberPart, out var number) && number >= 9000 && number > maxDummyNumber)
                {
                    maxDummyNumber = number;
                }
            }
            return maxDummyNumber + 1;
        }
        else
        {
            // For normal assets: find max number < 9000
            int maxNumber = 0;
            foreach (var code in assetCodes)
            {
                var numberPart = code.Substring(prefixPattern.Length);
                if (int.TryParse(numberPart, out var number) && number < 9000 && number > maxNumber)
                {
                    maxNumber = number;
                }
            }
            return maxNumber + 1;
        }
    }

    public async Task<bool> SerialNumberExistsAsync(string serialNumber, int? excludeAssetId = null, CancellationToken cancellationToken = default)
    {
        var query = _context.Assets.Where(a => a.SerialNumber == serialNumber);

        if (excludeAssetId.HasValue)
        {
            query = query.Where(a => a.Id != excludeAssetId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task<Asset?> GetBySerialNumberAsync(string serialNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .FirstOrDefaultAsync(a => a.SerialNumber == serialNumber, cancellationToken);
    }

    public async Task<IEnumerable<Asset>> BulkCreateAsync(IEnumerable<Asset> assets, CancellationToken cancellationToken = default)
    {
        var assetList = assets.ToList();
        if (assetList.Count == 0)
            return assetList;

        var now = DateTime.UtcNow;
        foreach (var asset in assetList)
        {
            asset.CreatedAt = now;
            asset.UpdatedAt = now;
        }

        await _context.Assets.AddRangeAsync(assetList, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Reload with navigation properties for mapping
        var ids = assetList.Select(a => a.Id).ToList();
        return await _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Where(a => ids.Contains(a.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<HashSet<string>> GetExistingAssetCodesAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var prefixPattern = prefix + "-";
        var codes = await _context.Assets
            .Where(a => a.AssetCode.StartsWith(prefixPattern))
            .Select(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return codes.ToHashSet();
    }

    public async Task<IDbContextTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task<IEnumerable<string>> GetSerialNumbersByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        return await _context.Assets
            .Where(a => a.SerialNumber != null && a.SerialNumber.StartsWith(prefix))
            .Select(a => a.SerialNumber!)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetByOwnerAsync(
        string ownerEmail,
        string? assetTypeCode = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(ownerEmail))
            return Enumerable.Empty<Asset>();

        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Include(a => a.Employee)
                .ThenInclude(e => e!.Service)
            .Where(a => a.Owner != null && a.Owner.ToLower() == ownerEmail.ToLower());

        // Apply asset type filter if provided
        if (!string.IsNullOrWhiteSpace(assetTypeCode))
        {
            var upperCode = assetTypeCode.ToUpper();
            query = query.Where(a => a.AssetType != null &&
                (a.AssetType.Code.ToUpper().Contains(upperCode) ||
                 a.AssetType.Name.ToUpper().Contains(upperCode)));
        }

        // Apply status filter if provided
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<AssetStatus>(status, true, out var assetStatus))
        {
            query = query.Where(a => a.Status == assetStatus);
        }

        return await query
            .OrderBy(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Asset>> GetAvailableLaptopsAsync(
        string? search = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assets
            .Include(a => a.AssetType)
            .Include(a => a.Service)
            .Where(a => a.Status == AssetStatus.Stock || a.Status == AssetStatus.Nieuw)
            .Where(a => a.AssetType != null &&
                (EF.Functions.Like(a.AssetType.Code.ToUpper(), "%LAP%") ||
                 EF.Functions.Like(a.AssetType.Code.ToUpper(), "%NOTEBOOK%") ||
                 EF.Functions.Like(a.AssetType.Name.ToUpper(), "%LAP%") ||
                 EF.Functions.Like(a.AssetType.Name.ToUpper(), "%NOTEBOOK%")));

        // Apply search filter if provided
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchPattern = $"%{search}%";
            query = query.Where(a =>
                EF.Functions.Like(a.Brand ?? "", searchPattern) ||
                EF.Functions.Like(a.Model ?? "", searchPattern) ||
                EF.Functions.Like(a.SerialNumber ?? "", searchPattern) ||
                EF.Functions.Like(a.AssetCode, searchPattern));
        }

        return await query
            .OrderBy(a => a.AssetCode)
            .AsNoTracking()
            .ToListAsync(cancellationToken);
    }

    public async Task UpdateIntuneFieldsAsync(
        int assetId,
        DateTime? enrollmentDate,
        DateTime? lastCheckIn,
        DateTime? certificateExpiry,
        DateTime syncedAt,
        CancellationToken cancellationToken = default)
    {
        await _context.Assets
            .Where(a => a.Id == assetId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(a => a.IntuneEnrollmentDate, enrollmentDate)
                .SetProperty(a => a.IntuneLastCheckIn, lastCheckIn)
                .SetProperty(a => a.IntuneCertificateExpiry, certificateExpiry)
                .SetProperty(a => a.IntuneSyncedAt, syncedAt)
                .SetProperty(a => a.UpdatedAt, DateTime.UtcNow),
                cancellationToken);
    }

    /// <summary>
    /// Populates PhysicalWorkplace for assets that are assigned via equipment slots.
    /// This handles assets where PhysicalWorkplaceId is null but the asset is assigned
    /// to a workplace via DockingStationAssetId, Monitor1AssetId, etc.
    /// </summary>
    private async Task PopulatePhysicalWorkplaceFromEquipmentSlots(IEnumerable<Asset> assets, CancellationToken cancellationToken)
    {
        var assetList = assets.ToList();
        if (!assetList.Any()) return;

        // Get asset IDs that don't have a PhysicalWorkplace already
        var assetIdsWithoutWorkplace = assetList
            .Where(a => a.PhysicalWorkplace == null)
            .Select(a => a.Id)
            .ToList();

        if (!assetIdsWithoutWorkplace.Any()) return;

        // Find PhysicalWorkplaces that have these assets in equipment slots
        var workplacesWithAssets = await _context.PhysicalWorkplaces
            .Include(pw => pw.Service)
                .ThenInclude(s => s!.Sector)
            .Include(pw => pw.Building)
            .Where(pw => pw.IsActive && (
                (pw.DockingStationAssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.DockingStationAssetId.Value)) ||
                (pw.Monitor1AssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.Monitor1AssetId.Value)) ||
                (pw.Monitor2AssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.Monitor2AssetId.Value)) ||
                (pw.Monitor3AssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.Monitor3AssetId.Value)) ||
                (pw.KeyboardAssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.KeyboardAssetId.Value)) ||
                (pw.MouseAssetId.HasValue && assetIdsWithoutWorkplace.Contains(pw.MouseAssetId.Value))
            ))
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        // Build a lookup from asset ID to PhysicalWorkplace
        var assetToWorkplace = new Dictionary<int, PhysicalWorkplace>();
        foreach (var wp in workplacesWithAssets)
        {
            if (wp.DockingStationAssetId.HasValue) assetToWorkplace.TryAdd(wp.DockingStationAssetId.Value, wp);
            if (wp.Monitor1AssetId.HasValue) assetToWorkplace.TryAdd(wp.Monitor1AssetId.Value, wp);
            if (wp.Monitor2AssetId.HasValue) assetToWorkplace.TryAdd(wp.Monitor2AssetId.Value, wp);
            if (wp.Monitor3AssetId.HasValue) assetToWorkplace.TryAdd(wp.Monitor3AssetId.Value, wp);
            if (wp.KeyboardAssetId.HasValue) assetToWorkplace.TryAdd(wp.KeyboardAssetId.Value, wp);
            if (wp.MouseAssetId.HasValue) assetToWorkplace.TryAdd(wp.MouseAssetId.Value, wp);
        }

        // Populate the PhysicalWorkplace property on the assets
        foreach (var asset in assetList)
        {
            if (asset.PhysicalWorkplace == null && assetToWorkplace.TryGetValue(asset.Id, out var workplace))
            {
                asset.PhysicalWorkplace = workplace;
                asset.PhysicalWorkplaceId = workplace.Id;
            }
        }
    }
}
