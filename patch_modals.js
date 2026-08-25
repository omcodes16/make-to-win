const fs = require('fs');
let code = fs.readFileSync('src/components/AlertsScreen.jsx', 'utf8');

// 1. Add state
code = code.replace('const [isLoadingNews, setIsLoadingNews] = useState(true);', 'const [isLoadingNews, setIsLoadingNews] = useState(true);\n  const [activeModal, setActiveModal] = useState(null);');

// 2. Add onClick to buttons
code = code.replace(/<button className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white\\/5 transition-colors rounded-l-xl">/g, '<button onClick={() => setActiveModal("radar")} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors rounded-l-xl">');
code = code.replace(/<button className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white\\/5 transition-colors">\\s*<svg className="w-6 h-6 text-blue-400"/g, '<button onClick={() => setActiveModal("satellite")} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">\n              <svg className="w-6 h-6 text-blue-400"');
code = code.replace(/<button className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white\\/5 transition-colors">\\s*<svg className="w-6 h-6 text-cyan-400"/g, '<button onClick={() => setActiveModal("river")} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">\n              <svg className="w-6 h-6 text-cyan-400"');
code = code.replace(/<button className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white\\/5 transition-colors">\\s*<svg className="w-6 h-6 text-amber-400"/g, '<button onClick={() => setActiveModal("warnings")} className="flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors">\n              <svg className="w-6 h-6 text-amber-400"');
code = code.replace(/<button className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 hover:bg-white\\/5 transition-colors rounded-r-xl">/g, '<button onClick={() => setActiveModal("safety")} className="col-span-2 md:col-span-1 flex flex-col items-center justify-center gap-2 p-4 hover:bg-white/5 transition-colors rounded-r-xl">');

// 3. Render Modal
const modalJSX = 
      {/* Quick Links Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
          <div className="bg-[#11131c] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {activeModal === 'radar' && <><span className="text-purple-400">●</span> Live Rain Radar</>}
                {activeModal === 'satellite' && <><span className="text-blue-400">●</span> Satellite Cloud Cover</>}
                {activeModal === 'river' && <><span className="text-cyan-400">●</span> River Levels & Flood Monitor</>}
                {activeModal === 'warnings' && <><span className="text-amber-400">●</span> District Early Warnings</>}
                {activeModal === 'safety' && <><span className="text-green-400">●</span> Emergency Safety Guide</>}
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-white/50 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 bg-black/20">
              {(activeModal === 'radar' || activeModal === 'satellite') && (
                <iframe 
                  width="100%" 
                  height="500" 
                  src={\https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=%C2%B0C&metricWind=km%2Fh&zoom=5&overlay=\&product=ecmwf&level=surface&lat=\&lon=\\}
                  frameBorder="0"
                  title="Weather Map"
                ></iframe>
              )}
              
              {activeModal === 'river' && (
                <div className="p-6 text-center">
                  <svg className="w-16 h-16 text-cyan-500 mx-auto mb-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                  <h4 className="text-xl font-bold text-white mb-2">Central Water Commission (CWC) Integration</h4>
                  <p className="text-white/60 mb-6 max-w-lg mx-auto">Real-time river basin monitoring and flood forecasting data will be displayed here when connected to the official CWC telemetry API.</p>
                  <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4 max-w-sm text-left">
                    <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">Simulated Data - Brahmaputra Basin</div>
                    <div className="flex justify-between items-center text-sm mb-1"><span className="text-white/70">Current Level:</span> <span className="font-bold text-red-400">86.5m (Above Danger)</span></div>
                    <div className="flex justify-between items-center text-sm"><span className="text-white/70">Trend:</span> <span className="font-bold text-yellow-400">Rising</span></div>
                  </div>
                </div>
              )}

              {activeModal === 'warnings' && (
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    <span className="font-medium text-amber-200">2 Active Bulletins from IMD for {locationName || 'your region'}</span>
                  </div>
                  <div className="space-y-4">
                    {liveAlerts.filter(a => a.id !== 'all-clear').length > 0 ? (
                      liveAlerts.filter(a => a.id !== 'all-clear').map(alert => (
                        <div key={alert.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="font-bold text-white/90">{alert.title}</h5>
                            <span className="text-[10px] text-white/40">Issued: Just now</span>
                          </div>
                          <p className="text-sm text-white/60">{alert.desc}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-white/40">No active warnings for this location.</div>
                    )}
                  </div>
                </div>
              )}

              {activeModal === 'safety' && (
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2"><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Flood Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Move to higher ground immediately.</li>
                      <li>Do not walk or drive through flood waters.</li>
                      <li>Turn off utilities at the main switches.</li>
                      <li>Disconnect electrical appliances.</li>
                    </ul>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-orange-400 mb-4 flex items-center gap-2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Cyclone Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Stay indoors and away from windows.</li>
                      <li>Keep an emergency kit ready (radio, torch).</li>
                      <li>Store drinking water in clean containers.</li>
                      <li>Do not venture out until official clear signal.</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-yellow-400 mb-4 flex items-center gap-2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Lightning Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Seek shelter in a substantial building.</li>
                      <li>Avoid isolated trees and tall objects.</li>
                      <li>Stay away from water and metal objects.</li>
                      <li>If outdoors, crouch down with feet together.</li>
                    </ul>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-xl">
                    <h4 className="font-bold text-red-400 mb-4 flex items-center gap-2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Heatwave Safety</h4>
                    <ul className="space-y-2 text-sm text-white/70 list-disc list-inside">
                      <li>Drink plenty of water even if not thirsty.</li>
                      <li>Wear lightweight, light-colored clothing.</li>
                      <li>Avoid strenuous activities during peak hours.</li>
                      <li>Never leave children or pets in parked vehicles.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
;

code = code.replace('    </div>\n  );\n}\n', modalJSX + '\n    </div>\n  );\n}\n');

fs.writeFileSync('src/components/AlertsScreen.jsx', code);
