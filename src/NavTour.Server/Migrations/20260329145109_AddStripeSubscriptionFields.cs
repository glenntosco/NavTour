using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStripeSubscriptionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SeatCount",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "StripeCustomerId",
                table: "Tenants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripePriceId",
                table: "Tenants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "StripeSubscriptionId",
                table: "Tenants",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionEndsAt",
                table: "Tenants",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SeatCount",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "StripeCustomerId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "StripePriceId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "StripeSubscriptionId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SubscriptionEndsAt",
                table: "Tenants");
        }
    }
}
