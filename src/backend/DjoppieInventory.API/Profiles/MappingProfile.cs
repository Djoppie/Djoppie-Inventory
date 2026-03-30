using AutoMapper;
using DjoppieInventory.Core.DTOs;
using DjoppieInventory.Core.Entities;

namespace DjoppieInventory.API.Profiles;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Asset mappings
        CreateMap<Asset, AssetDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()))
            .ForMember(dest => dest.AssetType, opt => opt.MapFrom(src =>
                src.AssetType != null ? new AssetTypeInfo { Id = src.AssetType.Id, Code = src.AssetType.Code, Name = src.AssetType.Name, CategoryId = src.AssetType.CategoryId } : null))
            .ForMember(dest => dest.Service, opt => opt.MapFrom(src =>
                src.Service != null ? new ServiceInfo { Id = src.Service.Id, Code = src.Service.Code, Name = src.Service.Name } : null))
            .ForMember(dest => dest.PhysicalWorkplace, opt => opt.MapFrom(src =>
                src.PhysicalWorkplace != null ? new PhysicalWorkplaceInfo
                {
                    Id = src.PhysicalWorkplace.Id,
                    Code = src.PhysicalWorkplace.Code,
                    Name = src.PhysicalWorkplace.Name,
                    CurrentOccupantName = src.PhysicalWorkplace.CurrentOccupantName,
                    ServiceName = src.PhysicalWorkplace.Service != null ? src.PhysicalWorkplace.Service.Name : null,
                    SectorName = src.PhysicalWorkplace.Service != null && src.PhysicalWorkplace.Service.Sector != null
                        ? src.PhysicalWorkplace.Service.Sector.Name : null,
                    BuildingName = src.PhysicalWorkplace.Building != null ? src.PhysicalWorkplace.Building.Name : null,
                    Floor = src.PhysicalWorkplace.Floor
                } : null))
            .ForMember(dest => dest.Building, opt => opt.MapFrom(src =>
                src.Building != null ? new BuildingInfo
                {
                    Id = src.Building.Id,
                    Code = src.Building.Code,
                    Name = src.Building.Name,
                    Address = src.Building.Address
                } : null))
            .ForMember(dest => dest.Employee, opt => opt.MapFrom(src =>
                src.Employee != null ? new EmployeeInfoDto(
                    src.Employee.Id,
                    src.Employee.EntraId,
                    src.Employee.DisplayName,
                    src.Employee.Email,
                    src.Employee.JobTitle,
                    src.Employee.ServiceId,
                    src.Employee.Service != null ? src.Employee.Service.Name : null,
                    src.Employee.CurrentWorkplace != null ? src.Employee.CurrentWorkplace.Id : (int?)null,
                    src.Employee.CurrentWorkplace != null ? src.Employee.CurrentWorkplace.Code : null
                ) : null));

        CreateMap<CreateAssetDto, Asset>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ParseAssetStatus(src.Status)))
            .ForMember(dest => dest.AssetCode, opt => opt.Ignore()) // Auto-generated in service
            .ForMember(dest => dest.IsDummy, opt => opt.Ignore()) // Set manually in service
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<UpdateAssetDto, Asset>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ParseAssetStatus(src.Status)))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetCode, opt => opt.Ignore())
            .ForMember(dest => dest.IsDummy, opt => opt.Ignore()) // Cannot change after creation
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            // Category is required in DB - only update if not null to prevent constraint violation
            .ForMember(dest => dest.Category, opt => opt.Condition(src => src.Category != null))
            // SerialNumber is required and unique in DB - only update if not empty
            .ForMember(dest => dest.SerialNumber, opt => opt.Condition(src => !string.IsNullOrEmpty(src.SerialNumber)))
            // AssetName has a default - only update if not null to preserve existing value
            .ForMember(dest => dest.AssetName, opt => opt.Condition(src => src.AssetName != null));

        // AssetTemplate mappings
        CreateMap<AssetTemplate, AssetTemplateDto>()
            .ForMember(dest => dest.AssetType, opt => opt.MapFrom(src =>
                src.AssetType != null ? new AssetTypeInfo { Id = src.AssetType.Id, Code = src.AssetType.Code, Name = src.AssetType.Name, CategoryId = src.AssetType.CategoryId } : null))
            .ForMember(dest => dest.Service, opt => opt.MapFrom(src =>
                src.Service != null ? new ServiceInfo { Id = src.Service.Id, Code = src.Service.Code, Name = src.Service.Name } : null));

        CreateMap<CreateAssetTemplateDto, AssetTemplate>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetType, opt => opt.Ignore())
            .ForMember(dest => dest.Service, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category ?? null));

        CreateMap<UpdateAssetTemplateDto, AssetTemplate>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetType, opt => opt.Ignore())
            .ForMember(dest => dest.Service, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category ?? null));
    }

    private static AssetStatus ParseAssetStatus(string statusString)
    {
        return Enum.TryParse<AssetStatus>(statusString, true, out var status)
            ? status
            : AssetStatus.Stock; // Default to Stock, not InGebruik
    }
}
