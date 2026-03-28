using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NavTour.Server.Services;
using NavTour.Shared.DTOs.Themes;

namespace NavTour.Server.Controllers;

[ApiController]
[Route("api/v1/themes")]
[Authorize]
public class ThemesController : ControllerBase
{
    private readonly ThemeService _themeService;

    public ThemesController(ThemeService themeService) => _themeService = themeService;

    [HttpGet]
    public async Task<ActionResult<List<ThemeResponse>>> GetAll()
        => Ok(await _themeService.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ThemeResponse>> GetById(Guid id)
    {
        var theme = await _themeService.GetByIdAsync(id);
        return theme == null ? NotFound() : Ok(theme);
    }

    [HttpPost]
    public async Task<ActionResult<ThemeResponse>> Create(CreateThemeRequest request)
        => Ok(await _themeService.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ThemeResponse>> Update(Guid id, UpdateThemeRequest request)
    {
        var theme = await _themeService.UpdateAsync(id, request);
        return theme == null ? NotFound() : Ok(theme);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => await _themeService.DeleteAsync(id) ? Ok() : NotFound();
}
