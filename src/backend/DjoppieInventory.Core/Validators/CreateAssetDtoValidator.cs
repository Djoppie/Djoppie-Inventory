using DjoppieInventory.Core.DTOs;
using FluentValidation;

namespace DjoppieInventory.Core.Validators;

/// <summary>
/// Validator for CreateAssetDto - Updated for new asset structure where SerialNumber is required
/// and Owner, Building, Department are optional
/// </summary>
public class CreateAssetDtoValidator : AbstractValidator<CreateAssetDto>
{
    public CreateAssetDtoValidator()
    {
        // Required fields
        RuleFor(x => x.AssetCodePrefix)
            .NotEmpty().WithMessage("Asset code prefix is required")
            .MaximumLength(20).WithMessage("Asset code prefix cannot exceed 20 characters");

        RuleFor(x => x.SerialNumber)
            .NotEmpty().WithMessage("Serial number is required")
            .MaximumLength(100).WithMessage("Serial number cannot exceed 100 characters");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .MaximumLength(100).WithMessage("Category cannot exceed 100 characters");

        // Optional fields with length validation
        RuleFor(x => x.AssetName)
            .MaximumLength(200).WithMessage("Asset name cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.AssetName));

        RuleFor(x => x.Owner)
            .MaximumLength(200).WithMessage("Owner cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Owner));

        RuleFor(x => x.Building)
            .MaximumLength(200).WithMessage("Building cannot exceed 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Building));

        RuleFor(x => x.Department)
            .MaximumLength(100).WithMessage("Department cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Department));

        RuleFor(x => x.OfficeLocation)
            .MaximumLength(100).WithMessage("Office location cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.OfficeLocation));

        RuleFor(x => x.Brand)
            .MaximumLength(100).WithMessage("Brand cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Brand));

        RuleFor(x => x.Model)
            .MaximumLength(100).WithMessage("Model cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Model));

        // Date validation
        RuleFor(x => x.WarrantyExpiry)
            .GreaterThan(x => x.PurchaseDate)
            .WithMessage("Warranty expiry must be after purchase date")
            .When(x => x.PurchaseDate.HasValue && x.WarrantyExpiry.HasValue);

        RuleFor(x => x.InstallationDate)
            .GreaterThanOrEqualTo(x => x.PurchaseDate)
            .WithMessage("Installation date must be on or after purchase date")
            .When(x => x.PurchaseDate.HasValue && x.InstallationDate.HasValue);
    }
}
