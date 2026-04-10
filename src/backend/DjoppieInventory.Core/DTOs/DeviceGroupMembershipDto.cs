namespace DjoppieInventory.Core.DTOs;

public class DeviceGroupMembershipDto
{
    public string DeviceId { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public List<GroupInfoDto> DeviceGroups { get; set; } = new();
    public List<GroupInfoDto> UserGroups { get; set; } = new();
    public DateTime RetrievedAt { get; set; } = DateTime.UtcNow;
}

public class GroupInfoDto
{
    public string Id { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? GroupType { get; set; }
    public bool IsDynamic { get; set; }
}
