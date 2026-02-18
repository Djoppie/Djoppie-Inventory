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
                src.AssetType != null ? new AssetTypeInfo { Id = src.AssetType.Id, Code = src.AssetType.Code, Name = src.AssetType.Name } : null))
            .ForMember(dest => dest.Service, opt => opt.MapFrom(src =>
                src.Service != null ? new ServiceInfo { Id = src.Service.Id, Code = src.Service.Code, Name = src.Service.Name } : null));

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
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // AssetTemplate mappings
        CreateMap<AssetTemplate, AssetTemplateDto>()
            .ForMember(dest => dest.AssetType, opt => opt.MapFrom(src =>
                src.AssetType != null ? new AssetTypeInfo { Id = src.AssetType.Id, Code = src.AssetType.Code, Name = src.AssetType.Name } : null))
            .ForMember(dest => dest.Service, opt => opt.MapFrom(src =>
                src.Service != null ? new ServiceInfo { Id = src.Service.Id, Code = src.Service.Code, Name = src.Service.Name } : null));

        CreateMap<CreateAssetTemplateDto, AssetTemplate>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetType, opt => opt.Ignore())
            .ForMember(dest => dest.Service, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore());

        CreateMap<UpdateAssetTemplateDto, AssetTemplate>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetType, opt => opt.Ignore())
            .ForMember(dest => dest.Service, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore())
            .ForMember(dest => dest.OfficeLocation, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyBuilding, opt => opt.Ignore())
            .ForMember(dest => dest.LegacyDepartment, opt => opt.Ignore());
    }

    private static AssetStatus ParseAssetStatus(string statusString)
    {
        return Enum.TryParse<AssetStatus>(statusString, true, out var status)
            ? status
            : AssetStatus.Stock; // Default to Stock, not InGebruik
    }
}
