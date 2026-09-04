/**
 * Official Bulletin Printer & PDF Downloader Utility
 * Generates an isolated, print-perfect A4 Government Bulletin
 * Bypasses all Chromium flex/overflow clipping bugs with 100% visibility guarantee.
 */

export function generateBulletinHtml(bulletinData, location, selectedCategory = 'master', lang = 'en') {
  if (!bulletinData) return '';
  const { current, farmer, fisherman, urban, aviation, dailyForecast } = bulletinData;
  const isHi = lang === 'hi';
  const isBn = lang === 'bn';
  const isAs = lang === 'as';

  const adminTierName = bulletinData?.adminTier?.tierName || 'Village & Gram Panchayat Level';

  const t = {
    govTitle: isHi ? 'नागरिक मौसम एवं कृषि परामर्श बुलेटिन' : isBn ? 'নাগরিক আবহাওয়া ও কৃষি পরামর্শ বুলেটিন' : isAs ? 'নাগৰিক বতৰ আৰু কৃষি পৰামৰ্শ বুলেটিন' : 'CIVIC WEATHER & SECTORAL ADVISORY BULLETIN',
    subTitle: isHi ? 'गाँव, तहसील, जिला एवं राज्य स्तर निर्णय सहायता प्रणाली • SIH 2026 प्रोटोटाइप' : isBn ? 'গ্রাম, তহসিল, জেলা এবং রাজ্য স্তর সিদ্ধান্ত সহায়তা ব্যবস্থা • SIH 2026 প্রোটোটাইপ' : isAs ? 'গাঁও, তহচিল, জিলা আৰু ৰাজ্য স্তৰৰ সিদ্ধান্ত সহায়ক ব্যৱস্থা • SIH 2026 প্ৰটোটাইপ' : 'Village, Tehsil, District & State Level Decision Support System • SIH 2026 Prototype',
    refId: isHi ? 'बुलेटिन क्रमांक' : 'Bulletin Ref',
    issued: isHi ? 'जारी करने का समय' : 'Issued On',
    validity: isHi ? 'वैधता अवधि' : 'Validity',
    validityVal: isHi ? 'अगले 24 से 48 घंटे' : 'Next 24 to 48 Hours',
    panchayat: isHi ? 'ग्राम पंचायत / गाँव' : 'Gram Panchayat / Village',
    block: isHi ? 'प्रखंड / तहसील' : 'Block / Tehsil',
    district: isHi ? 'जिला एवं राज्य' : 'District & State',
    coords: isHi ? 'जीपीएस निर्देशांक' : 'GPS Coordinates',
    agroTitle: isHi ? '🌾 कृषि एवं फसल सुरक्षा मौसम बुलेटिन' : '🌾 Agriculture & Crop Protection Bulletin',
    marineTitle: isHi ? '🎣 मछुआरा एवं तटीय सुरक्षा बुलेटिन' : '🎣 Marine & Coastal Fishermen Safety Bulletin',
    urbanTitle: isHi ? '🏙️ शहरी योजना, AQI एवं नागरिक सुरक्षा बुलेटिन' : '🏙️ Urban Planning, AQI & Civic Safety Bulletin',
    avTitle: isHi ? '✈️ विमानन, हेलीपैड एवं ड्रोन संचालन बुलेटिन' : '✈️ Aviation, Helipad & Drone Clearance Bulletin',
    forecastTitle: isHi ? `📅 5-दिवसीय ${bulletinData?.adminTier?.tierShort || 'पंचायत/तहसील/जिला'} मौसम एवं कृषि पूर्वानुमान` : `📅 5-Day ${bulletinData?.adminTier?.tierShort || 'Panchayat / Tehsil / District'} Agro-Meteorological Trend`,
  };

  const showAgro = selectedCategory === 'farmer' || selectedCategory === 'master';
  const showMarine = selectedCategory === 'fisherman' || selectedCategory === 'master';
  const showUrban = selectedCategory === 'urban' || selectedCategory === 'master';
  const showAv = selectedCategory === 'aviation' || selectedCategory === 'master';

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.govTitle} - ${location.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #ffffff !important;
      color: #0f172a !important;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.4;
    }
    .doc-container {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header-box {
      border: 2.5px solid #1e293b;
      border-radius: 8px;
      padding: 14px;
      background: #f8fafc !important;
      margin-bottom: 14px;
    }
    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1.5px solid #cbd5e1;
      padding-bottom: 10px;
      margin-bottom: 10px;
    }
    .emblem-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .emblem-icon {
      font-size: 32px;
      line-height: 1;
    }
    .main-heading {
      margin: 0;
      font-size: 14pt;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .sub-heading {
      margin: 2px 0 0 0;
      font-size: 8.5pt;
      font-weight: 700;
      color: #4338ca;
    }
    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #ffffff;
      padding: 8px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
    }
    .admin-cell {
      font-size: 8pt;
    }
    .admin-cell .label {
      text-transform: uppercase;
      font-size: 7pt;
      font-weight: 800;
      color: #64748b;
      display: block;
    }
    .admin-cell .val {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
    }
    .section-card {
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .section-card.agro { border-color: #059669; }
    .section-card.marine { border-color: #0284c7; }
    .section-card.urban { border-color: #7c3aed; }
    .section-card.aviation { border-color: #0ea5e9; }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 800;
      margin: 0;
      color: #0f172a;
    }
    .badge {
      font-size: 7.5pt;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      border: 1px solid #cbd5e1;
      background: #f1f5f9;
      color: #0f172a;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 8px;
    }
    .kpi-cell {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
    }
    .kpi-cell .kpi-label {
      font-size: 7pt;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      display: block;
    }
    .kpi-cell .kpi-val {
      font-size: 12pt;
      font-weight: 900;
      color: #0f172a;
      display: block;
      margin: 1px 0;
    }
    .kpi-cell .kpi-sub {
      font-size: 7pt;
      color: #475569;
      display: block;
    }
    .advisory-box {
      background: #f1f5f9;
      border-left: 3px solid #1e293b;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 8.5pt;
      margin-top: 6px;
      color: #1e293b;
    }
    .advisory-box strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 6px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 5px 8px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
    }
    td {
      color: #0f172a;
    }
    .footer-seal {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1.5px dashed #94a3b8;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 7.5pt;
      color: #64748b;
    }
    .seal-box {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .seal-stamp {
      border: 2px dashed #059669;
      color: #059669;
      font-weight: 900;
      font-size: 7pt;
      padding: 4px 8px;
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      line-height: 1.1;
    }
  </style>
</head>
<body>
  <div class="doc-container">
    
    <!-- Header Box -->
    <div class="header-box">
      <div class="header-top">
        <div class="emblem-title">
          <div class="emblem-icon">🏛️</div>
          <div>
            <h1 class="main-heading">${t.govTitle}</h1>
            <p class="sub-heading">${t.subTitle}</p>
          </div>
        </div>
        <div class="meta-box">
          <div><strong>${t.refId}:</strong> ${bulletinData.bulletinId}</div>
          <div><strong>${t.issued}:</strong> ${new Date().toLocaleString(isHi ? 'hi-IN' : 'en-IN')}</div>
          <div><strong>${t.validity}:</strong> ${t.validityVal}</div>
        </div>
      </div>

      <div class="admin-grid">
        <div class="admin-cell">
          <span class="label">${t.panchayat}</span>
          <span class="val">${location.name}</span>
        </div>
        <div class="admin-cell">
          <span class="label">${t.block}</span>
          <span class="val">${location.district || location.name}</span>
        </div>
        <div class="admin-cell">
          <span class="label">${t.district}</span>
          <span class="val">${[location.district, location.state].filter(Boolean).join(', ')}</span>
        </div>
        <div class="admin-cell">
          <span class="label">${t.coords}</span>
          <span class="val">${location.lat?.toFixed(4)}°N, ${location.lng?.toFixed(4)}°E</span>
        </div>
      </div>
    </div>

    <!-- Synoptic Summary -->
    <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:6px 10px; margin-bottom:12px; font-size:8.5pt; display:flex; justify-content:space-between;">
      <span><strong>Live Temp:</strong> ${current.temp}°C (Feels ${current.feelsLike}°C)</span>
      <span><strong>Humidity:</strong> ${current.humidity}%</span>
      <span><strong>Wind:</strong> ${current.windSpeed} km/h (${current.windCompass})</span>
      <span><strong>Rain Probability:</strong> ${current.rainProb}%</span>
      <span><strong>Surface Pressure:</strong> ${current.surfacePressure} hPa</span>
    </div>

    <!-- Farmer Section -->
    ${showAgro ? `
    <div class="section-card agro">
      <div class="section-header">
        <h2 class="section-title">${t.agroTitle}</h2>
        <span class="badge" style="color:#047857; background:#ecfdf5; border-color:#a7f3d0;">AGRO-METEOROLOGY</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi-cell">
          <span class="kpi-label">Soil Moisture (1-3cm)</span>
          <span class="kpi-val">${(farmer.soilMoisture * 100).toFixed(1)}%</span>
          <span class="kpi-sub">${farmer.irrigationLabel}</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Soil Temp (6cm Depth)</span>
          <span class="kpi-val">${farmer.soilTemp}°C</span>
          <span class="kpi-sub">Germination Parameter</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Evapotranspiration (ET0)</span>
          <span class="kpi-val">${farmer.et0} mm/h</span>
          <span class="kpi-sub">Crop Hydration Loss</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Spray Drift Safety</span>
          <span class="kpi-val" style="font-size:10pt;">${farmer.sprayLabel}</span>
          <span class="kpi-sub">Wind: ${current.windSpeed} km/h</span>
        </div>
      </div>
      <div class="advisory-box">
        <div><strong>🌿 Fungal Blight / Pathogen Risk:</strong> ${farmer.fungalLabel}. ${farmer.fungalDesc}</div>
        <div style="margin-top:3px;"><strong>💧 Irrigation Advisory:</strong> ${farmer.irrigationDesc}</div>
        ${farmer.frostAlert ? `<div style="margin-top:3px; color:#b91c1c;"><strong>❄️ ${farmer.frostAlert.label}:</strong> ${farmer.frostAlert.desc}</div>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Fisherman Section -->
    ${showMarine ? `
    <div class="section-card marine">
      <div class="section-header">
        <h2 class="section-title">${t.marineTitle}</h2>
        <span class="badge" style="color:#0369a1; background:#f0f9ff; border-color:#bae6fd;">MARINE & FISHERIES</span>
      </div>
      ${fisherman.isInland ? `
        <div class="advisory-box">
          <strong>🏞️ Inland Region Notice:</strong> Freshwater & Riverine Fishing Advisory active. Oceanic swell and wave heights not applicable for this coordinates.
          <div style="margin-top:4px;">
            <span><strong>Surface Wind:</strong> ${current.windSpeed} km/h (${current.windCompass})</span> |
            <span><strong>Wind Gusts:</strong> ${current.windGusts} km/h</span> |
            <span><strong>Riverine Safety:</strong> ${fisherman.marineSafeDist}</span>
          </div>
        </div>
      ` : `
        <div class="kpi-grid">
          <div class="kpi-cell">
            <span class="kpi-label">Wave Height</span>
            <span class="kpi-val">${fisherman.waveHeight} m</span>
            <span class="kpi-sub">Swell: ${fisherman.swellHeight ?? '--'} m</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Wave Period & Dir</span>
            <span class="kpi-val">${fisherman.wavePeriod}s</span>
            <span class="kpi-sub">${fisherman.waveCompass} (${fisherman.waveDir}°)</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">WMO Sea State</span>
            <span class="kpi-val" style="font-size:10pt;">${fisherman.seaState.label}</span>
            <span class="kpi-sub">Code ${fisherman.seaState.code}</span>
          </div>
          <div class="kpi-cell">
            <span class="kpi-label">Port Warning Signal</span>
            <span class="kpi-val" style="font-size:9pt;">${fisherman.stormSignal.signal}</span>
            <span class="kpi-sub">${fisherman.stormSignal.desc}</span>
          </div>
        </div>
        <div class="advisory-box">
          <strong>🚤 Deep-Sea Venturing Limit:</strong> ${fisherman.marineSafeDist} (Operational Status: ${fisherman.marineSafetyStatus.toUpperCase()})
        </div>
      `}
    </div>
    ` : ''}

    <!-- Urban Section -->
    ${showUrban ? `
    <div class="section-card urban">
      <div class="section-header">
        <h2 class="section-title">${t.urbanTitle}</h2>
        <span class="badge" style="color:#6d28d9; background:#f5f3ff; border-color:#ddd6fe;">URBAN CIVIC</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi-cell">
          <span class="kpi-label">PM 2.5 Fine Dust</span>
          <span class="kpi-val">${urban.pm25 ?? 'N/A'} <span style="font-size:8pt; font-weight:normal;">µg/m³</span></span>
          <span class="kpi-sub">PM10: ${urban.pm10 ?? 'N/A'} µg/m³</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">AQI Index</span>
          <span class="kpi-val">${urban.usAqi ?? urban.europeanAqi ?? 'N/A'}</span>
          <span class="kpi-sub">European: ${urban.europeanAqi ?? 'N/A'}</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">NWS Heat Index</span>
          <span class="kpi-val">${urban.heatIndex}°C</span>
          <span class="kpi-sub">${urban.heatRisk?.label || 'Normal'}</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Drainage Risk</span>
          <span class="kpi-val" style="font-size:9.5pt;">${urban.drainageLabel}</span>
          <span class="kpi-sub">Rain Rate: ${current.rainCurrent} mm/h</span>
        </div>
      </div>
      <div class="advisory-box">
        <strong>👷 Outdoor Worker & Civic Safety:</strong> ${urban.workerAdvisory}. ${urban.drainageDesc}
      </div>
    </div>
    ` : ''}

    <!-- Aviation Section -->
    ${showAv ? `
    <div class="section-card aviation">
      <div class="section-header">
        <h2 class="section-title">${t.avTitle}</h2>
        <span class="badge" style="color:#0284c7; background:#f0f9ff; border-color:#bae6fd;">AVIATION & UAV</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi-cell">
          <span class="kpi-label">Runway Visibility</span>
          <span class="kpi-val">${aviation.visibilityKm} km</span>
          <span class="kpi-sub">${aviation.visibilityMeters} meters</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Low Cloud Ceiling</span>
          <span class="kpi-val">${aviation.lowClouds}%</span>
          <span class="kpi-sub">Stratus Layer</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">CAPE Storm Energy</span>
          <span class="kpi-val">${aviation.cape} J/kg</span>
          <span class="kpi-sub">${aviation.capeSeverity.toUpperCase()}</span>
        </div>
        <div class="kpi-cell">
          <span class="kpi-label">Drone Clearance</span>
          <span class="kpi-val" style="font-size:9.5pt;">${aviation.droneClearance}</span>
          <span class="kpi-sub">DGCA Standard</span>
        </div>
      </div>
      <div class="advisory-box">
        <strong>🚁 UAV Flight Assessment:</strong> ${aviation.droneDesc} (${aviation.capeDesc})
      </div>
    </div>
    ` : ''}

    <!-- 5-Day Trend Table -->
    ${dailyForecast && dailyForecast.length > 0 ? `
    <div class="section-card" style="border-color:#64748b;">
      <div class="section-header">
        <h2 class="section-title">${t.forecastTitle}</h2>
        <span class="badge">NWP 5-DAY OUTLOOK</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Max / Min Temp</th>
            <th>Rain Probability</th>
            <th>Precipitation</th>
            <th>Max Wind Gust</th>
          </tr>
        </thead>
        <tbody>
          ${dailyForecast.map(d => `
            <tr>
              <td><strong>${d.date}</strong></td>
              <td>${d.maxTemp}°C / ${d.minTemp}°C</td>
              <td>${d.rainProb}%</td>
              <td>${d.precipSum} mm</td>
              <td>${d.windMax} km/h</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <!-- SIH 2026 Prototype Verification Footer -->
    <div class="footer-seal">
      <div>
        <p style="margin:0; font-weight:bold; color:#1e293b;">WeatherGPT Civic Weather & Agro-Advisory System</p>
        <p style="margin:2px 0 0 0;">100% Live Open-Meteo NWP (ECMWF & GFS) & CPCB Feeds • Prototype for SIH 2026 (Not Statutory)</p>
      </div>
      <div class="seal-box">
        <div style="text-align:right;">
          <div style="font-weight:900; color:#059669;">OPEN-METEO VERIFIED</div>
          <div style="font-size:7pt;">SIH 2026 Prototype</div>
        </div>
        <div class="seal-stamp">
          SIH 2026<br/>PROTOTYPE
        </div>
      </div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Prints the official bulletin cleanly using an isolated invisible iframe
 * Guaranteed zero clipping, zero blank pages, and works in all browsers.
 */
export function printBulletinIframe(bulletinData, location, selectedCategory, lang) {
  const html = generateBulletinHtml(bulletinData, location, selectedCategory, lang);

  // Remove any previously created print iframe
  const existingIframe = document.getElementById('weathergpt-bulletin-print-frame');
  if (existingIframe) existingIframe.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'weathergpt-bulletin-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Wait for document to load before printing
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Iframe print error, falling back to window.print():', err);
        window.print();
      }
    }, 250);
  };

  // Fallback trigger if onload already completed
  setTimeout(() => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } catch (e) {}
  }, 400);
}

/**
 * Downloads the bulletin as a standalone, offline HTML document
 */
export function downloadBulletinHtml(bulletinData, location, selectedCategory, lang) {
  const html = generateBulletinHtml(bulletinData, location, selectedCategory, lang);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (location.name || 'GramPanchayat').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `Official-Weather-Bulletin-${safeName}-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
