/**
 * csvExport.js - Scientific CSV Export Utility for Climate Analytics
 * 
 * Part of WeatherGPT Research & Climate Analytics (SIH PS-26068).
 * Generates formatted CSV files containing historical ERA5 climate indices
 * with metadata comment header blocks and triggers browser Blob download.
 */

/**
 * Exports climate dataset to a downloadable CSV file.
 *
 * @param {Array<Object>} data - Array of yearly climate data records.
 * @param {Object} metadata - Metadata describing the dataset.
 * @param {string} [metadata.location] - Location name.
 * @param {{ lat: number, lng: number }|{ latitude: number, longitude: number }} [metadata.coordinates] - Coordinates.
 * @param {string} [metadata.period] - Time period (e.g. "1990–2026").
 * @param {string} [metadata.source] - Data provider (default: "ERA5 Reanalysis via Open-Meteo").
 * @param {string} [metadata.generated] - Real timestamp of data generation.
 */
export function exportToCSV(data = [], metadata = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('[csvExport] No climate data records available to export.');
    return;
  }

  const locationName = metadata.location || 'Unknown Location';
  const lat = metadata.coordinates?.lat ?? metadata.coordinates?.latitude ?? 'N/A';
  const lng = metadata.coordinates?.lng ?? metadata.coordinates?.longitude ?? 'N/A';
  const period = metadata.period || `${data[0]?.year || '1990'}–${data[data.length - 1]?.year || 'present'}`;
  const source = metadata.source || 'ERA5 Reanalysis via Open-Meteo';
  // Generated timestamp must be the real current time
  const generatedTime = metadata.generated || new Date().toISOString();

  // Scientific metadata comment block (# prefixed as standard for atmospheric/climate datasets)
  const headerComments = [
    '# =========================================================================',
    '# WeatherGPT Research & Climate Analytics Dataset (SIH PS-26068)',
    `# Source: ${source}`,
    `# Location: ${locationName}`,
    `# Coordinates: Latitude ${lat}, Longitude ${lng}`,
    `# Time Period: ${period}`,
    `# Generated At: ${generatedTime}`,
    '# Indices Reference:',
    '#   - CDD: Consecutive Dry Days (daily precipitation < 1.0mm)',
    '#   - CWD: Consecutive Wet Days (daily precipitation >= 1.0mm)',
    '#   - Heatwave Days: Temp > seasonal baseline mean + 5°C for >= 3 consecutive days',
    '#   - Extreme Rain Days: Daily precipitation > 100mm (R100mm index)',
    '#   - GDD: Growing Degree Days accumulated with Base Temp 10°C',
    '# ========================================================================='
  ].join('\n');

  // CSV Column Headers
  const columns = [
    'Year',
    'Mean Temperature (°C)',
    'Peak Max Temperature (°C)',
    'Lowest Min Temperature (°C)',
    'Total Precipitation (mm)',
    'Consecutive Dry Days (CDD)',
    'Consecutive Wet Days (CWD)',
    'Heatwave Days (>Seasonal+5C)',
    'Extreme Rain Days (>100mm)',
    'Growing Degree Days (GDD Base 10C)'
  ];

  // Map rows
  const rows = data.map(d => [
    d.year ?? '',
    d.meanTemp != null ? d.meanTemp : '',
    d.maxTemp != null ? d.maxTemp : '',
    d.minTemp != null ? d.minTemp : '',
    d.totalPrecip != null ? d.totalPrecip : '',
    d.cdd ?? 0,
    d.cwd ?? 0,
    d.heatwaveDays ?? 0,
    d.extremeRainDays ?? 0,
    d.gdd ?? 0
  ].join(','));

  const csvContent = `${headerComments}\n${columns.join(',')}\n${rows.join('\n')}\n`;

  // Trigger browser Blob download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Clean filename
  const cleanLoc = locationName.toLowerCase().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
  const filename = `climate_data_${cleanLoc}_${period.replace(/[^0-9–-]/g, '')}.csv`;
  link.setAttribute('download', filename);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
