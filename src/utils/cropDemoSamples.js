/**
 * Crop Demo Samples for SIH 2026 Presentation
 * Generates high-fidelity visual representations of diseased/damaged crop leaves
 * so evaluators can test live diagnosis in 1 click without needing a real leaf on stage.
 */

// Generate realistic leaf canvases and convert to data URLs
export function getSampleCropImage(sampleKey) {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - soil/field ambiance
  const bgGrad = ctx.createLinearGradient(0, 0, 400, 300);
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 400, 300);

  if (sampleKey === 'potato_late_blight') {
    // Large green potato leaf
    ctx.save();
    ctx.translate(200, 150);
    ctx.rotate(0.1);

    // Leaf shape
    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.bezierCurveTo(80, -70, 95, 40, 0, 110);
    ctx.bezierCurveTo(-95, 40, -80, -70, 0, -110);
    ctx.fillStyle = '#2d6a4f';
    ctx.fill();
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Central vein
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.lineTo(0, 100);
    ctx.strokeStyle = '#52b788';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Lateral veins
    for (let y = -70; y < 80; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(45, y - 15);
      ctx.moveTo(0, y);
      ctx.lineTo(-45, y - 15);
      ctx.strokeStyle = '#40916c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Late Blight dark water-soaked necrotic lesions spreading from tip & margins
    const drawLesion = (x, y, rx, ry, angle) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      // Pale chlorotic yellow border
      ctx.beginPath();
      ctx.ellipse(0, 0, rx + 6, ry + 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(217, 249, 157, 0.45)';
      ctx.fill();
      // Dark brown necrotic center
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#2b1810';
      ctx.fill();
      // Water-soaked edge
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    };

    drawLesion(0, -80, 28, 20, 0);
    drawLesion(42, -20, 24, 18, 0.4);
    drawLesion(-35, 10, 30, 22, -0.3);
    drawLesion(20, 50, 26, 16, 0.2);

    ctx.restore();
  } else if (sampleKey === 'rice_blast') {
    // Elongated slender paddy blade
    ctx.save();
    ctx.translate(200, 150);
    ctx.rotate(-0.08);

    // Blade
    ctx.beginPath();
    ctx.moveTo(0, -135);
    ctx.quadraticCurveTo(35, 0, 0, 135);
    ctx.quadraticCurveTo(-35, 0, 0, -135);
    ctx.fillStyle = '#40916c';
    ctx.fill();
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vein line
    ctx.beginPath();
    ctx.moveTo(0, -130);
    ctx.lineTo(0, 130);
    ctx.strokeStyle = '#74c69d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spindle / eye-shaped blast lesions
    const drawBlastLesion = (x, y, w, h) => {
      ctx.save();
      ctx.translate(x, y);
      // Outer brown ring
      ctx.beginPath();
      ctx.moveTo(0, -h);
      ctx.quadraticCurveTo(w, 0, 0, h);
      ctx.quadraticCurveTo(-w, 0, 0, -h);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      // Inner grey ash center
      ctx.beginPath();
      ctx.moveTo(0, -h * 0.6);
      ctx.quadraticCurveTo(w * 0.5, 0, 0, h * 0.6);
      ctx.quadraticCurveTo(-w * 0.5, 0, 0, -h * 0.6);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.restore();
    };

    drawBlastLesion(0, -50, 12, 28);
    drawBlastLesion(4, 15, 10, 22);
    drawBlastLesion(-5, 70, 9, 20);

    ctx.restore();
  } else if (sampleKey === 'tomato_early_blight') {
    // Serrated tomato leaf
    ctx.save();
    ctx.translate(200, 150);

    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.bezierCurveTo(70, -60, 85, 30, 0, 100);
    ctx.bezierCurveTo(-85, 30, -70, -60, 0, -100);
    ctx.fillStyle = '#386641';
    ctx.fill();

    // Concentric rings (target board spots)
    const drawTargetSpot = (x, y, r) => {
      ctx.save();
      ctx.translate(x, y);
      // Yellow halo
      ctx.beginPath();
      ctx.arc(0, 0, r + 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.fill();
      // Brown spot
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      // Concentric rings
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    };

    drawTargetSpot(-15, -40, 18);
    drawTargetSpot(25, 10, 22);
    drawTargetSpot(-10, 50, 14);

    ctx.restore();
  } else if (sampleKey === 'hail_damage') {
    // Hail damage with torn lamina and brown bruised edges
    ctx.save();
    ctx.translate(200, 150);
    ctx.rotate(0.2);

    ctx.beginPath();
    ctx.moveTo(0, -110);
    ctx.lineTo(60, -70);
    // Punctured tears
    ctx.lineTo(20, -50);
    ctx.lineTo(75, -20);
    ctx.lineTo(15, 0);
    ctx.lineTo(70, 50);
    ctx.lineTo(0, 110);
    ctx.lineTo(-70, 40);
    ctx.lineTo(-25, 10);
    ctx.lineTo(-65, -30);
    ctx.lineTo(-15, -55);
    ctx.closePath();
    ctx.fillStyle = '#4f772d';
    ctx.fill();
    ctx.strokeStyle = '#31572c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hail puncture holes & bruising
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(15, -20, 12, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(-18, 25, 14, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Necrotic edges around tears
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  }

  // Label watermark
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.textAlign = 'right';
  ctx.fillText('Mausam-Drishti Diagnostic Sample', 385, 285);

  return canvas.toDataURL('image/jpeg', 0.85);
}

export const DEMO_SAMPLE_ITEMS = [
  {
    key: 'potato_late_blight',
    name: 'Potato: Late Blight',
    nameHi: 'आलू: पछेती झुलसा',
    crop: 'potato',
    icon: '🥔',
    badge: 'Fungal / Spores',
    color: 'border-red-500/40 text-red-300'
  },
  {
    key: 'rice_blast',
    name: 'Rice: Blast Disease',
    nameHi: 'धान: झुलसा रोग (ब्लास्ट)',
    crop: 'rice',
    icon: '🌾',
    badge: 'Humidity Driven',
    color: 'border-amber-500/40 text-amber-300'
  },
  {
    key: 'tomato_early_blight',
    name: 'Tomato: Early Blight',
    nameHi: 'टमाटर: अगेती झुलसा',
    crop: 'tomato',
    icon: '🍅',
    badge: 'Target Spots',
    color: 'border-orange-500/40 text-orange-300'
  },
  {
    key: 'hail_damage',
    name: 'Wheat: Hail Damage',
    nameHi: 'गेहूं/फसल: ओलावृष्टि क्षति',
    crop: 'wheat',
    icon: '🌧️',
    badge: 'PMFBY Insurance',
    color: 'border-sky-500/40 text-sky-300'
  }
];
