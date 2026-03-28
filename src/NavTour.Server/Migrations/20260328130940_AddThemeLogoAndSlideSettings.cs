using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddThemeLogoAndSlideSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ClosingSlideSettings",
                table: "DemoThemes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverSlideSettings",
                table: "DemoThemes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "DemoThemes",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClosingSlideSettings",
                table: "DemoThemes");

            migrationBuilder.DropColumn(
                name: "CoverSlideSettings",
                table: "DemoThemes");

            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "DemoThemes");
        }
    }
}
