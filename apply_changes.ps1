$baseDir = "c:/Users/PC/Downloads/immoflow---crm-inmobiliario"

# 1. Update types.ts - Add vendedorId to Sale
$typesPath = Join-Path $baseDir "src/types.ts"
$content = Get-Content $typesPath -Raw -Encoding UTF8
$content = $content -replace '(\s+)propietarioId\?:\s*string;\s*\n\s+(precioPublicado)', "`$1propietarioId?: string;`n  vendedorId?: string;`n  precioPublicado"
$content = $content -replace '(\s+)propietarioId\?:\s*string;\s*\n\s+(montoMensual)', "`$1propietarioId?: string;`n  locadorId?: string;`n  montoMensual"
Set-Content $typesPath -Value $content -Encoding UTF8 -NoNewline
Write-Output "types.ts actualizado"