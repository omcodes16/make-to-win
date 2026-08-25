const fs = require('fs');
let code = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');

// Replace hardcoded alert metrics
code = code.replace(/<div className="text-lg font-bold">\{alert.level === 'Severe' \? '96%' : alert.level === 'Caution' \? '65%' : '10%'\}<\/div>/g, '<div className="text-lg font-bold">{alert.prob}</div>');

code = code.replace(/<div className="text-lg font-bold">\{alert.level === 'Severe' \? '85–120' : '10-30'\} <span className="text-xs font-normal text-white\\/50">mm<\\/span><\\/div>/g, '<div className="text-lg font-bold">{alert.rain} <span className="text-xs font-normal text-white/50">{alert.rain !== "Unknown" ? "mm" : ""}</span></div>');

code = code.replace(/<div className="text-lg font-bold">Next 6 hrs<\\/div>/g, '<div className="text-lg font-bold">{alert.window}</div>');

code = code.replace(/<div className="text-lg font-bold text-amber-400">\{alert.level === 'Severe' \? 'High' : 'Low'\}<\\/div>/g, '<div className={\	ext-lg font-bold \\}>{alert.impact}</div>');

// Replace impact areas hardcoded
const impactBlockRegex = /<h3 className="text-sm font-bold text-white\\/90 tracking-wide mb-5">Alert Impact Areas<\\/h3>[\\s\\S]*?<\\/div>\\s*<\\/div>/;
const newImpactBlock = \<h3 className="text-sm font-bold text-white/90 tracking-wide mb-5">Alert Impact Areas</h3>
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    <span className="text-xs font-medium text-white/80">Flooding</span>
                  </div>
                  <span className={\\\	ext-[10px] font-bold uppercase \\\\}>{impactStats.flood}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                    <span className="text-xs font-medium text-white/80">Road Disruption</span>
                  </div>
                  <span className={\\\	ext-[10px] font-bold uppercase \\\\}>{impactStats.road}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span className="text-xs font-medium text-white/80">Crop Damage Risk</span>
                  </div>
                  <span className={\\\	ext-[10px] font-bold uppercase \\\\}>{impactStats.crop}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span className="text-xs font-medium text-white/80">Power Outage</span>
                  </div>
                  <span className={\\\	ext-[10px] font-bold uppercase \\\\}>{impactStats.power}</span>
                </div>
              </div>
            </div>\;

code = code.replace(impactBlockRegex, newImpactBlock);

// Replace Map SVG and dynamic loc list
const mapBlockRegex = /<div className="w-1\\/2 flex items-center justify-center opacity-80">[\\s\\S]*?<\\/div>\\s*<\\/div>/;
const newMapBlock = \<div className="w-1/2 flex items-center justify-center opacity-80 p-2">
                  <img src="/india.svg" alt="India Map" className="w-full h-full drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 10px rgba(239,68,68,0.2))' }} />
                </div>
                <div className="w-1/2 flex flex-col justify-center gap-3">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest border-b border-white/5 pb-1 mb-1">Top Risk States</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/90 font-bold truncate pr-2" title={locName}>{locName}</span>
                    <span className={\\\lex items-center gap-1 shrink-0 \\\\}>
                      <span className={\\\w-1.5 h-1.5 rounded-full \\\\}></span> {impactStats.flood}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Assam</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> High</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">West Bengal</span>
                    <span className="flex items-center gap-1 text-amber-400"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> High</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/80">Bihar</span>
                    <span className="flex items-center gap-1 text-yellow-400"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> Moderate</span>
                  </div>
                </div>
              </div>
            </div>\;
code = code.replace(mapBlockRegex, newMapBlock);

fs.writeFileSync('src/components/AlertsScreen.jsx', code);
