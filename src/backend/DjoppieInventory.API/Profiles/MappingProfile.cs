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
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));

        CreateMap<CreateAssetDto, Asset>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ParseAssetStatus(src.Status)));

        CreateMap<UpdateAssetDto, Asset>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => ParseAssetStatus(src.Status)))
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.AssetCode, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        // AssetTemplate mappings
        CreateMap<AssetTemplate, AssetTemplateDto>();
        CreateMap<CreateAssetTemplateDto, AssetTemplate>();
        CreateMap<UpdateAssetTemplateDto, AssetTemplate>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.Ignore());
    }

    private static AssetStatus ParseAssetStatus(string statusString)
    {
        return Enum.TryParse<AssetStatus>(statusString, true, out var status)
            ? status
            : AssetStatus.InGebruik;
    }
}
