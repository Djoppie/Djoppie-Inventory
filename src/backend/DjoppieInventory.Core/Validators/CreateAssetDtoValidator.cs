using DjoppieInventory.Core.DTOs;
using FluentValidation;

namespace DjoppieInventory.Core.Validators;

/// <summary>
/// Validator for <see cref="CreateAssetDto"/>. Only <c>AssetTypeId</c> is
/// required; the rest is optional. Owner / location / status fields are
/// not part of the create DTO — they are populated via the assignment
/// endpoints, so they are not validated here either.
/// </summary>
public class CreateAssetDtoValidator : AbstractValidator<CreateAssetDto>
{
    public CreateAssetDtoValidator()
    {
        RuleFor(x => x.AssetTypeId)
            .GreaterThan(0).WithMessage("Asset type is required");

        RuleFor(x => x.SerialNumber)
            .MaximumLength(100).WithMessage("Serial number cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.SerialNumber));

        RuleFor(x => x.Category)
            .MaximumLength(100).WithMessage("Category cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Category));

        RuleFor(x => x.AssetName)
            .MaximumLength(200).WithMessage("Asset name cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.AssetName));

        RuleFor(x => x.Alias)
            .MaximumLength(200).WithMessage("Alias cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Alias));

        RuleFor(x => x.Brand)
            .MaximumLength(100).WithMessage("Brand cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Brand));

        RuleFor(x => x.Model)
            .MaximumLength(200).WithMessage("Model cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Model));

        RuleFor(x => x.WarrantyExpiry)
            .GreaterThan(x => x.PurchaseDate)
            .WithMessage("Warranty expiry must be after purchase date")
            .When(x => x.PurchaseDate.HasValue && x.WarrantyExpiry.HasValue);
    }
}
