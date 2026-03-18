using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStepTriggersAndActions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BackdropLevel",
                table: "Steps",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TriggerDurationMs",
                table: "Steps",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TriggerType",
                table: "Steps",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BackdropLevel",
                table: "Steps");

            migrationBuilder.DropColumn(
                name: "TriggerDurationMs",
                table: "Steps");

            migrationBuilder.DropColumn(
                name: "TriggerType",
                table: "Steps");
        }
    }
}
