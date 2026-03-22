using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Leads;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/leads")]
[Authorize]
public class LeadsController : ControllerBase
{
    private readonly ILeadService _leadService;

    public LeadsController(ILeadService leadService)
    {
        _leadService = leadService;
    }

    [HttpGet]
    public async Task<ActionResult<List<LeadResponse>>> GetAll()
    {
        return Ok(await _leadService.GetAllAsync());
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        return await _leadService.DeleteAsync(id) ? NoContent() : NotFound();
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export()
    {
        var leads = await _leadService.GetAllAsync();

        using var workbook = new XLWorkbook();
        var ws = workbook.Worksheets.Add("Leads");

        ws.Cell(1, 1).Value = "Email";
        ws.Cell(1, 2).Value = "Name";
        ws.Cell(1, 3).Value = "Company";
        ws.Cell(1, 4).Value = "Demo";
        ws.Cell(1, 5).Value = "Captured";

        ws.Row(1).Style.Font.Bold = true;

        for (var i = 0; i < leads.Count; i++)
        {
            var row = i + 2;
            ws.Cell(row, 1).Value = leads[i].Email;
            ws.Cell(row, 2).Value = leads[i].Name;
            ws.Cell(row, 3).Value = leads[i].Company;
            ws.Cell(row, 4).Value = leads[i].DemoName;
            ws.Cell(row, 5).Value = leads[i].CapturedAt;
        }

        ws.Columns().AdjustToContents();

        var stream = new MemoryStream();
        workbook.SaveAs(stream);
        stream.Position = 0;

        var fileName = $"leads-{DateTime.UtcNow:yyyy-MM-dd}.xlsx";
        return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
