    const isProb = true;
    const maxRain = 50;
    const locName = "Test";
    const probValue = 10;
    const rainRange = "10-20";
    const severeThreshold = 40;
    const cautionThreshold = 20;
    const alerts = [];

    if (maxRain > severeThreshold) {
      alerts.push({
        id: 'rain',
        title: `Heavy Rain & Flood Risk in ${locName}`,
        desc: isProb ? `High probability (${maxRain}%) of severe rain.` : `High precipitation (${maxRain}mm) expected. Low-lying areas may face waterlogging.`,
        precaution: `Avoid unnecessary travel. Move livestock to higher ground and secure outdoor equipment.`,
        level: 'Severe', prob: `${probValue}%`, rain: rainRange, window: 'Next 12 hrs', impact: 'High'
      });
    } else if (maxRain > cautionThreshold) {
      alerts.push({
        id: 'rain-mod',
        title: `Moderate Rain in ${locName}`,
        desc: isProb ? `Moderate chance (${maxRain}%) of rain.` : `Steady rainfall expected (${maxRain}mm).`,
        precaution: `Roads may be slippery. If spraying crops, consider delaying until the rain clears.`,
        level: 'Caution', prob: `${probValue}%`, rain: rainRange, window: 'Next 24 hrs', impact: 'Moderate'
      });
    }
    console.log(alerts);
