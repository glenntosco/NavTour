using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAnnotationTargetFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ArrowDirection",
                table: "Annotations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BadgeNumber",
                table: "Annotations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetSelector",
                table: "Annotations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ArrowDirection",
                table: "Annotations");

            migrationBuilder.DropColumn(
                name: "BadgeNumber",
                table: "Annotations");

            migrationBuilder.DropColumn(
                name: "TargetSelector",
                table: "Annotations");
        }
    }
}
