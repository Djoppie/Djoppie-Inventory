using DjoppieInventory.Core.DTOs;
using FluentValidation;

namespace DjoppieInventory.Core.Validators;

/// <summary>
/// Validator for CreateAssetDto
/// </summary>
public class CreateAssetDtoValidator : AbstractValidator<CreateAssetDto>
{
    public CreateAssetDtoValidator()
    {
        RuleFor(x => x.AssetCode)
            .NotEmpty().WithMessage("Asset code is required")
            .MaximumLength(50).WithMessage("Asset code cannot exceed 50 characters");

        RuleFor(x => x.AssetName)
            .NotEmpty().WithMessage("Asset name is required")
            .MaximumLength(200).WithMessage("Asset name cannot exceed 200 characters");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .MaximumLength(100).WithMessage("Category cannot exceed 100 characters");

        RuleFor(x => x.Owner)
            .NotEmpty().WithMessage("Owner is required")
            .MaximumLength(200).WithMessage("Owner cannot exceed 200 characters");

        RuleFor(x => x.Building)
            .NotEmpty().WithMessage("Building is required")
            .MaximumLength(200).WithMessage("Building cannot exceed 200 characters");

        RuleFor(x => x.Department)
            .NotEmpty().WithMessage("Department is required")
            .MaximumLength(100).WithMessage("Department cannot exceed 100 characters");

        RuleFor(x => x.OfficeLocation)
            .MaximumLength(100).WithMessage("Office location cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.OfficeLocation));

        RuleFor(x => x.Brand)
            .MaximumLength(100).WithMessage("Brand cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Brand));

        RuleFor(x => x.Model)
            .MaximumLength(100).WithMessage("Model cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Model));

        RuleFor(x => x.SerialNumber)
            .MaximumLength(100).WithMessage("Serial number cannot exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.SerialNumber));

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
