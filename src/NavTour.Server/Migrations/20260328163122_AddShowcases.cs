using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddShowcases : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Showcases",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Slug = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    LayoutTheme = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Autoplay = table.Column<bool>(type: "bit", nullable: false),
                    Settings = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ViewCount = table.Column<long>(type: "bigint", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Showcases", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ShowcaseSections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShowcaseId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowcaseSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShowcaseSections_Showcases_ShowcaseId",
                        column: x => x.ShowcaseId,
                        principalTable: "Showcases",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ShowcaseItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SectionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DemoId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false),
                    TitleOverride = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShowcaseItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ShowcaseItems_ShowcaseSections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "ShowcaseSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShowcaseItems_SectionId",
                table: "ShowcaseItems",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_Showcases_TenantId_Slug",
                table: "Showcases",
                columns: new[] { "TenantId", "Slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ShowcaseSections_ShowcaseId",
                table: "ShowcaseSections",
                column: "ShowcaseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShowcaseItems");

            migrationBuilder.DropTable(
                name: "ShowcaseSections");

            migrationBuilder.DropTable(
                name: "Showcases");
        }
    }
}
