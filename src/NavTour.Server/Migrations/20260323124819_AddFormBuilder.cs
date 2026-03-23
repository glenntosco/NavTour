using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddFormBuilder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "FormId",
                table: "Leads",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "FormId",
                table: "Demos",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Forms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FieldsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SettingsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsStandalone = table.Column<bool>(type: "bit", nullable: false),
                    SubmissionCount = table.Column<long>(type: "bigint", nullable: false),
                    ViewCount = table.Column<long>(type: "bigint", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Forms", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Leads_FormId",
                table: "Leads",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_Demos_FormId",
                table: "Demos",
                column: "FormId");

            migrationBuilder.CreateIndex(
                name: "IX_Forms_TenantId_Slug",
                table: "Forms",
                columns: new[] { "TenantId", "Slug" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Demos_Forms_FormId",
                table: "Demos",
                column: "FormId",
                principalTable: "Forms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Leads_Forms_FormId",
                table: "Leads",
                column: "FormId",
                principalTable: "Forms",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Demos_Forms_FormId",
                table: "Demos");

            migrationBuilder.DropForeignKey(
                name: "FK_Leads_Forms_FormId",
                table: "Leads");

            migrationBuilder.DropTable(
                name: "Forms");

            migrationBuilder.DropIndex(
                name: "IX_Leads_FormId",
                table: "Leads");

            migrationBuilder.DropIndex(
                name: "IX_Demos_FormId",
                table: "Demos");

            migrationBuilder.DropColumn(
                name: "FormId",
                table: "Leads");

            migrationBuilder.DropColumn(
                name: "FormId",
                table: "Demos");
        }
    }
}
