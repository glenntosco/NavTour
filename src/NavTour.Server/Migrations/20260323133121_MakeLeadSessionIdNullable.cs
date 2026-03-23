using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NavTour.Server.Migrations
{
    /// <inheritdoc />
    public partial class MakeLeadSessionIdNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leads_SessionId",
                table: "Leads");

            migrationBuilder.AlterColumn<Guid>(
                name: "SessionId",
                table: "Leads",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.CreateIndex(
                name: "IX_Leads_SessionId",
                table: "Leads",
                column: "SessionId",
                unique: true,
                filter: "[SessionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Leads_SessionId",
                table: "Leads");

            migrationBuilder.AlterColumn<Guid>(
                name: "SessionId",
                table: "Leads",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Leads_SessionId",
                table: "Leads",
                column: "SessionId",
                unique: true);
        }
    }
}
