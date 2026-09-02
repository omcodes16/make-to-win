import React from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../context/AppContext';

const GUIDE_CONTENT = {
  en: {
    title: "How to Use WeatherGPT",
    subtitle: "A comprehensive guide to all features and capabilities",
    sections: [
      {
        title: "🌍 1. Basics & Language Selection",
        items: [
          { name: "Language Switcher", desc: "Select English, Hindi, Bengali, or Assamese from the top navigation bar. The entire interface, AI chat, and voice will adapt instantly." },
          { name: "Dynamic Themes", desc: "The background and UI colors automatically change based on the live weather conditions (e.g., Rain, Clear, Thunderstorm)." },
          { name: "Offline Mode", desc: "If you lose internet, WeatherGPT securely loads your last known data so you are never left without information." }
        ]
      },
      {
        title: "👨‍🌾 2. Profession Profiles",
        items: [
          { name: "Switching Profiles", desc: "Click the profile icon at the top right to switch between General, Farmer, Fisherman, Aviation, and Urban Planner." },
          { name: "Tailored Data", desc: "Depending on your profile, the AI will prioritize relevant data (e.g., wave height for Fishermen, soil moisture for Farmers, AQI for Urban Planners)." },
          { name: "Actionable Advisories", desc: "Get real-time advice based on specific triggers, like avoiding pesticide spray if rain is >10mm or delaying transport in heavy fog." }
        ]
      },
      {
        title: "🤖 3. AI Chat & Voice Features",
        items: [
          { name: "Ask Anything", desc: "Type or use the microphone to ask the AI complex weather questions. It understands context and acts as a specialized meteorologist." },
          { name: "Voice Output (TTS)", desc: "Click the play button next to any AI response to hear it read aloud in your selected language (via Google TTS)." },
          { name: "Live Data Integration", desc: "The AI automatically fetches real-time Open-Meteo data, NDMA alerts, and marine forecasts before answering." }
        ]
      },
      {
        title: "📊 4. Dashboard & Confidence Scoring",
        items: [
          { name: "Multi-Model NWP", desc: "We fetch data from 3 global models (GFS, ICON, ECMWF). The 'Models Agree' badge shows High/Medium/Low confidence based on their consensus." },
          { name: "Radar & Maps", desc: "Toggle to the Map View to see real-time radar overlays for precipitation, temperature, and wind." },
          { name: "Heat Index", desc: "When temperatures exceed 27°C, we automatically calculate the 'Feels Like' temperature using the advanced NWS Rothfusz equation." }
        ]
      },
      {
        title: "🚨 5. Disaster Alerts & SOS",
        items: [
          { name: "NDMA Sachet Alerts", desc: "We poll government NDMA XML feeds every 5 minutes. Extreme alerts trigger a red banner and push notification." },
          { name: "Emergency SOS", desc: "Tap the red SOS button to instantly send your GPS coordinates and a photo to the disaster management portal." },
          { name: "SMS Registry", desc: "Register your phone number in the Alerts tab to receive offline SMS warnings based on your district." }
        ]
      },
      {
        title: "🛡️ 6. Accountability & Analytics",
        items: [
          { name: "AI Accuracy Tracker", desc: "Every quantifiable claim the AI makes (temp, rain%) is logged and verified the next day against actual historical data. View the results in the Accuracy Hub." },
          { name: "Historical Analytics", desc: "Compare today's weather against the 5-year seasonal average to understand climate trends." },
          { name: "Community Reports", desc: "Submit ground-truth weather reports (e.g., 'Heavy Rain', 'Flooded Road') to help others in your area." }
        ]
      }
    ],
    close: "Got it, let's explore!"
  },
  hi: {
    title: "WeatherGPT का उपयोग कैसे करें",
    subtitle: "सभी सुविधाओं और क्षमताओं के लिए एक व्यापक मार्गदर्शिका",
    sections: [
      {
        title: "🌍 1. मूल बातें और भाषा चयन",
        items: [
          { name: "भाषा स्विच करें", desc: "शीर्ष नेविगेशन बार से अंग्रेजी, हिंदी, बंगाली या असमिया का चयन करें। पूरा इंटरफ़ेस, AI चैट और आवाज़ तुरंत बदल जाएगी।" },
          { name: "गतिशील थीम", desc: "लाइव मौसम की स्थिति (जैसे, बारिश, साफ, आंधी) के आधार पर पृष्ठभूमि और UI रंग स्वचालित रूप से बदलते हैं।" },
          { name: "ऑफ़लाइन मोड", desc: "यदि आपका इंटरनेट बंद हो जाता है, तो WeatherGPT सुरक्षित रूप से आपका अंतिम ज्ञात डेटा लोड करता है ताकि आपको जानकारी मिलती रहे।" }
        ]
      },
      {
        title: "👨‍🌾 2. पेशे के अनुसार प्रोफाइल",
        items: [
          { name: "प्रोफाइल बदलें", desc: "सामान्य, किसान, मछुआरा, उड्डयन और शहरी योजनाकार के बीच स्विच करने के लिए शीर्ष दाईं ओर प्रोफाइल आइकन पर क्लिक करें।" },
          { name: "अनुकूलित डेटा", desc: "आपकी प्रोफ़ाइल के आधार पर, AI प्रासंगिक डेटा को प्राथमिकता देगा (जैसे मछुआरों के लिए लहरों की ऊंचाई, किसानों के लिए मिट्टी की नमी, शहरी योजनाकारों के लिए AQI)।" },
          { name: "कार्रवाई योग्य सलाह", desc: "विशिष्ट स्थितियों के आधार पर वास्तविक समय की सलाह प्राप्त करें, जैसे बारिश >10mm होने पर कीटनाशक स्प्रे से बचना।" }
        ]
      },
      {
        title: "🤖 3. AI चैट और वॉयस सुविधाएँ",
        items: [
          { name: "कुछ भी पूछें", desc: "AI से मौसम संबंधी जटिल प्रश्न पूछने के लिए टाइप करें या माइक्रोफ़ोन का उपयोग करें। यह संदर्भ को समझता है।" },
          { name: "आवाज़ (TTS)", desc: "किसी भी AI प्रतिक्रिया को अपनी चुनी हुई भाषा में ज़ोर से सुनने के लिए उसके बगल में स्थित प्ले बटन पर क्लिक करें।" },
          { name: "लाइव डेटा इंटीग्रेशन", desc: "AI उत्तर देने से पहले स्वचालित रूप से रीयल-टाइम ओपन-मेटियो डेटा, NDMA अलर्ट और समुद्री पूर्वानुमान प्राप्त करता है।" }
        ]
      },
      {
        title: "📊 4. डैशबोर्ड और कॉन्फिडेंस स्कोर",
        items: [
          { name: "मल्टी-मॉडल NWP", desc: "हम 3 वैश्विक मॉडलों (GFS, ICON, ECMWF) से डेटा प्राप्त करते हैं। 'मॉडल्स एग्री' बैज उनकी सहमति के आधार पर उच्च/मध्यम/निम्न आत्मविश्वास दिखाता है।" },
          { name: "रडार और मैप्स", desc: "वर्षा, तापमान और हवा के लिए रीयल-टाइम रडार ओवरले देखने के लिए मैप व्यू पर टॉगल करें।" },
          { name: "हीट इंडेक्स", desc: "जब तापमान 27°C से अधिक हो जाता है, तो हम स्वचालित रूप से उन्नत NWS रोथफ्यूज़ समीकरण का उपयोग करके 'महसूस होता है' तापमान की गणना करते हैं।" }
        ]
      },
      {
        title: "🚨 5. आपदा अलर्ट और SOS",
        items: [
          { name: "NDMA अलर्ट", desc: "हम हर 5 मिनट में सरकारी NDMA XML फ़ीड पोल करते हैं। चरम अलर्ट एक लाल बैनर और पुश अधिसूचना ट्रिगर करते हैं।" },
          { name: "आपातकालीन SOS", desc: "आपदा प्रबंधन पोर्टल पर तुरंत अपने GPS निर्देशांक और एक फोटो भेजने के लिए लाल SOS बटन पर टैप करें।" },
          { name: "SMS रजिस्ट्री", desc: "अपने जिले के आधार पर ऑफ़लाइन SMS चेतावनियां प्राप्त करने के लिए अलर्ट टैब में अपना फ़ोन नंबर दर्ज करें।" }
        ]
      },
      {
        title: "🛡️ 6. जवाबदेही और एनालिटिक्स",
        items: [
          { name: "AI एक्यूरेसी ट्रैकर", desc: "AI द्वारा किए गए प्रत्येक मात्रात्मक दावे (तापमान, बारिश%) को लॉग किया जाता है और अगले दिन वास्तविक ऐतिहासिक डेटा के खिलाफ सत्यापित किया जाता है।" },
          { name: "ऐतिहासिक एनालिटिक्स", desc: "जलवायु प्रवृत्तियों को समझने के लिए 5 साल के मौसमी औसत के खिलाफ आज के मौसम की तुलना करें।" },
          { name: "सामुदायिक रिपोर्ट", desc: "अपने क्षेत्र में दूसरों की मदद करने के लिए जमीनी स्तर की मौसम रिपोर्ट (जैसे, 'भारी बारिश', 'बाढ़ वाली सड़क') जमा करें।" }
        ]
      }
    ],
    close: "समझ गया, आगे बढ़ें!"
  },
  bn: {
    title: "কিভাবে WeatherGPT ব্যবহার করবেন",
    subtitle: "সমস্ত বৈশিষ্ট্য এবং ক্ষমতার একটি বিস্তৃত নির্দেশিকা",
    sections: [
      {
        title: "🌍 ১. বেসিক এবং ভাষা নির্বাচন",
        items: [
          { name: "ভাষা পরিবর্তন", desc: "শীর্ষ নেভিগেশন বার থেকে ইংরেজি, হিন্দি, বাংলা বা অসমিয়া নির্বাচন করুন। সম্পূর্ণ ইন্টারফেস, এআই চ্যাট এবং ভয়েস তাত্ক্ষণিকভাবে পরিবর্তিত হবে।" },
          { name: "ডায়নামিক থিম", desc: "লাইভ আবহাওয়ার অবস্থার উপর ভিত্তি করে ব্যাকগ্রাউন্ড এবং ইউআই রঙ স্বয়ংক্রিয়ভাবে পরিবর্তিত হয় (যেমন, বৃষ্টি, পরিষ্কার, বজ্রঝড়)।" },
          { name: "অফলাইন মোড", desc: "যদি ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়, WeatherGPT নিরাপদে আপনার সর্বশেষ পরিচিত ডেটা লোড করে।" }
        ]
      },
      {
        title: "👨‍🌾 ২. পেশা প্রোফাইল",
        items: [
          { name: "প্রোফাইল পরিবর্তন", desc: "সাধারণ, কৃষক, জেলে, বিমান চলাচল এবং নগর পরিকল্পনাকারীর মধ্যে পরিবর্তন করতে উপরের ডানদিকে প্রোফাইল আইকনে ক্লিক করুন।" },
          { name: "উপযুক্ত ডেটা", desc: "আপনার প্রোফাইলের উপর ভিত্তি করে, এআই প্রাসঙ্গিক ডেটাকে অগ্রাধিকার দেবে (যেমন জেলেদের জন্য ঢেউয়ের উচ্চতা, কৃষকদের জন্য মাটির আর্দ্রতা)।" },
          { name: "সক্রিয় পরামর্শ", desc: "বৃষ্টিপাত >১০ মিমি হলে কীটনাশক স্প্রে এড়ানো বা ভারী কুয়াশায় পরিবহন বিলম্বিত করার মতো নির্দিষ্ট অবস্থার ভিত্তিতে রিয়েল-টাইম পরামর্শ পান।" }
        ]
      },
      {
        title: "🤖 ৩. এআই চ্যাট এবং ভয়েস বৈশিষ্ট্য",
        items: [
          { name: "যেকোনো কিছু জিজ্ঞাসা করুন", desc: "এআই-কে আবহাওয়া সম্পর্কিত জটিল প্রশ্ন জিজ্ঞাসা করতে টাইপ করুন বা মাইক্রোফোন ব্যবহার করুন।" },
          { name: "ভয়েস (TTS)", desc: "আপনার নির্বাচিত ভাষায় উত্তরটি জোরে শুনতে যেকোনো এআই প্রতিক্রিয়ার পাশের প্লে বোতামে ক্লিক করুন।" },
          { name: "লাইভ ডেটা ইন্টিগ্রেশন", desc: "এআই উত্তর দেওয়ার আগে স্বয়ংক্রিয়ভাবে রিয়েল-টাইম ওপেন-মেটিও ডেটা, NDMA সতর্কতা এবং সামুদ্রিক পূর্বাভাস নিয়ে আসে।" }
        ]
      },
      {
        title: "📊 ৪. ড্যাশবোর্ড এবং কনফিডেন্স স্কোর",
        items: [
          { name: "মাল্টি-মডেল NWP", desc: "আমরা ৩টি গ্লোবাল মডেল (GFS, ICON, ECMWF) থেকে ডেটা নিয়ে আসি। 'মডেলস এগ্রি' ব্যাজ তাদের ঐকমত্যের ভিত্তিতে উচ্চ/মাঝারি/নিম্ন আত্মবিশ্বাস দেখায়।" },
          { name: "রাডার এবং ম্যাপ", desc: "বৃষ্টিপাত, তাপমাত্রা এবং বাতাসের জন্য রিয়েল-টাইম রাডার দেখতে ম্যাপ ভিউতে টগল করুন।" },
          { name: "হিট ইনডেক্স", desc: "তাপমাত্রা ২৭°C এর বেশি হলে, আমরা উন্নত NWS Rothfusz সমীকরণ ব্যবহার করে স্বয়ংক্রিয়ভাবে 'ফিলস লাইক' তাপমাত্রা গণনা করি।" }
        ]
      },
      {
        title: "🚨 ৫. দুর্যোগ সতর্কতা এবং SOS",
        items: [
          { name: "NDMA সতর্কতা", desc: "আমরা প্রতি ৫ মিনিটে সরকারি NDMA এক্সএমএল ফিড পোল করি। চরম সতর্কতা একটি লাল ব্যানার ট্রিগার করে।" },
          { name: "জরুরী SOS", desc: "দুর্যোগ ব্যবস্থাপনা পোর্টালে আপনার জিপিএস স্থানাঙ্ক এবং একটি ছবি অবিলম্বে পাঠাতে লাল SOS বোতামে ট্যাপ করুন।" },
          { name: "SMS রেজিস্ট্রি", desc: "আপনার জেলার উপর ভিত্তি করে অফলাইন SMS সতর্কতা পেতে সতর্কতা ট্যাবে আপনার ফোন নম্বর নিবন্ধন করুন।" }
        ]
      },
      {
        title: "🛡️ ৬. জবাবদিহিতা এবং বিশ্লেষণ",
        items: [
          { name: "এআই অ্যাকুরেসি ট্র্যাকার", desc: "এআই দ্বারা করা প্রতিটি পরিমাণগত দাবি (তাপমাত্রা, বৃষ্টিপাত%) লগ করা হয় এবং পরের দিন প্রকৃত ঐতিহাসিক ডেটার বিরুদ্ধে যাচাই করা হয়।" },
          { name: "ঐতিহাসিক বিশ্লেষণ", desc: "জলবায়ুর প্রবণতা বুঝতে ৫ বছরের মৌসুমী গড়ের বিপরীতে আজকের আবহাওয়ার তুলনা করুন।" },
          { name: "কমিউনিটি রিপোর্ট", desc: "আপনার এলাকার অন্যদের সাহায্য করার জন্য গ্রাউন্ড-ট্রুথ আবহাওয়া প্রতিবেদন (যেমন, 'ভারী বৃষ্টি', 'প্লাবিত রাস্তা') জমা দিন।" }
        ]
      }
    ],
    close: "বুঝেছি, শুরু করা যাক!"
  },
  as: {
    title: "WeatherGPT কেনেকৈ ব্যৱহাৰ কৰিব",
    subtitle: "সকলো বৈশিষ্ট্য আৰু ক্ষমতাৰ এক বিস্তৃত নিৰ্দেশিকা",
    sections: [
      {
        title: "🌍 ১. বেসিক আৰু ভাষা নিৰ্বাচন",
        items: [
          { name: "ভাষা সলনি কৰক", desc: "শীৰ্ষ নেভিগেচন বাৰৰ পৰা ইংৰাজী, হিন্দী, বঙালী বা অসমীয়া নিৰ্বাচন কৰক। সমগ্ৰ ইন্টাৰফেচ, এআই চেট আৰু ভয়েচ লগে লগে সলনি হ'ব।" },
          { name: "ডাইনামিক থিম", desc: "লাইভ বতৰৰ অৱস্থাৰ ওপৰত ভিত্তি কৰি বেকগ্ৰাউণ্ড আৰু ইউআই ৰং স্বয়ংক্ৰিয়ভাৱে সলনি হয় (যেনে, বৰষুণ, পৰিষ্কাৰ, ধুমুহা)।" },
          { name: "অফলাইন মোড", desc: "যদি আপোনাৰ ইন্টাৰনেট সংযোগ বিচ্ছিন্ন হয়, WeatherGPT সুৰক্ষিতভাৱে আপোনাৰ শেহতীয়া জনা ডাটা লোড কৰে।" }
        ]
      },
      {
        title: "👨‍🌾 ২. পেচা প্ৰোফাইল",
        items: [
          { name: "প্ৰোফাইল সলনি কৰক", desc: "সাধাৰণ, কৃষক, মৎস্যজীবী, বিমান চলাচল আৰু নগৰ পৰিকল্পনাকাৰীৰ মাজত সলনি কৰিবলৈ ওপৰৰ সোঁফালে প্ৰোফাইল আইকনত ক্লিক কৰক।" },
          { name: "উপযুক্ত ডাটা", desc: "আপোনাৰ প্ৰোফাইলৰ ওপৰত ভিত্তি কৰি, এআইয়ে প্ৰাসংগিক ডাটাক অগ্ৰাধিকাৰ দিব (যেনে মৎস্যজীবীসকলৰ বাবে ঢৌৰ উচ্চতা, কৃষকসকলৰ বাবে মাটিৰ আৰ্দ্ৰতা)।" },
          { name: "সক্ৰিয় পৰামৰ্শ", desc: "বৰষুণ >১০ মিমি হ'লে কীটনাশক স্প্ৰে এৰাই চলা বা ডাঠ কুঁৱলীত পৰিবহন পলম কৰা আদি নিৰ্দিষ্ট অৱস্থাৰ ভিত্তিত ৰিয়েল-টাইম পৰামৰ্শ পাওক।" }
        ]
      },
      {
        title: "🤖 ৩. এআই চেট আৰু ভয়েচ বৈশিষ্ট্য",
        items: [
          { name: "যিকোনো কথা সোধক", desc: "এআই-ক বতৰ সম্পৰ্কীয় জটিল প্ৰশ্ন সুধিবলৈ টাইপ কৰক বা মাইক্ৰ'ফোন ব্যৱহাৰ কৰক।" },
          { name: "ভয়েচ (TTS)", desc: "আপোনাৰ নিৰ্বাচিত ভাষাত উত্তৰটো ডাঙৰকৈ শুনিবলৈ যিকোনো এআই সঁহাৰিৰ কাষৰ প্লে বুটামত ক্লিক কৰক।" },
          { name: "লাইভ ডাটা একত্ৰীকৰণ", desc: "এআইয়ে উত্তৰ দিয়াৰ আগতে স্বয়ংক্ৰিয়ভাৱে ৰিয়েল-টাইম অ'পেন-মেটিঅ' ডাটা, NDMA সতৰ্কবাণী আৰু সামুদ্ৰিক আগজাননী লৈ আহে।" }
        ]
      },
      {
        title: "📊 ৪. ডেশ্ববৰ্ড আৰু কনফিডেন্স স্ক'ৰ",
        items: [
          { name: "মাল্টি-মডেল NWP", desc: "আমি ৩টা গ্লোবেল মডেল (GFS, ICON, ECMWF) ৰ পৰা ডাটা লৈ আহো। 'মডেলছ এগ্ৰী' বেজে তেওঁলোকৰ ঐকমত্যৰ ভিত্তিত উচ্চ/মজলীয়া/নিম্ন আত্মবিশ্বাস দেখুৱায়।" },
          { name: "ৰাডাৰ আৰু মেপ", desc: "বৰষুণ, তাপমাত্ৰা আৰু বতাহৰ বাবে ৰিয়েল-টাইম ৰাডাৰ চাবলৈ মেপ ভিউলৈ টগল কৰক।" },
          { name: "হিট ইনডেক্স", desc: "তাপমাত্ৰা ২৭°C ৰ বেছি হ'লে, আমি উন্নত NWS Rothfusz সমীকৰণ ব্যৱহাৰ কৰি স্বয়ংক্ৰিয়ভাৱে 'ফিলছ লাইক' তাপমাত্ৰা গণনা কৰো।" }
        ]
      },
      {
        title: "🚨 ৫. দুৰ্যোগ সতৰ্কবাণী আৰু SOS",
        items: [
          { name: "NDMA সতৰ্কবাণী", desc: "আমি প্ৰতি ৫ মিনিটত চৰকাৰী NDMA এক্সএমএল ফিড প'ল কৰো। চৰম সতৰ্কবাণীয়ে এটা ৰঙা বেনাৰ ট্ৰিগাৰ কৰে।" },
          { name: "জৰুৰীকালীন SOS", desc: "দুৰ্যোগ ব্যৱস্থাপনা পৰ্টেললৈ আপোনাৰ জিপিএছ স্থানাংক আৰু এখন ফটো লগে লগে পঠিয়াবলৈ ৰঙা SOS বুটামত টেপ কৰক।" },
          { name: "SMS ৰেজিষ্ট্ৰী", desc: "আপোনাৰ জিলাৰ ওপৰত ভিত্তি কৰি অফলাইন SMS সতৰ্কবাণী পাবলৈ এলাৰ্ট টেবত আপোনাৰ ফোন নম্বৰ পঞ্জীয়ন কৰক।" }
        ]
      },
      {
        title: "🛡️ ৬. জবাবদিহিতা আৰু বিশ্লেষণ",
        items: [
          { name: "এআই একিউৰেচি ট্ৰেকাৰ", desc: "এআইয়ে কৰা প্ৰতিটো পৰিমাণগত দাবী (তাপমাত্ৰা, বৰষুণ%) লগ কৰা হয় আৰু পিছদিনা প্ৰকৃত ঐতিহাসিক ডাটাৰ বিৰুদ্ধে পৰীক্ষা কৰা হয়।" },
          { name: "ঐতিহাসিক বিশ্লেষণ", desc: "জলবায়ুৰ প্ৰৱণতা বুজিবলৈ ৫ বছৰৰ বতৰৰ গড়ৰ বিপৰীতে আজিৰ বতৰৰ তুলনা কৰক।" },
          { name: "কমিউনিটি ৰিপ'ৰ্ট", desc: "আপোনাৰ অঞ্চলৰ আন লোকসকলক সহায় কৰিবলৈ গ্ৰাউণ্ড-ট্ৰুথ বতৰৰ ৰিপ'ৰ্ট (যেনে, 'ধাৰাষাৰ বৰষুণ', 'বানপানী হোৱা ৰাস্তা') জমা দিয়ক।" }
        ]
      }
    ],
    close: "বুজিছো, আগবাঢ়ক!"
  }
};

export default function UserGuideModal({ isOpen, onClose }) {
  const { state } = useApp();
  const content = GUIDE_CONTENT[state.language] || GUIDE_CONTENT.en;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-2 sm:p-6 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      
      <div 
        className="relative theme-modal border border-[var(--modal-border)] rounded-[2rem] w-full max-w-5xl shadow-2xl animate-scale-up my-auto overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-[var(--header-bg)] border-b border-[var(--modal-border)] px-6 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
              <span className="text-blue-500">📖</span>
              {content.title}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mt-1 ml-10 hidden sm:block font-medium">{content.subtitle}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] border border-[var(--theme-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Close"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-10 overflow-y-auto flex-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {content.sections.map((section, idx) => (
              <div key={idx} className="glass-panel border border-[var(--theme-border)] rounded-3xl p-6 shadow-sm">
                <h3 className="text-xl font-extrabold text-blue-700 dark:text-blue-400 mb-5 pb-3 border-b border-[var(--theme-border)]">
                  {section.title}
                </h3>
                <div className="space-y-5">
                  {section.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex flex-col">
                      <span className="font-extrabold text-[var(--text-primary)] text-base mb-1.5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                        {item.name}
                      </span>
                      <span className="text-sm text-[var(--text-secondary)] leading-relaxed pl-3.5 border-l-2 border-[var(--theme-border)] font-medium">
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
        <div className="sticky bottom-0 bg-[var(--header-bg)] px-6 py-4 border-t border-[var(--modal-border)] mt-auto flex items-center justify-end">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-10 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
          >
            {content.close}
          </button>
        </div>

      </div>
    </div>
  , document.body); 
}
