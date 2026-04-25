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
                ) : null))
            .ForMember(dest => dest.EffectiveLocation, opt => opt.MapFrom(src => BuildEffectiveLocation(src)));

        // Create — hard-code Status=Nieuw and explicitly ignore every owner /
        // location / employee / building / workplace field. Anything that
        // shouldn't be settable at creation time is enumerated below so the
        // profile is the single source of truth for the workflow rule.
        CreateMap<CreateAssetDto, Asset>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetCode, opt => opt.Ignore())     // Auto-generated in service
            .ForMember(dest => dest.IsDummy, opt => opt.Ignore())       // Set explicitly in service from DTO
            .ForMember(dest => dest.Status, opt => opt.MapFrom(_ => AssetStatus.Nieuw))
            .ForMember(dest => dest.Owner, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())
            .ForMember(dest => dest.JobTitle, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceId, opt => opt.Ignore())
            .ForMember(dest => dest.BuildingId, opt => opt.Ignore())
            .ForMember(dest => dest.PhysicalWorkplaceId, opt => opt.Ignore())
            .ForMember(dest => dest.InstallationLocation, opt => opt.Ignore())
            .ForMember(dest => dest.InstallationDate, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // Update — only intrinsic asset properties pass through. Status,
        // owner, location are routed via IAssetAssignmentService.
        CreateMap<UpdateAssetDto, Asset>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetCode, opt => opt.Ignore())
            .ForMember(dest => dest.IsDummy, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.Owner, opt => opt.Ignore())
            .ForMember(dest => dest.EmployeeId, opt => opt.Ignore())
            .ForMember(dest => dest.JobTitle, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.ServiceId, opt => opt.Ignore())
            .ForMember(dest => dest.BuildingId, opt => opt.Ignore())
            .ForMember(dest => dest.PhysicalWorkplaceId, opt => opt.Ignore())
            .ForMember(dest => dest.InstallationLocation, opt => opt.Ignore())
            .ForMember(dest => dest.InstallationDate, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            // Category is required in DB - only update if not null
            .ForMember(dest => dest.Category, opt => opt.Condition(src => src.Category != null))
            // SerialNumber is unique-when-present - only overwrite if explicitly provided
            .ForMember(dest => dest.SerialNumber, opt => opt.Condition(src => !string.IsNullOrEmpty(src.SerialNumber)))
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

    /// <summary>
    /// Computes the EffectiveLocation block surfaced on AssetDto. Picks
    /// the most specific signal available, in this priority order:
    ///   1. Employee → workplace → building (user-bound assets)
    ///   2. PhysicalWorkplace → building (workplace-fixed assets)
    ///   3. Building only
    ///   4. None (asset still in stock / brand new)
    /// </summary>
    private static EffectiveLocationDto? BuildEffectiveLocation(Asset src)
    {
        var dto = new EffectiveLocationDto
        {
            InstallationLocation = src.InstallationLocation,
        };

        var hasEmployee = src.Employee is not null;
        var hasWorkplace = src.PhysicalWorkplace is not null;
        var hasBuilding = src.Building is not null;

        if (hasEmployee)
        {
            var emp = src.Employee!;
            dto.Kind = LocationChainKind.Employee;
            dto.EmployeeId = emp.Id;
            dto.EmployeeName = emp.DisplayName;
            dto.EmployeeJobTitle = emp.JobTitle;
            dto.ServiceId = emp.ServiceId;
            dto.ServiceName = emp.Service?.Name;

            if (emp.CurrentWorkplace is not null)
            {
                dto.PhysicalWorkplaceId = emp.CurrentWorkplace.Id;
                dto.PhysicalWorkplaceCode = emp.CurrentWorkplace.Code;
                dto.PhysicalWorkplaceName = emp.CurrentWorkplace.Name;
            }
        }
        else if (hasWorkplace)
        {
            var wp = src.PhysicalWorkplace!;
            dto.Kind = LocationChainKind.Workplace;
            dto.PhysicalWorkplaceId = wp.Id;
            dto.PhysicalWorkplaceCode = wp.Code;
            dto.PhysicalWorkplaceName = wp.Name;
            dto.ServiceId = wp.ServiceId;
            dto.ServiceName = wp.Service?.Name;
            dto.SectorName = wp.Service?.Sector?.Name;
        }
        else
        {
            dto.Kind = src.Status switch
            {
                AssetStatus.Stock => LocationChainKind.Stock,
                AssetStatus.Herstelling => LocationChainKind.Stock,
                AssetStatus.Defect => LocationChainKind.Stock,
                AssetStatus.UitDienst => LocationChainKind.Stock,
                _ => LocationChainKind.None,
            };
        }

        if (hasBuilding)
        {
            dto.BuildingId = src.Building!.Id;
            dto.BuildingName = src.Building.Name;
            dto.BuildingAddress = src.Building.Address;
        }
        else if (hasWorkplace && src.PhysicalWorkplace!.Building is not null)
        {
            dto.BuildingId = src.PhysicalWorkplace.Building.Id;
            dto.BuildingName = src.PhysicalWorkplace.Building.Name;
            dto.BuildingAddress = src.PhysicalWorkplace.Building.Address;
        }

        return dto;
    }
}
