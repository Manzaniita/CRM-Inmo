
"$content = Get-Content 'src/pages/Sales.tsx' -Raw -Encoding UTF8

# Insert vendedor select before the Moneda label block
$marker = '            <div>\r\n              <label className=\"block text-xs font-black text-gray-400 uppercase tracking-widest mb-2\">Moneda *</label>'

$insert = @'
            <div>
              <SearchableSelect
                label="Vendedor / Agente"
                value={formData.vendedorId || ''}
                onChange={val => setFormData({...formData, vendedorId: val || undefined})}
                options={clients.map(c => ({ value: c.id, label: c.name, subtitle: c.phone }))}
                placeholder="Seleccionar agente (opcional)"
                allowEmpty={true}
              />
            </div>

'@

$content = $content -replace ([regex]::Escape($marker)), ($insert + $marker)

Set-Content 'src/pages/Sales.tsx' -Value $content -Encoding UTF8 -NoNewline
Write-Output 'Vendedor field inserted in Sales form'"