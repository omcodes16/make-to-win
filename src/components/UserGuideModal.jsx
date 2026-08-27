import React from "react";
import { useApp } from "../context/AppContext";

const GUIDE_CONTENT = {
  en: {
    title: "Complete Platform Features Guide",
    subtitle: "Everything you can do with WeatherGPT",
    sections: [
      {
        title: "🤖 1. Smart AI Chatbot (Core Feature)",
        items: [
          { name: "Multilingual Conversations", desc: "Chat in English, Hindi, Bengali, or Assamese. The AI automatically understands your intent and responds contextually." },
          { name: "Voice Support (Speech-to-Text & TTS)", desc: "Click the microphone to speak your question. Click the speaker icon on any AI response to hear it spoken aloud using Cloud TTS." },
          { name: "Context-Aware Memory", desc: "The AI remembers your location and previous questions. You can say 'What about tomorrow?' and it knows you are talking about your current city." }
        ]
      },
      {
        title: "📊 2. Advanced Weather Dashboard",
        items: [
          { name: "Live Hyper-Local Data", desc: "Fetches real-time temperature, humidity, wind speed, UV index, and 'Feels Like' metrics instantly based on your GPS or searched city." },
          { name: "Hourly & 7-Day Forecasting", desc: "Visual interactive sliders and grids showing precise weather breakdowns for the upcoming week." },
          { name: "Interactive Radar Maps", desc: "View live precipitation, temperature, and wind flow directly on the map layer." }
        ]
      },
      {
        title: "🎯 3. Specialized Hubs (Our Addition)",
        items: [
          { name: "Farmer Profile", desc: "Gives crop-specific calendars, soil moisture tips, and pesticide/fertilizer spraying advice based on upcoming rain." },
          { name: "Fisherman Profile", desc: "Shows live marine conditions, wave heights, tide charts, and safe fishing zones." },
          { name: "Aviation & Urban Profiles", desc: "Visibility, wind shear alerts for pilots; AQI and infrastructure alerts for city planners." }
        ]
      },
      {
        title: "🧠 4. NWP Model Divergence (Advanced)",
        items: [
          { name: "Supercomputer Comparison", desc: "We pull data from the world's top 3 models (GFS, ICON, ECMWF)." },
          { name: "Divergence Warning", desc: "If the models strongly disagree (e.g., one predicts heavy rain, another predicts clear skies), we show a Yellow 'Divergence' badge to warn you of low forecast confidence." }
        ]
      },
      {
        title: "🚨 5. Disaster Alerts & Offline Mode",
        items: [
          { name: "Severity Detection", desc: "The AI automatically scans forecasts for heatwaves, cyclones, or floods and generates Red/Yellow alerts." },
          { name: "SMS Broadcast Simulation", desc: "If internet goes down during a disaster, authorities can trigger offline SMS warnings directly to rural feature phones." }
        ]
      },
      {
        title: "🌍 6. Community & Extra Features",
        items: [
          { name: "Crowdsource Reporting", desc: "Users can report local ground-truth weather (e.g., 'It is flooding here') to help validate the AI's data." },
          { name: "Historical Analytics", desc: "Compare today's weather with 10-year historical averages to track climate change trends." },
          { name: "Progressive Web App (PWA)", desc: "Install this website directly to your phone's home screen like a native app." }
        ]
      }
    ],
    close: "Close Guide"
  },
  hi: {
    title: "संपूर्ण प्लेटफ़ॉर्म फ़ीचर गाइड",
    subtitle: "WeatherGPT की सभी उन्नत सुविधाएँ",
    sections: [
      {
        title: "🤖 1. स्मार्ट AI चैटबॉट (मुख्य फ़ीचर)",
        items: [
          { name: "बहुभाषी बातचीत", desc: "अंग्रेजी, हिंदी, बंगाली या असमिया में चैट करें। AI आपकी भाषा को समझकर सटीक उत्तर देता है।" },
          { name: "आवाज़ समर्थन (Voice & TTS)", desc: "बोलकर सवाल पूछने के लिए माइक पर क्लिक करें। AI का जवाब सुनने के लिए स्पीकर आइकन दबाएं।" },
          { name: "कॉन्टेक्स्ट-अवेयर मेमोरी", desc: "AI आपका स्थान और पिछले सवाल याद रखता है। आप 'कल का क्या?' पूछ सकते हैं और वह समझ जाएगा।" }
        ]
      },
      {
        title: "📊 2. उन्नत मौसम डैशबोर्ड",
        items: [
          { name: "लाइव हाइपर-लोकल डेटा", desc: "आपके GPS या खोजे गए शहर के आधार पर वास्तविक तापमान, हवा, और 'Feels Like' डेटा प्राप्त करता है।" },
          { name: "प्रति घंटा और 7-दिन का पूर्वानुमान", desc: "आने वाले सप्ताह के सटीक मौसम विवरण को देखने के लिए इंटरैक्टिव ग्रिड।" },
          { name: "इंटरैक्टिव रडार मैप्स", desc: "मैप पर लाइव बारिश, तापमान और हवा का बहाव देखें।" }
        ]
      },
      {
        title: "🎯 3. विशेषज्ञ हब (हमारा नया फ़ीचर)",
        items: [
          { name: "किसान प्रोफ़ाइल", desc: "फसल कैलेंडर, मिट्टी की नमी, और बारिश के आधार पर कीटनाशक छिड़काव की सलाह।" },
          { name: "मछुआरा प्रोफ़ाइल", desc: "समुद्री लहरों की ऊंचाई, ज्वार-भाटा (Tide), और सुरक्षित मछली पकड़ने के क्षेत्र दिखाता है।" },
          { name: "विमानन और शहरी प्रोफ़ाइल", desc: "पायलटों के लिए दृश्यता अलर्ट; शहर योजनाकारों के लिए AQI अलर्ट।" }
        ]
      },
      {
        title: "🧠 4. NWP मॉडल डायवर्जेंस (सुपरकंप्यूटर तुलना)",
        items: [
          { name: "विश्व के शीर्ष 3 मॉडल", desc: "हम GFS, ICON, और ECMWF से डेटा की तुलना करते हैं।" },
          { name: "डायवर्जेंस चेतावनी", desc: "यदि मॉडल आपस में असहमत हैं (एक बारिश कहता है, दूसरा सूखा), तो हम पूर्वानुमान में कम विश्वास की चेतावनी (Yellow Badge) देते हैं।" }
        ]
      },
      {
        title: "🚨 5. आपदा अलर्ट और ऑफ़लाइन मोड",
        items: [
          { name: "गंभीरता का पता लगाना", desc: "AI हीटवेव या बाढ़ के लिए पूर्वानुमान स्कैन करता है और रेड/येलो अलर्ट उत्पन्न करता है।" },
          { name: "SMS ब्रॉडकास्ट (ऑफ़लाइन)", desc: "आपदा के दौरान इंटरनेट बंद होने पर, अधिकारियों द्वारा सीधे साधारण फोन पर SMS चेतावनी भेजी जा सकती है।" }
        ]
      },
      {
        title: "🌍 6. सामुदायिक और अतिरिक्त सुविधाएँ",
        items: [
          { name: "क्राउडसोर्स रिपोर्टिंग", desc: "उपयोगकर्ता अपने क्षेत्र के वास्तविक मौसम की रिपोर्ट कर सकते हैं।" },
          { name: "ऐतिहासिक डेटा एनालिटिक्स", desc: "जलवायु परिवर्तन के रुझान को ट्रैक करने के लिए आज के मौसम की 10-वर्षीय ऐतिहासिक औसत से तुलना करें।" },
          { name: "प्रोग्रेसिव वेब ऐप (PWA)", desc: "इस वेबसाइट को सीधे अपने फोन की होम स्क्रीन पर नेटिव ऐप की तरह इंस्टॉल करें।" }
        ]
      }
    ],
    close: "गाइड बंद करें"
  },
  bn: {
    title: "সম্পূর্ণ প্ল্যাটফর্ম বৈশিষ্ট্য গাইড",
    subtitle: "WeatherGPT এর সমস্ত উন্নত বৈশিষ্ট্য",
    sections: [
      {
        title: "🤖 1. স্মার্ট এআই চ্যাটবট",
        items: [
          { name: "বহুভাষিক কথোপকথন", desc: "ইংরেজি, হিন্দি, বাংলা বা অসমীয়া ভাষায় চ্যাট করুন।" },
          { name: "ভয়েস সাপোর্ট (TTS)", desc: "কথা বলতে মাইক ক্লিক করুন এবং এআই এর উত্তর শুনতে স্পিকার আইকন টিপুন।" },
          { name: "প্রসঙ্গ-সচেতন মেমরি", desc: "এআই আপনার অবস্থান এবং পূর্ববর্তী প্রশ্ন মনে রাখে।" }
        ]
      },
      {
        title: "📊 2. উন্নত আবহাওয়া ড্যাশবোর্ড",
        items: [
          { name: "লাইভ হাইপার-লোকাল ডেটা", desc: "রিয়েল-টাইম তাপমাত্রা, আর্দ্রতা এবং বাতাসের গতি।" },
          { name: "ঘণ্টা এবং ৭ দিনের পূর্বাভাস", desc: "আগামী সপ্তাহের সুনির্দিষ্ট আবহাওয়া ব্রেকডাউন।" },
          { name: "ইন্টারেক্টিভ রাডার ম্যাপ", desc: "সরাসরি মানচিত্রে বৃষ্টিপাত এবং বায়ু প্রবাহ দেখুন।" }
        ]
      },
      {
        title: "🎯 3. বিশেষজ্ঞ হাব (Hubs)",
        items: [
          { name: "কৃষক প্রোফাইল", desc: "বৃষ্টির পূর্বাভাসের উপর ভিত্তি করে ফসল এবং কীটনাশক স্প্রে করার পরামর্শ।" },
          { name: "জেলে প্রোফাইল", desc: "সামুদ্রিক ঢেউ, জোয়ারের চার্ট এবং মাছ ধরার নিরাপদ অঞ্চল।" }
        ]
      },
      {
        title: "🧠 4. NWP মডেল ডাইভারজেন্স",
        items: [
          { name: "সুপারকম্পিউটার তুলনা", desc: "আমরা GFS, ICON এবং ECMWF মডেলের তুলনা করি।" },
          { name: "ডাইভারজেন্স সতর্কতা", desc: "মডেলগুলি একমত না হলে আমরা একটি সতর্কতা দেখাই।" }
        ]
      },
      {
        title: "🚨 5. বিপর্যয় সতর্কতা এবং অফলাইন মোড",
        items: [
          { name: "তীব্রতা সনাক্তকরণ", desc: "তাপপ্রবাহ বা বন্যার জন্য রেড/ইয়েলো অ্যালার্ট।" },
          { name: "এসএমএস সম্প্রচার", desc: "ইন্টারনেট না থাকলেও সাধারণ ফোনে সরাসরি এসএমএস সতর্কতা পাঠানো।" }
        ]
      },
      {
        title: "🌍 6. অতিরিক্ত বৈশিষ্ট্য",
        items: [
          { name: "ক্রাউডসোর্স রিপোর্টিং", desc: "ব্যবহারকারীরা স্থানীয় আবহাওয়ার রিপোর্ট করতে পারেন।" },
          { name: "ঐতিহাসিক বিশ্লেষণ", desc: "১০ বছরের ঐতিহাসিক গড়ের সাথে আজকের আবহাওয়ার তুলনা।" }
        ]
      }
    ],
    close: "গাইড বন্ধ করুন"
  },
  as: {
    title: "সম্পূৰ্ণ প্লেটফৰ্ম বৈশিষ্ট্য গাইড",
    subtitle: "WeatherGPT ৰ সকলো উন্নত বৈশিষ্ট্য",
    sections: [
      {
        title: "🤖 1. স্মাৰ্ট এআই চাটবট",
        items: [
          { name: "বহুভাষিক কথা-বতৰা", desc: "ইংৰাজী, হিন্দী, বাংলা বা অসমীয়াত চাট কৰক।" },
          { name: "ভয়েচ সমৰ্থন (TTS)", desc: "কথা পাতিবলৈ মাইক ক্লিক কৰক আৰু উত্তৰ শুনিবলৈ স্পীকাৰ আইকন টিপক।" },
          { name: "প্ৰসংগ-সচেতন মেমৰি", desc: "এআইয়ে আপোনাৰ অৱস্থান আৰু পূৰ্বৱৰ্তী প্ৰশ্ন মনত ৰাখে।" }
        ]
      },
      {
        title: "📊 2. উন্নত বতৰ ডেশ্ববোৰ্ড",
        items: [
          { name: "লাইভ হাইপাৰ-লোকেল ডেটা", desc: "ৰিয়েল-টাইম উষ্ণতা, আৰ্দ্ৰতা আৰু বতাহৰ গতি।" },
          { name: "ঘণ্টা আৰু ৭ দিনৰ পূৰ্বানুমান", desc: "অহা সপ্তাহৰ নিৰ্দিষ্ট বতৰৰ ব্ৰেকডাউন।" },
          { name: "ইণ্টাৰেক্টিভ ৰাডাৰ মেপ", desc: "সরাসৰি মানচিত্ৰত বৰষুণ আৰু বতাহৰ প্ৰবাহ চাওক।" }
        ]
      },
      {
        title: "🎯 3. বিশেষজ্ঞ হাব (Hubs)",
        items: [
          { name: "কৃষক প্ৰোফাইল", desc: "বৰষুণৰ পূৰ্বানুমানৰ ওপৰত ভিত্তি কৰি শস্য আৰু কীটনাশক স্প্ৰে কৰাৰ পৰামৰ্শ।" },
          { name: "মাছমৰীয়া প্ৰোফাইল", desc: "সামুদ্ৰিক ঢৌ, জোৱাৰৰ চাৰ্ট আৰু মাছ ধৰাৰ নিৰাপদ অঞ্চল।" }
        ]
      },
      {
        title: "🧠 4. NWP মডেল ডাইভাৰজেন্স",
        items: [
          { name: "চুপাৰকম্পিউটাৰ তুলনা", desc: "আমি GFS, ICON আৰু ECMWF মডেল তুলনা কৰোঁ।" },
          { name: "ডাইভাৰজেন্স সতৰ্কতা", desc: "মডেলসমূহ একমত নহ'লে আমি এক সতৰ্কতা দেখুৱাওঁ।" }
        ]
      },
      {
        title: "🚨 5. দুৰ্যোগ সতৰ্কতা আৰু অফলাইন মোড",
        items: [
          { name: "তীব্ৰতা চিনাক্তকৰণ", desc: "তাপপ্ৰবাহ বা বানপানীৰ বাবে ৰেড/ইয়েলো এলাৰ্ট।" },
          { name: "এছএমএছ সম্প্ৰচাৰ", desc: "ইণ্টাৰনেট নাথাকিলেও সাধাৰণ ফোনলৈ পোনে পোনে এছএমএছ সতৰ্কতা পঠোৱা।" }
        ]
      },
      {
        title: "🌍 6. অতিৰিক্ত বৈশিষ্ট্য",
        items: [
          { name: "ক্ৰাউডচ'ৰ্চ ৰিপৰ্টিং", desc: "ব্যৱহাৰকাৰীয়ে স্থানীয় বতৰৰ ৰিপৰ্ট কৰিব পাৰে।" },
          { name: "ঐতিহাসিক বিশ্লেষণ", desc: "১০ বছৰৰ ঐতিহাসিক গড়ৰ সৈতে আজিৰ বতৰৰ তুলনা।" }
        ]
      }
    ],
    close: "গাইড বন্ধ কৰক"
  }
};

export default function UserGuideModal({ isOpen, onClose }) {
  const { state } = useApp();
  const content = GUIDE_CONTENT[state.language] || GUIDE_CONTENT.en;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-6 overflow-y-auto custom-scrollbar bg-black/80 backdrop-blur-md">
      
      <div className="relative bg-surface-0 border border-white/20 rounded-[2rem] w-full max-w-5xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-scale-up my-auto overflow-hidden flex flex-col">
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-surface-0/95 backdrop-blur-xl border-b border-white/10 px-6 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-blue-500">📖</span>
              {content.title}
            </h2>
            <p className="text-white/50 text-sm mt-1 ml-10 hidden sm:block">{content.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:rotate-90 text-white/70 transition-all"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-10 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {content.sections.map((section, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-colors">
                <h3 className="text-xl font-bold text-blue-400 mb-5 pb-3 border-b border-white/10">
                  {section.title}
                </h3>
                <div className="space-y-5">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex flex-col">
                      <span className="font-semibold text-white text-base mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                        {item.name}
                      </span>
                      <span className="text-sm text-white/60 leading-relaxed pl-3.5 border-l-2 border-white/5">
                        {item.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-surface-0 via-surface-0/95 to-transparent px-6 py-6 border-t border-white/10 mt-auto">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto sm:ml-auto block px-12 py-3 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98]"
          >
            {content.close}
          </button>
        </div>

      </div>
    </div>
  );
}
