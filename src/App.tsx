/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudRain, 
  Thermometer, 
  Sprout, 
  MapPin, 
  Mic, 
  MessageSquare, 
  Languages, 
  ChevronRight,
  Info,
  Droplets,
  Wind,
  Sun,
  Menu,
  X,
  Send,
  User,
  Check,
  Trophy,
  ArrowLeftRight,
  ChevronLeft,
  Quote,
  TrendingUp,
  Calendar,
  Camera,
  Upload,
  AlertCircle,
  Activity,
  Users,
  ShieldCheck,
  Megaphone,
  Heart,
  Phone,
  Mail,
  ArrowRight,
  Map,
  Layers,
  Mountain,
  Navigation
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getGeminiResponse, speakText, getDynamicCropRecommendations, getCropComparison, analyzeCropImage, moderateChaupalPost } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const ProgressBar = ({ current, total }: { current: number, total: number }) => (
  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${(current / total) * 100}%` }}
      className="h-full bg-forest-green"
    />
  </div>
);

const Login = ({ onLogin }: { onLogin: (id: string) => void }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    const isPhone = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/.test(input);

    if (isEmail || isPhone) {
      onLogin(input);
    } else {
      setError('Please enter a valid Email or Indian Phone Number');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Nature Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-leaf-green/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-forest-green/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10 space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-forest-green rounded-3xl flex items-center justify-center text-white mx-auto shadow-xl mb-6">
            <Sprout size={40} />
          </div>
          <h1 className="text-4xl font-bold text-forest-green tracking-tight">Agro Mitra</h1>
          <p className="text-earthy-brown font-medium">Kisanon ka saccha saathi</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-forest-green/60 ml-1">Email or Phone Number</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-forest-green/40">
                {input.includes('@') ? <Mail size={20} /> : <Phone size={20} />}
              </div>
              <input 
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder="e.g. +91 98765 43210"
                className={cn(
                  "w-full bg-white/50 border-2 rounded-2xl py-4 pl-12 pr-4 text-forest-green font-medium transition-all focus:ring-4 focus:ring-leaf-green/10 outline-none",
                  error ? "border-red-300" : "border-forest-green/10 focus:border-leaf-green"
                )}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold ml-1">{error}</p>}
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full py-5 text-lg"
            icon={ArrowRight}
          >
            Aage Badhein
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 font-medium">
          By continuing, you agree to our <span className="text-forest-green underline">Terms of Service</span>
        </p>
      </motion.div>
    </div>
  );
};

const Onboarding = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    region: 'Jalgaon',
    soilType: 'Loamy',
    sowingMonth: new Date().toLocaleString('en-US', { month: 'long' })
  });
  const [isDetecting, setIsDetecting] = useState(false);

  const districts = ['Jalgaon', 'Nagpur', 'Nashik', 'Pune', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur'];
  const soilTypes = [
    { id: 'Black', name: 'Black Soil', color: 'bg-[#3E2723]', text: 'text-white', icon: Mountain },
    { id: 'Loamy', name: 'Loamy Soil', color: 'bg-[#8D6E63]', text: 'text-white', icon: Layers },
    { id: 'Sandy', name: 'Sandy Soil', color: 'bg-[#D7CCC8]', text: 'text-earthy-brown', icon: Map },
    { id: 'Red', name: 'Red Soil', color: 'bg-[#D32F2F]', text: 'text-white', icon: Mountain }
  ];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const detectLocation = () => {
    setIsDetecting(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        // In a real app, we'd use reverse geocoding here.
        // For this demo, we'll simulate finding a nearby district.
        setTimeout(() => {
          setFormData({ ...formData, region: 'Nashik' });
          setIsDetecting(false);
        }, 1500);
      }, () => {
        setIsDetecting(false);
        alert("Could not detect location. Please select manually.");
      });
    } else {
      setIsDetecting(false);
      alert("Geolocation is not supported.");
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else onComplete(formData);
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] flex items-center justify-center p-6">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-lg w-full glass-card p-10 space-y-8"
      >
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-forest-green">
              {step === 1 ? "Aapka Naam Kya Hai?" : step === 2 ? "Aapka Khet Kahan Hai?" : "Mitti aur Mausam"}
            </h2>
            <span className="text-xs font-bold text-forest-green/40 uppercase tracking-widest">Step {step} of 3</span>
          </div>
          <ProgressBar current={step} total={3} />
        </div>

        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-forest-green/60 ml-1">Full Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full bg-white/50 border-2 border-forest-green/10 rounded-2xl py-4 px-6 text-forest-green font-medium outline-none focus:border-leaf-green transition-all"
                />
              </div>
              <p className="text-sm text-earthy-brown italic">Namaste! Hum aapko isi naam se bulayenge.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-forest-green/60 ml-1">Select District</label>
                <div className="grid grid-cols-2 gap-3">
                  {districts.map(d => (
                    <button 
                      key={d}
                      onClick={() => setFormData({ ...formData, region: d })}
                      className={cn(
                        "py-3 px-4 rounded-xl font-bold transition-all border-2",
                        formData.region === d ? "bg-forest-green text-white border-forest-green shadow-lg" : "bg-white/50 text-forest-green border-transparent hover:border-leaf-green/30"
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                onClick={detectLocation}
                disabled={isDetecting}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-leaf-green/10 text-leaf-green font-bold border border-leaf-green/20 hover:bg-leaf-green/20 transition-all"
              >
                <Navigation size={18} className={isDetecting ? "animate-spin" : ""} />
                {isDetecting ? "Detecting..." : "Detect My Location"}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-forest-green/60 ml-1">Soil Type</label>
                <div className="grid grid-cols-2 gap-4">
                  {soilTypes.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => setFormData({ ...formData, soilType: s.id })}
                      className={cn(
                        "p-4 rounded-2xl flex flex-col items-center gap-3 transition-all border-4",
                        formData.soilType === s.id ? "border-leaf-green scale-105 shadow-xl" : "border-transparent opacity-70 hover:opacity-100",
                        s.color,
                        s.text
                      )}
                    >
                      <s.icon size={32} />
                      <span className="font-bold text-sm">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-forest-green/60 ml-1">Sowing Month</label>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {months.map(m => (
                    <button 
                      key={m}
                      onClick={() => setFormData({ ...formData, sowingMonth: m })}
                      className={cn(
                        "shrink-0 px-6 py-3 rounded-xl font-bold transition-all border-2",
                        formData.sowingMonth === m ? "bg-forest-green text-white border-forest-green shadow-md" : "bg-white/50 text-forest-green border-transparent"
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 rounded-2xl font-bold text-forest-green border-2 border-forest-green/10 hover:bg-white/50 transition-all"
            >
              Piche
            </button>
          )}
          <Button 
            onClick={nextStep}
            disabled={step === 1 && !formData.name.trim()}
            className="flex-[2] py-4"
          >
            {step === 3 ? "Agro Mitra Shuru Karein" : "Aage Badhein"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

const Card = ({ children, className, onClick, id, ...props }: { children: React.ReactNode, className?: string, onClick?: () => void, id?: string, [key: string]: any }) => (
  <div 
    id={id}
    onClick={onClick}
    {...props}
    className={cn(
      "glass-card rounded-3xl p-6 transition-all", 
      onClick && "cursor-pointer hover:shadow-lg hover:border-leaf-green/30 hover:-translate-y-1",
      className
    )}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className, icon: Icon, type = "button", disabled }: any) => {
  const variants = {
    primary: "bg-forest-green text-white hover:bg-leaf-green shadow-lg shadow-forest-green/20",
    secondary: "bg-white text-forest-green border border-leaf-green/20 hover:bg-soft-cream",
    ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    outline: "bg-transparent border-2 border-forest-green text-forest-green hover:bg-forest-green/5"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50",
        variants[variant as keyof typeof variants],
        className
      )}
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
};

const CustomTick = ({ x, y, payload }: any) => {
  const isRainy = ['July', 'August', 'September'].includes(payload.value);
  const isSunny = ['April', 'May', 'June'].includes(payload.value);
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="middle" fill="#6C584C" fontSize={10} fontWeight="bold">
        {payload.value.substring(0, 3)}
      </text>
      {isRainy && <path d="M-4,22 L-4,24 M0,22 L0,26 M4,22 L4,24" stroke="#0077B6" strokeWidth={1} />}
      {isSunny && <circle cx={0} cy={24} r={3} fill="#F59E0B" />}
    </g>
  );
};

function MarketTicker() {
  return (
    <div className="bg-forest-green text-white py-2 px-4 rounded-2xl overflow-hidden relative shadow-lg">
      <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
        <span className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
          <TrendingUp size={14} className="text-leaf-green" />
          Market Live
        </span>
        <span className="text-sm font-medium">Wheat: ₹2,125 <span className="text-leaf-green">▲</span></span>
        <span className="text-sm font-medium">Rice: ₹3,850 <span className="text-red-400">▼</span></span>
        <span className="text-sm font-medium">Cotton: ₹7,400 <span className="text-leaf-green">▲</span></span>
        <span className="text-sm font-medium">Soybean: ₹4,600 <span className="text-leaf-green">▲</span></span>
        {/* Duplicate for seamless loop */}
        <span className="text-sm font-medium ml-8">Wheat: ₹2,125 <span className="text-leaf-green">▲</span></span>
        <span className="text-sm font-medium">Rice: ₹3,850 <span className="text-red-400">▼</span></span>
        <span className="text-sm font-medium">Cotton: ₹7,400 <span className="text-leaf-green">▲</span></span>
        <span className="text-sm font-medium">Soybean: ₹4,600 <span className="text-leaf-green">▲</span></span>
      </div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const { t, i18n } = useTranslation();
  
  // Auth & Onboarding State
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('agro_isLoggedIn') === 'true');
  const [isOnboarded, setIsOnboarded] = useState(() => localStorage.getItem('agro_isOnboarded') === 'true');
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('agro_user');
    return saved ? JSON.parse(saved) : { name: 'Farmer' };
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [soilType, setSoilType] = useState(() => localStorage.getItem('agro_soilType') || 'Loamy');
  const [region, setRegion] = useState(() => localStorage.getItem('agro_region') || 'Jalgaon');
  const [currentMonth, setCurrentMonth] = useState(() => localStorage.getItem('agro_currentMonth') || new Date().toLocaleString('en-US', { month: 'long' }));
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dynamicCrops, setDynamicCrops] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [climateInsight, setClimateInsight] = useState("Based on current trends, the monsoon is expected to be 10% above average. Consider planting water-intensive crops like Rice in low-lying areas for maximum yield.");
  const [sowingSchedule, setSowingSchedule] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [chaupalPosts, setChaupalPosts] = useState<any[]>([
    { 
      id: 1, 
      user: "Ramesh Kumar", 
      content: "Harvested 20 quintals of wheat from 1 acre using the new organic fertilizer! Truly a success story.", 
      category: "Success Story", 
      isVerified: true, 
      time: "2 hours ago",
      tags: ["Organic", "High Yield"]
    },
    { 
      id: 2, 
      user: "Suresh Patil", 
      content: "Seeing some unusual pests on my cotton leaves. Looks like a possible locust swarm starting in the north fields.", 
      category: "Alert", 
      isVerified: true, 
      time: "5 hours ago",
      tags: ["Pest Alert", "AI Verified"]
    }
  ]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 500);
    }
  }, [activeTab]);
  const handleQuickAction = (action: any) => {
    setActiveQuickAction(action.label);
    if (action.label === "Check Soil") {
      handleDynamicAnalysis();
    } else if (action.label === "Crop Doctor") {
      setActiveTab('doctor');
      setActiveQuickAction(null);
    } else if (action.label === "AI Advisor") {
      // For AI Advisor, we still want to go to chat but maybe with a pre-filled state
      setActiveTab('chat');
      handleSendMessage("Namaste! I need some expert advice for my farm.");
      setActiveQuickAction(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchWeatherData();
    fetchRecommendations();
    updateClimateInsight();
    updateSowingSchedule();
    // Automatically refresh analysis for "Check Soil" if it was already run
    if (dynamicCrops.length > 0) {
      handleDynamicAnalysis();
    }
  }, [region, soilType, currentMonth]);

  const updateClimateInsight = () => {
    const insights: Record<string, string> = {
      'Jalgaon': `In ${region}, the ${soilType} soil is perfect for Banana and Cotton. With ${currentMonth}'s rising temperatures, ensure drip irrigation is active.`,
      'Pune': `Pune's current climate in ${currentMonth} favors Pomegranate. Your ${soilType} soil will need balanced nitrogen levels this season.`,
      'Nashik': `Nashik's ${currentMonth} weather is ideal for Grapes and Onion. The ${soilType} soil drainage is key for high-quality yield this season.`,
      'Nagpur': `Nagpur is heating up in ${currentMonth}. Oranges in ${soilType} soil will require frequent watering during the afternoon peaks.`
    };
    
    setClimateInsight(insights[region] || `For ${region} in ${currentMonth}, the ${soilType} soil suggests focusing on moisture conservation. AI predicts a stable growing season ahead.`);
  };

  const updateSowingSchedule = () => {
    // Specific schedule for Nashik in March with Loamy Soil
    if (region === 'Nashik' && currentMonth === 'March' && soilType === 'Loamy') {
      setSowingSchedule([
        { task: 'Pruning & Cleaning (Grapes/Onion)', date: 'Week 1', status: 'Completed', icon: Sprout },
        { task: 'Nutrient Management (Fertilizers)', date: 'Week 2', status: 'In Progress', icon: Droplets },
        { task: 'Pest Survey & Monitoring', date: 'Week 3', status: 'Upcoming', icon: Info },
        { task: 'Market Preparation & Logistics', date: 'Week 4', status: 'Upcoming', icon: TrendingUp },
      ]);
      return;
    }

    const schedules: Record<string, any[]> = {
      'Jalgaon': [
        { task: 'Soil Preparation', date: 'Week 1', status: 'Completed', icon: Sprout },
        { task: 'Sowing Banana', date: 'Week 2', status: 'In Progress', icon: Calendar },
        { task: 'Fertilizer Application', date: 'Week 4', status: 'Upcoming', icon: Droplets },
      ],
      'Pune': [
        { task: 'Pruning Pomegranate', date: 'Week 1', status: 'Completed', icon: Sprout },
        { task: 'Irrigation Setup', date: 'Week 2', status: 'Upcoming', icon: Wind },
        { task: 'Pest Control', date: 'Week 3', status: 'Upcoming', icon: Info },
      ],
      'Nashik': [
        { task: 'Vineyard Maintenance', date: 'Week 1', status: 'Completed', icon: Sprout },
        { task: 'Grape Sowing', date: 'Week 2', status: 'In Progress', icon: Calendar },
        { task: 'Water Management', date: 'Week 3', status: 'Upcoming', icon: Droplets },
      ],
      'Nagpur': [
        { task: 'Orchard Cleaning', date: 'Week 1', status: 'Completed', icon: Sprout },
        { task: 'Orange Sowing', date: 'Week 2', status: 'In Progress', icon: Calendar },
        { task: 'Heat Protection', date: 'Week 4', status: 'Upcoming', icon: Sun },
      ]
    };
    
    setSowingSchedule(schedules[region] || [
      { task: 'General Soil Check', date: 'Week 1', status: 'Upcoming', icon: Info },
      { task: 'Seed Selection', date: 'Week 2', status: 'Upcoming', icon: Check },
      { task: 'Sowing Preparation', date: 'Week 3', status: 'Upcoming', icon: Calendar },
    ]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [chatMessages, isThinking]);

  const fetchWeatherData = async () => {
    try {
      const res = await fetch(`/api/climate/${region}`);
      const data = await res.json();
      setWeatherData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soilType, region })
      });
      const data = await res.json();
      setRecommendations(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDynamicAnalysis = async () => {
    setIsAnalyzing(true);
    const crops = await getDynamicCropRecommendations(region, soilType, currentMonth);
    if (crops) {
      setDynamicCrops(crops);
    }
    setIsAnalyzing(false);
  };

  const toggleCompare = (cropName: string) => {
    if (comparisonData) setComparisonData(null); // Clear previous comparison if selecting new
    setSelectedForCompare(prev => {
      if (prev.includes(cropName)) {
        return prev.filter(n => n !== cropName);
      }
      if (prev.length >= 2) {
        return [prev[1], cropName];
      }
      return [...prev, cropName];
    });
  };

  const handleCompareCrops = async () => {
    if (selectedForCompare.length !== 2) return;
    
    setIsComparing(true);
    const crop1 = dynamicCrops.find(c => c.name === selectedForCompare[0]);
    const crop2 = dynamicCrops.find(c => c.name === selectedForCompare[1]);
    
    const data = await getCropComparison(crop1, crop2, region, soilType);
    if (data) {
      setComparisonData(data);
    }
    setIsComparing(false);
  };

  const handleSendMessage = async (text?: string) => {
    const message = text || userInput;
    if (!message.trim()) return;

    setChatMessages(prev => [...prev, { role: 'user', text: message }]);
    setUserInput('');
    setIsThinking(true);
    setActiveTab('chat');

    const response = await getGeminiResponse(message, { region, soilType, recommendations, language: i18n.language });
    setIsThinking(false);
    setChatMessages(prev => [...prev, { role: 'ai', text: response || '' }]);
    
    if (response) {
      speakText(response);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    
    // AI Moderation
    const moderation = await moderateChaupalPost(newPostContent, region);
    
    if (moderation && moderation.isValid) {
      const newPost = {
        id: Date.now(),
        user: user.name,
        content: newPostContent,
        category: moderation.category,
        isVerified: moderation.isVerified,
        time: "Just now",
        tags: moderation.suggestedTags,
        moderationNote: moderation.moderationNote
      };
      setChaupalPosts(prev => [newPost, ...prev]);
      setNewPostContent('');
    } else {
      alert("Post could not be published. Please ensure it follows community guidelines and avoids unscientific claims.");
    }
    
    setIsPosting(false);
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice recognition not supported in this browser.");
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = i18n.language === 'hi' || i18n.language === 'hi_en' ? 'hi-IN' : i18n.language === 'mr' ? 'mr-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(transcript);
    };
    recognition.start();
  };

  const toggleLanguage = () => {
    const langs = ['en', 'hi', 'mr', 'hi_en'];
    const next = langs[(langs.indexOf(i18n.language) + 1) % langs.length];
    i18n.changeLanguage(next);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanImage = async () => {
    if (!selectedImage) return;
    
    setIsAnalyzingImage(true);
    const result = await analyzeCropImage(selectedImage, { region, soilType });
    setIsAnalyzingImage(false);
    
    if (result) {
      setAnalysisResult(result);
      speakText(`Diagnosis complete. It looks like ${result.diagnosis}. Confidence score is ${result.confidenceScore}.`);
    }
  };

  const handleLogin = (id: string) => {
    setIsLoggedIn(true);
    localStorage.setItem('agro_isLoggedIn', 'true');
    localStorage.setItem('agro_userId', id);
  };

  const handleOnboardingComplete = (data: any) => {
    setUser({ name: data.name });
    setRegion(data.region);
    setSoilType(data.soilType);
    setCurrentMonth(data.sowingMonth);
    setIsOnboarded(true);

    localStorage.setItem('agro_isOnboarded', 'true');
    localStorage.setItem('agro_user', JSON.stringify({ name: data.name }));
    localStorage.setItem('agro_region', data.region);
    localStorage.setItem('agro_soilType', data.soilType);
    localStorage.setItem('agro_currentMonth', data.sowingMonth);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsOnboarded(false);
    localStorage.clear();
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  if (!isOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#F5F2ED] font-sans text-earthy-brown selection:bg-leaf-green selection:text-white">
      {/* Quick Action Modal */}
      <AnimatePresence>
        {activeQuickAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-forest-green">{activeQuickAction}</h3>
                  <button 
                    onClick={() => setActiveQuickAction(null)}
                    className="w-10 h-10 bg-soft-cream rounded-full flex items-center justify-center text-forest-green hover:bg-gray-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  {activeQuickAction === "Check Soil" && (
                    <div className="space-y-4">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                          <div className="w-16 h-16 border-4 border-leaf-green border-t-transparent rounded-full animate-spin" />
                          <p className="text-earthy-brown font-bold animate-pulse">Analyzing your soil and climate...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {dynamicCrops.slice(0, 4).map((crop, i) => (
                            <div key={i} className="p-4 bg-soft-cream rounded-2xl border border-forest-green/5 flex items-center gap-4">
                              <div className="w-12 h-12 bg-leaf-green rounded-xl flex items-center justify-center text-white font-bold">
                                {crop.name[0]}
                              </div>
                              <div>
                                <p className="font-bold text-forest-green">{crop.name}</p>
                                <p className="text-[10px] font-bold text-leaf-green uppercase">{crop.variety}</p>
                              </div>
                            </div>
                          ))}
                          <button 
                            onClick={() => { setActiveTab('advisor'); setActiveQuickAction(null); }}
                            className="sm:col-span-2 py-4 bg-forest-green text-white rounded-2xl font-bold hover:bg-leaf-green transition-colors shadow-lg"
                          >
                            View Detailed Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeQuickAction === "Market Rates" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {[
                          { name: "Wheat (Kanak)", basePrice: 2100, trend: "up" },
                          { name: "Rice (Basmati)", basePrice: 3800, trend: "down" },
                          { name: "Cotton", basePrice: 7300, trend: "up" },
                          { name: "Soybean", basePrice: 4500, trend: "up" }
                        ].map((item, i) => {
                          // Simulate live price variation based on region/month
                          const variation = (region.length * 5) + (currentMonth.length * 2);
                          const finalPrice = item.basePrice + (item.trend === 'up' ? variation : -variation);
                          return (
                            <div key={i} className="flex items-center justify-between p-4 bg-soft-cream rounded-2xl border border-forest-green/5">
                              <span className="font-bold text-forest-green">{item.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-forest-green">₹{finalPrice.toLocaleString()}/q</span>
                                <span className={cn("text-xs font-bold", item.trend === 'up' ? "text-leaf-green" : "text-red-500")}>
                                  {item.trend === 'up' ? "▲" : "▼"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-center text-[10px] font-bold text-earthy-brown uppercase tracking-widest">Live Rates for {region} • {currentMonth}</p>
                    </div>
                  )}

                  {activeQuickAction === "Weather Alert" && (
                    <div className="space-y-6">
                      <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 flex items-start gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                          <CloudRain size={24} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-orange-800 mb-1">Live Alert: {region}</h4>
                          <p className="text-sm text-orange-700 leading-relaxed">
                            {currentMonth === 'June' || currentMonth === 'July' || currentMonth === 'August' 
                              ? `Heavy monsoon activity expected in ${region}. Ensure drainage for your ${soilType} fields.`
                              : `Dry spell alert for ${region} in ${currentMonth}. Increase irrigation frequency for ${soilType} soil.`}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {['Mon', 'Tue', 'Wed'].map((day, i) => (
                          <div key={i} className="p-4 bg-soft-cream rounded-2xl text-center space-y-2">
                            <p className="text-xs font-bold text-earthy-brown">{day}</p>
                            <CloudRain size={20} className="mx-auto text-sky-blue" />
                            <p className="text-sm font-bold text-forest-green">{22 + i}°C</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/60 backdrop-blur-xl border-b border-white/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-forest-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-forest-green/20">
            <Sprout size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-forest-green">Agro Mitra</h1>
            <p className="text-[10px] text-earthy-brown uppercase tracking-wider font-semibold">Empowering Farmers through Climate-Smart Decisions</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <Languages size={18} />
            <span className="uppercase">{i18n.language === 'hi_en' ? 'Hinglish' : i18n.language}</span>
          </button>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Sidebar / Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 z-40 bg-white pt-20 px-6 md:hidden"
          >
            <nav className="flex flex-col gap-4">
              {['dashboard', 'advisor', 'calendar', 'chat', 'chaupal'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setIsMenuOpen(false); }}
                  className={cn(
                    "text-2xl font-bold text-left py-4 border-b border-gray-100",
                    activeTab === tab ? "text-forest-green" : "text-gray-400"
                  )}
                >
                  {tab === 'calendar' ? 'Sowing Calendar' : tab === 'chaupal' ? 'Kisan Chaupal' : t(tab)}
                </button>
              ))}
              <button 
                onClick={handleLogout}
                className="text-2xl font-bold text-left py-4 text-red-500"
              >
                Logout
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={cn(
        "max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 gap-6",
        activeTab === 'chat' ? "md:grid-cols-1" : "md:grid-cols-12"
      )}>
        {/* Desktop Navigation */}
        {activeTab !== 'chat' && (
          <aside className="hidden md:block md:col-span-3 space-y-2">
            <nav className="sticky top-24 space-y-2">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={CloudRain} label={t('dashboard')} />
              <NavButton active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')} icon={Sprout} label={t('crop_advisor')} />
              <NavButton active={activeTab === 'doctor'} onClick={() => setActiveTab('doctor')} icon={Camera} label="Crop Doctor" />
              <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={Calendar} label="Sowing Calendar" />
              <NavButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageSquare} label={t('ask_ai')} />
              <NavButton active={activeTab === 'chaupal'} onClick={() => setActiveTab('chaupal')} icon={Users} label="Kisan Chaupal" />
              
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-white/60 backdrop-blur-md p-5 rounded-[2rem] border border-forest-green/10 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-forest-green rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg transform rotate-3">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold truncate text-forest-green">{user.name}</p>
                      <p className="text-[10px] font-bold text-leaf-green uppercase tracking-widest">Premium Member</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-forest-green text-[10px] uppercase tracking-widest mb-2 opacity-60">{t('soil_info')}</h3>
                      <select 
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value)}
                        className="w-full bg-soft-cream/50 border border-forest-green/5 rounded-xl p-2.5 text-xs font-bold text-forest-green focus:ring-2 focus:ring-leaf-green transition-all"
                      >
                        <option value="Loamy">Loamy (दोमट)</option>
                        <option value="Clayey">Clayey (चिकनी)</option>
                        <option value="Black">Black (काली)</option>
                        <option value="Alluvial">Alluvial (जलोढ़)</option>
                      </select>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-forest-green text-[10px] uppercase tracking-widest mb-2 opacity-60">{t('region')}</h3>
                      <div className="flex items-center gap-2 bg-soft-cream/50 rounded-xl p-2.5 border border-forest-green/5 focus-within:ring-2 focus-within:ring-leaf-green transition-all">
                        <MapPin size={14} className="text-leaf-green" />
                        <input 
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          className="bg-transparent border-none text-xs font-bold text-forest-green focus:ring-0 w-full"
                        />
                      </div>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className="w-full py-3 rounded-xl bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100"
                    >
                      Logout Session
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </aside>
        )}

        {/* Content Area */}
        <div className={cn(activeTab === 'chat' ? "md:col-span-1" : "md:col-span-9 space-y-6")}>
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <MarketTicker />
              {/* Welcome Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-forest-green">{getGreeting()}, {user.name}!</h1>
                  <p className="text-earthy-brown font-medium">It's a beautiful day for farming in {region}.</p>
                </div>
                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-sm">
                  <div className="w-10 h-10 bg-leaf-green/10 rounded-full flex items-center justify-center text-leaf-green">
                    <Sun size={20} className="animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-earthy-brown">Current Time</p>
                    <p className="text-sm font-bold text-forest-green">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Main Stats */}
                <div className="md:col-span-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={Thermometer} label={t('temperature')} value="28°C" color="orange" />
                    <StatCard icon={CloudRain} label={t('rainfall')} value="120mm" color="blue" />
                    <StatCard icon={Droplets} label="Humidity" value="65%" color="teal" />
                  </div>

                  <Card id="weather-section" className="overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold flex items-center gap-2 text-forest-green">
                        <Wind className="text-leaf-green" />
                        {t('weather')}
                      </h2>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%" key={weatherData.length}>
                        <AreaChart data={weatherData}>
                          <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0077B6" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#0077B6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={<CustomTick />}
                            height={50}
                          />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6C584C' }} />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '24px', 
                              border: 'none', 
                              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="temp" 
                            stroke="#F59E0B" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorTemp)" 
                            name={t('temperature')} 
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="rainfall" 
                            stroke="#0077B6" 
                            strokeWidth={4} 
                            fillOpacity={1} 
                            fill="url(#colorRain)" 
                            name={t('rainfall')} 
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Recent Activity */}
                  <div className="pt-4">
                    <h3 className="text-lg font-bold text-forest-green mb-4 flex items-center gap-2">
                      <Check size={18} className="text-leaf-green" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {[
                        { action: "Soil analysis completed", time: "2 hours ago", status: "success" },
                        { action: "Pest alert in neighboring farm", time: "5 hours ago", status: "warning" },
                        { action: "New crop recommendation generated", time: "Yesterday", status: "info" }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm hover:bg-white/60 transition-colors cursor-default">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.status === 'success' ? "bg-leaf-green" : item.status === 'warning' ? "bg-orange-500" : "bg-sky-blue"
                            )} />
                            <span className="text-sm font-medium text-forest-green">{item.action}</span>
                          </div>
                          <span className="text-[10px] font-bold text-earthy-brown uppercase tracking-wider">{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Side Bento Cards */}
                <div className="md:col-span-4 space-y-6">
                  {/* Daily Wisdom */}
                  <Card className="bg-gradient-to-br from-forest-green to-leaf-green text-white border-none p-6 relative overflow-hidden h-full flex flex-col justify-between">
                    <div className="relative z-10">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-4">
                        <Quote size={20} className="text-white" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Farmer's Wisdom</h3>
                      <p className="text-soft-cream/90 italic font-medium leading-relaxed">
                        "The best fertilizer for any farm is the farmer's own footprint."
                      </p>
                    </div>
                    <div className="relative z-10 mt-6 pt-6 border-t border-white/10">
                      <p className="text-xs font-bold uppercase tracking-widest opacity-60">Daily Inspiration</p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  </Card>

                  {/* Market Status (Quick View) */}
                  <Card className="bg-white border-forest-green/10 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-forest-green uppercase tracking-wider mb-4">Market Trends</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-leaf-green rounded-full" />
                          <span className="text-sm font-bold text-earthy-brown">Wheat</span>
                        </div>
                        <span className="text-sm font-bold text-forest-green">₹2,125/q</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-leaf-green rounded-full" />
                          <span className="text-sm font-bold text-earthy-brown">Rice</span>
                        </div>
                        <span className="text-sm font-bold text-forest-green">₹3,850/q</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Bottom Insight Card */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <Card className="bg-white text-forest-green border border-forest-green/10 relative overflow-hidden p-8 shadow-2xl">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-forest-green rounded-full flex items-center justify-center text-white shadow-lg">
                        <Info size={24} />
                      </div>
                      <h3 className="text-2xl font-bold text-black">AI Climate Insight</h3>
                    </div>
                    <p className="text-black/80 text-lg leading-relaxed font-medium">
                      {climateInsight}
                    </p>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-forest-green/5 rounded-full blur-3xl" />
                  <div className="absolute -left-10 -top-10 w-40 h-40 bg-forest-green/5 rounded-full blur-2xl" />
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="pt-6">
                <h3 className="text-lg font-bold text-forest-green mb-4 flex items-center gap-2">
                  <Menu size={18} className="text-leaf-green" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {[
                    { label: "Check Soil", icon: Sprout, color: "bg-emerald-50 text-emerald-600" },
                    { label: "Crop Doctor", icon: Camera, color: "bg-rose-50 text-rose-600" },
                    { label: "Market Rates", icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
                    { label: "Weather Alert", icon: CloudRain, color: "bg-orange-50 text-orange-600" },
                    { label: "AI Advisor", icon: MessageSquare, color: "bg-purple-50 text-purple-600" }
                  ].map((action, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleQuickAction(action)}
                      className="flex flex-col items-center gap-3 p-6 bg-white/60 backdrop-blur-md rounded-3xl border border-white/50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all group"
                    >
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner", action.color)}>
                        <action.icon size={24} />
                      </div>
                      <span className="text-xs font-bold text-forest-green uppercase tracking-wider">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'advisor' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{t('crop_advisor')}</h2>
                  <p className="text-gray-500 text-sm">AI-powered climate-smart recommendations</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
                    <MapPin size={14} className="text-leaf-green" />
                    <input 
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 w-24 font-bold text-gray-800"
                    />
                  </div>
                  <select 
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="bg-white border border-gray-100 px-4 py-2 rounded-full text-sm font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-forest-green"
                  >
                    <option value="Loamy">Loamy (दोमट)</option>
                    <option value="Clayey">Clayey (चिकनी)</option>
                    <option value="Black">Black (काली)</option>
                    <option value="Alluvial">Alluvial (जलोढ़)</option>
                  </select>
                  <select 
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="bg-white border border-gray-100 px-4 py-2 rounded-full text-sm font-bold text-gray-800 shadow-sm focus:ring-2 focus:ring-forest-green"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{t(m.toLowerCase())}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Card className="bg-white text-forest-green border border-forest-green/10 p-8 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <h3 className="text-3xl font-bold text-black">Find Best Crops for Your Farm</h3>
                    <p className="text-black/70 text-lg">Get real-time AI analysis for {region} in {currentMonth}.</p>
                  </div>
                  <Button 
                    onClick={handleDynamicAnalysis} 
                    variant="primary" 
                    className="px-10 py-5 shadow-2xl text-lg font-bold hover:scale-105 transition-transform"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? t('analyzing') : "Analyze Now"}
                  </Button>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-forest-green/5 rounded-full blur-3xl" />
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-forest-green/5 rounded-full blur-2xl" />
              </Card>

              {dynamicCrops.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-forest-green">{t('best_crops_for', { region })}</h3>
                    {!comparisonData && <p className="text-sm text-earthy-brown">{t('compare_hint')}</p>}
                  </div>
                  
                  {!comparisonData && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {dynamicCrops.map((crop, i) => (
                        <motion.div 
                          key={i} 
                          whileHover={{ y: -5 }}
                          onClick={() => toggleCompare(crop.name)}
                          className={cn(
                            "glass-card rounded-3xl overflow-hidden transition-all cursor-pointer border-2",
                            selectedForCompare.includes(crop.name) ? "border-leaf-green ring-4 ring-leaf-green/10" : "border-white/20"
                          )}
                        >
                          <div className="p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-forest-green">{crop.name}</h4>
                                <p className="text-xs font-bold text-leaf-green uppercase tracking-wider">{crop.variety}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm",
                                  crop.resilience === 'Very High' ? "bg-forest-green text-white" : "bg-sky-blue text-white"
                                )}>
                                  {crop.resilience}
                                </div>
                                {selectedForCompare.includes(crop.name) && (
                                  <div className="bg-leaf-green text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                                    <Check size={10} /> Selected
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-forest-green/5">
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">{t('duration')}</p>
                                <p className="font-bold text-sm text-forest-green">{crop.duration}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">{t('risk_level')}</p>
                                <div className="flex items-center gap-1">
                                  <div className="flex-1 h-1.5 bg-forest-green/5 rounded-full overflow-hidden">
                                    <div 
                                      className={cn(
                                        "h-full rounded-full shadow-sm",
                                        crop.riskLevel > 7 ? "bg-red-500" : crop.riskLevel > 4 ? "bg-orange-500" : "bg-leaf-green"
                                      )}
                                      style={{ width: `${crop.riskLevel * 10}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-forest-green">{crop.riskLevel}/10</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">{t('why_recommended')}</p>
                              <p className="text-xs text-forest-green/70 leading-relaxed font-medium mb-3">{crop.reason}</p>
                              
                              {crop.source && (
                                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                                    Yeh jankari {crop.source} ke data par aadharit hai. Confidence: {crop.confidenceScore}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {selectedForCompare.length === 2 && !comparisonData && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
                    >
                      <Card className="bg-forest-green text-white border-none shadow-2xl flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-3">
                            {selectedForCompare.map((name, i) => (
                              <div key={i} className="w-10 h-10 bg-leaf-green border-2 border-forest-green rounded-full flex items-center justify-center font-bold text-xs">
                                {name[0]}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm font-bold">Compare {selectedForCompare[0]} vs {selectedForCompare[1]}</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="px-4 py-2 text-xs"
                          onClick={handleCompareCrops}
                          disabled={isComparing}
                        >
                          {isComparing ? "Analyzing..." : t('compare_btn')}
                        </Button>
                      </Card>
                    </motion.div>
                  )}

                  {comparisonData && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-forest-green">
                          <ArrowLeftRight className="text-leaf-green" />
                          Comparison: {selectedForCompare[0]} vs {selectedForCompare[1]}
                        </h3>
                        <Button 
                          variant="ghost" 
                          className="text-xs text-forest-green" 
                          onClick={() => setComparisonData(null)}
                          icon={ChevronLeft}
                        >
                          Back to List
                        </Button>
                      </div>

                      <Card className="overflow-hidden border-none shadow-2xl p-0 glass-card">
                        <div className="grid grid-cols-3 bg-forest-green/5 border-b border-forest-green/10">
                          <div className="p-4 font-bold text-forest-green text-sm">Factor</div>
                          <div className="p-4 font-bold text-forest-green text-sm text-center">{selectedForCompare[0]}</div>
                          <div className="p-4 font-bold text-forest-green text-sm text-center">{selectedForCompare[1]}</div>
                        </div>
                        <div className="divide-y divide-forest-green/5">
                          {comparisonData.factors.map((f: any, i: number) => (
                            <div key={i} className="grid grid-cols-3 hover:bg-forest-green/5 transition-colors">
                              <div className="p-4 text-xs font-bold text-earthy-brown uppercase tracking-wider flex items-center">{f.factor}</div>
                              <div className={cn(
                                "p-4 text-sm text-center flex flex-col items-center justify-center gap-1",
                                f.winner === 1 && "bg-leaf-green/10 font-bold text-leaf-green"
                              )}>
                                {f.crop1Value}
                                {f.winner === 1 && <Trophy size={14} className="text-amber-500 animate-bounce" />}
                              </div>
                              <div className={cn(
                                "p-4 text-sm text-center flex flex-col items-center justify-center gap-1",
                                f.winner === 2 && "bg-leaf-green/10 font-bold text-leaf-green"
                              )}>
                                {f.crop2Value}
                                {f.winner === 2 && <Trophy size={14} className="text-amber-500 animate-bounce" />}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-8 bg-forest-green text-white relative overflow-hidden">
                          <div className="relative z-10">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-leaf-green mb-3">Agro Chat Verdict</h4>
                            <p className="text-base leading-relaxed font-medium text-soft-cream/90 mb-4">{comparisonData.verdict}</p>
                            
                            {comparisonData.source && (
                              <div className="inline-block px-3 py-1 bg-white/10 rounded-lg border border-white/10">
                                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">
                                  Yeh jankari {comparisonData.source} ke data par aadharit hai. Confidence: {comparisonData.confidenceScore}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              )}

              {dynamicCrops.length === 0 && !isAnalyzing && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((crop, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ y: -5 }}
                      className="glass-card rounded-3xl overflow-hidden border border-white/20"
                    >
                      <div className="h-32 bg-forest-green relative overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                          </svg>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <h3 className="text-2xl font-bold text-white">{crop.crop_name}</h3>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">Temp Range</p>
                            <p className="font-bold text-sm text-forest-green">{crop.min_temp}° - {crop.max_temp}°C</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">Rainfall</p>
                            <p className="font-bold text-sm text-forest-green">{crop.min_rainfall} - {crop.max_rainfall}mm</p>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-forest-green/5 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] uppercase text-earthy-brown font-bold tracking-wider">{t('sowing_time')}</p>
                              <p className="font-bold text-leaf-green">{crop.sowing_period}</p>
                            </div>
                            <Button variant="secondary" className="px-4 py-2 text-xs">Details</Button>
                          </div>
                          
                          {crop.source && (
                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                              <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest leading-tight">
                                Yeh jankari {crop.source} ke data par aadharit hai. Confidence: {crop.confidenceScore}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'doctor' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Crop Doctor (AI Phytopathologist)</h2>
                  <p className="text-gray-500 text-sm">Upload a photo of your crop to diagnose diseases and get a 3-step cure.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <Card className="p-8 border-2 border-dashed border-forest-green/20 hover:border-leaf-green/40 transition-all bg-white relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center text-center space-y-4 py-12">
                      {selectedImage ? (
                        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                          <img src={selectedImage} alt="Selected crop" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Upload className="text-white" size={48} />
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-24 h-24 bg-forest-green/5 rounded-full flex items-center justify-center text-forest-green group-hover:scale-110 transition-transform">
                            <Camera size={48} />
                          </div>
                          <div>
                            <p className="text-lg font-bold text-forest-green">Click or Drag Photo</p>
                            <p className="text-sm text-gray-500">Upload leaf, stem, or fruit images</p>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>

                  {selectedImage && !analysisResult && (
                    <Button 
                      onClick={handleScanImage} 
                      disabled={isAnalyzingImage}
                      className="w-full py-6 text-lg"
                      icon={isAnalyzingImage ? Activity : Camera}
                    >
                      {isAnalyzingImage ? "Analyzing Crop..." : "Scan for Diseases"}
                    </Button>
                  )}
                </div>

                <div className="space-y-6">
                  {isAnalyzingImage && (
                    <Card className="h-full flex flex-col items-center justify-center p-12 space-y-6 animate-pulse bg-white">
                      <div className="w-20 h-20 border-4 border-leaf-green border-t-transparent rounded-full animate-spin" />
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-forest-green">AI Phytopathologist is Scanning...</h3>
                        <p className="text-sm text-gray-500">Detecting pests, fungal infections, and deficiencies</p>
                      </div>
                    </Card>
                  )}

                  {!isAnalyzingImage && !analysisResult && (
                    <Card className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4 bg-white border-forest-green/5">
                      <div className="w-16 h-16 bg-soft-cream rounded-full flex items-center justify-center text-leaf-green">
                        <Info size={32} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-forest-green">No Analysis Yet</h3>
                        <p className="text-sm text-gray-500">Upload an image and click 'Scan' to get a detailed diagnosis and cure.</p>
                      </div>
                    </Card>
                  )}

                  {analysisResult && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                      <Card className="bg-white border-none shadow-xl overflow-hidden p-0">
                        <div className="bg-forest-green p-6 text-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-leaf-green">Diagnosis Result</span>
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              {analysisResult.confidenceScore} Confidence
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold">{analysisResult.diseaseNameEnglish}</h3>
                          <p className="text-soft-cream/80 font-medium">{analysisResult.diseaseNameHindi}</p>
                        </div>
                        
                        <div className="p-6 space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-soft-cream rounded-2xl border border-forest-green/5">
                              <p className="text-[10px] font-bold uppercase text-earthy-brown tracking-wider mb-1">Crop Type</p>
                              <p className="font-bold text-forest-green">{analysisResult.cropType}</p>
                            </div>
                            <div className="p-4 bg-soft-cream rounded-2xl border border-forest-green/5">
                              <p className="text-[10px] font-bold uppercase text-earthy-brown tracking-wider mb-1">Contagious</p>
                              <p className={cn("font-bold", analysisResult.isContagious ? "text-red-500" : "text-leaf-green")}>
                                {analysisResult.isContagious ? "Yes - High Risk" : "No - Low Risk"}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-forest-green flex items-center gap-2">
                              <AlertCircle size={16} className="text-amber-500" />
                              Cause of Disease
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{analysisResult.cause}</p>
                          </div>

                          <div className="space-y-4 pt-4 border-t border-forest-green/5">
                            <h4 className="text-sm font-bold text-forest-green uppercase tracking-widest">3-Step Cure</h4>
                            <div className="space-y-3">
                              <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                                <div>
                                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Physical Action</p>
                                  <p className="text-sm text-blue-900 font-medium">{analysisResult.threeStepCure.physical}</p>
                                </div>
                              </div>
                              <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                                <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                                <div>
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Organic Remedy</p>
                                  <p className="text-sm text-emerald-900 font-medium">{analysisResult.threeStepCure.organic}</p>
                                </div>
                              </div>
                              <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                                <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                                <div>
                                  <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Chemical (Last Resort)</p>
                                  <p className="text-sm text-red-900 font-medium">{analysisResult.threeStepCure.chemical}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-forest-green/5 rounded-2xl border border-forest-green/10">
                            <p className="text-xs text-forest-green font-medium italic">"{analysisResult.explanation}"</p>
                          </div>

                          {analysisResult.source && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                Yeh jankari {analysisResult.source} ke data par aadharit hai. Confidence: {analysisResult.confidenceScore}
                              </p>
                            </div>
                          )}

                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => {
                              setActiveTab('chat');
                              handleSendMessage(`I need more info about ${analysisResult.diseaseNameEnglish} in my ${analysisResult.cropType} crop.`);
                            }}
                          >
                            Ask AI for more details
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Smart Sowing Calendar</h2>
                  <p className="text-gray-500 text-sm">Personalized agricultural timeline for {region}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {sowingSchedule.map((item, i) => (
                    <Card key={i} className="relative overflow-hidden group hover:border-leaf-green/30 transition-all">
                      <div className="flex items-start gap-6">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                          item.status === 'Completed' ? "bg-forest-green text-white" : 
                          item.status === 'In Progress' ? "bg-leaf-green text-white animate-pulse" : "bg-soft-cream text-forest-green border border-forest-green/10"
                        )}>
                          <item.icon size={28} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-lg font-bold text-forest-green">{item.task}</h4>
                            <span className="text-xs font-bold text-earthy-brown uppercase tracking-widest">{item.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">Recommended actions for your {soilType} soil in {currentMonth}.</p>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm",
                              item.status === 'Completed' ? "bg-gray-100 text-gray-500" : 
                              item.status === 'In Progress' ? "bg-leaf-green/10 text-leaf-green" : "bg-orange-50 text-orange-600"
                            )}>
                              {item.status}
                            </span>
                            {item.status === 'Upcoming' && (
                              <button className="text-[10px] font-bold text-forest-green underline underline-offset-4 hover:text-leaf-green transition-colors">
                                Set Reminder
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      {i < sowingSchedule.length - 1 && (
                        <div className="absolute left-[43px] top-[70px] bottom-[-24px] w-0.5 bg-forest-green/10" />
                      )}
                    </Card>
                  ))}
                </div>

                <div className="space-y-6">
                  <Card className="bg-forest-green text-white p-8 relative overflow-hidden shadow-2xl">
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-4">AI Seasonal Tip</h3>
                      <p className="text-white/80 text-sm leading-relaxed font-medium">
                        {currentMonth === 'March' ? "March is the transition period. Focus on moisture retention for your summer crops. Mulching is highly recommended for your soil type." : "Keep an eye on the local weather alerts for sudden temperature shifts."}
                      </p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  </Card>

                  <Card className="bg-white border border-forest-green/10 p-6">
                    <h3 className="font-bold text-forest-green mb-4 flex items-center gap-2">
                      <Info size={18} className="text-leaf-green" />
                      Sowing Checklist
                    </h3>
                    <div className="space-y-3">
                      {['Seed Treatment', 'Soil Testing', 'Irrigation Check', 'Fertilizer Stock'].map((check, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-soft-cream/50 rounded-xl border border-forest-green/5 group cursor-pointer hover:bg-soft-cream transition-colors">
                          <div className="w-5 h-5 rounded-md border-2 border-forest-green/20 flex items-center justify-center group-hover:border-leaf-green transition-colors">
                            <Check size={12} className="text-leaf-green opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-sm font-medium text-forest-green">{check}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="fixed inset-0 z-[60] bg-[#F8F9FA] flex flex-col"
            >
              <div className="max-w-7xl mx-auto w-full h-full flex flex-col p-4 md:p-8">
                <Card className="flex-1 flex flex-col p-0 overflow-hidden shadow-2xl border-forest-green/10 rounded-[2.5rem] bg-white">
                  <div className="p-6 border-b border-forest-green/10 flex items-center justify-between bg-white/80 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="w-10 h-10 bg-forest-green/5 rounded-full flex items-center justify-center text-forest-green hover:bg-forest-green hover:text-white transition-all md:hidden"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="w-12 h-12 bg-forest-green rounded-2xl flex items-center justify-center text-white shadow-lg shadow-forest-green/20">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-forest-green">Agro Chat Advisor</h3>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-leaf-green rounded-full animate-pulse" />
                          <p className="text-xs text-leaf-green font-bold uppercase tracking-widest">Always Online</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-soft-cream rounded-full border border-forest-green/5">
                        <Info size={16} className="text-forest-green" />
                        <span className="text-[10px] font-bold text-forest-green uppercase tracking-wider">AI Powered</span>
                      </div>
                      <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="hidden md:flex items-center gap-2 px-6 py-2 bg-forest-green text-white rounded-full font-bold hover:bg-leaf-green transition-all shadow-lg"
                      >
                        <ArrowLeftRight size={18} />
                        Back to Dashboard
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8F9FA]/50 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8">
                        <motion.div 
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ repeat: Infinity, duration: 6 }}
                          className="w-32 h-32 bg-forest-green/5 rounded-full flex items-center justify-center text-forest-green shadow-inner"
                        >
                          <Sun size={64} />
                        </motion.div>
                        <div className="max-w-md">
                          <h4 className="font-bold text-3xl text-forest-green mb-3">Namaste! How can I help?</h4>
                          <p className="text-earthy-brown text-lg font-medium leading-relaxed">
                            Ask me about crop diseases, market trends, or weather forecasts for your farm in {region}.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                          {[
                            "Best crops for my soil?",
                            "Weather for next week?",
                            "Current market rates?",
                            "How to improve yield?"
                          ].map((suggestion, i) => (
                            <button 
                              key={i}
                              onClick={() => handleSendMessage(suggestion)}
                              className="p-4 bg-white border border-forest-green/10 rounded-2xl text-sm font-bold text-forest-green hover:bg-forest-green hover:text-white transition-all shadow-sm"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "max-w-[85%] sm:max-w-[75%] p-6 rounded-[2rem] shadow-sm relative",
                          msg.role === 'user' 
                            ? "bg-forest-green text-white rounded-tr-none" 
                            : "bg-white text-forest-green rounded-tl-none border border-forest-green/5"
                        )}>
                          <p className="text-base whitespace-pre-wrap font-medium leading-relaxed">{msg.text}</p>
                          <span className={cn(
                            "text-[9px] uppercase font-bold tracking-widest mt-3 block opacity-50",
                            msg.role === 'user' ? "text-right" : "text-left"
                          )}>
                            {msg.role === 'user' ? 'You' : 'Agro Mitra'} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                    {isThinking && (
                      <div className="flex justify-start">
                        <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-forest-green/5 flex gap-2 items-center">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-leaf-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-2 h-2 bg-leaf-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-2 h-2 bg-leaf-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs font-bold text-leaf-green uppercase tracking-widest ml-2">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} className="h-4" />
                  </div>

                  <div className="p-6 bg-white border-t border-forest-green/10">
                    <div className="max-w-4xl mx-auto flex items-center gap-3 bg-[#F8F9FA] rounded-3xl px-6 py-3 border-2 border-transparent focus-within:border-leaf-green/30 transition-all shadow-inner">
                      <button 
                        onClick={startVoiceInput} 
                        className={cn(
                          "p-3 rounded-2xl transition-all", 
                          isListening ? "bg-red-500 text-white animate-pulse shadow-lg" : "text-leaf-green hover:bg-forest-green/10"
                        )}
                      >
                        <Mic size={24} />
                      </button>
                      <input 
                        ref={chatInputRef}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your question here..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-base py-2 font-medium text-forest-green placeholder:text-gray-400"
                      />
                      <button 
                        onClick={() => handleSendMessage()}
                        disabled={!userInput.trim() && !isThinking}
                        className={cn(
                          "p-3 rounded-2xl transition-all",
                          userInput.trim() ? "bg-forest-green text-white shadow-lg" : "text-gray-300"
                        )}
                      >
                        <Send size={24} />
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-widest">Agro Mitra AI can make mistakes. Verify important info.</p>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === 'chaupal' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-bold text-forest-green">Kisan Chaupal</h2>
                  <p className="text-gray-500 text-sm">Community forum moderated by AI. Share success stories or report alerts.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-leaf-green/10 rounded-full border border-leaf-green/20">
                  <ShieldCheck size={18} className="text-leaf-green" />
                  <span className="text-xs font-bold text-leaf-green uppercase tracking-widest">AI Moderated</span>
                </div>
              </div>

              <Card className="p-6 bg-white border-forest-green/10 shadow-xl">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-forest-green rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                    <User size={24} />
                  </div>
                  <div className="flex-1 space-y-4">
                    <textarea 
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share a success story or report an alert in your area..."
                      className="w-full bg-soft-cream/30 border border-forest-green/10 rounded-2xl p-4 text-forest-green placeholder:text-gray-400 focus:ring-2 focus:ring-leaf-green transition-all min-h-[120px] resize-none"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleCreatePost} 
                        disabled={isPosting || !newPostContent.trim()}
                        icon={isPosting ? Activity : Send}
                      >
                        {isPosting ? "AI Moderating..." : "Post to Chaupal"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="space-y-6">
                {chaupalPosts.map((post) => (
                  <motion.div 
                    key={post.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Card className="p-0 overflow-hidden border-none shadow-lg hover:shadow-xl transition-all bg-white group">
                      <div className="flex flex-col md:flex-row">
                        <div className={cn(
                          "w-full md:w-2 bg-forest-green shrink-0",
                          post.category === 'Alert' ? "bg-red-500" : post.category === 'Success Story' ? "bg-leaf-green" : "bg-forest-green"
                        )} />
                        <div className="p-6 flex-1 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-soft-cream rounded-full flex items-center justify-center text-forest-green font-bold">
                                {post.user[0]}
                              </div>
                              <div>
                                <h4 className="font-bold text-forest-green">{post.user}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{post.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm",
                                post.category === 'Alert' ? "bg-red-50 text-red-600 border border-red-100" : 
                                post.category === 'Success Story' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-50 text-gray-600"
                              )}>
                                {post.category === 'Success Story' ? 'Prerna' : post.category === 'Alert' ? 'Savdhani' : post.category}
                              </span>
                              {post.isVerified && (
                                <div className="flex items-center gap-1 px-3 py-1 bg-leaf-green text-white rounded-full text-[10px] font-bold uppercase tracking-widest shadow-md">
                                  <ShieldCheck size={12} />
                                  AI Verified
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-forest-green/80 text-lg font-medium leading-relaxed">
                            {post.content}
                          </p>

                          <div className="flex flex-wrap gap-2 pt-2">
                            {post.tags?.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-soft-cream text-earthy-brown rounded-lg text-[10px] font-bold uppercase tracking-wider border border-forest-green/5">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          {post.moderationNote && (
                            <div className="mt-4 p-4 bg-forest-green/5 rounded-2xl border border-forest-green/10 flex items-start gap-3">
                              <Info size={16} className="text-leaf-green shrink-0 mt-0.5" />
                              <p className="text-xs text-forest-green/70 italic font-medium">
                                <span className="font-bold text-forest-green not-italic">AI Moderator:</span> {post.moderationNote}
                              </p>
                            </div>
                          )}

                          <div className="pt-4 border-t border-forest-green/5 flex items-center gap-6">
                            <button className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group/btn">
                              <Heart size={18} className="group-hover/btn:fill-red-500" />
                              <span className="text-xs font-bold">24</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-forest-green transition-colors">
                              <MessageSquare size={18} />
                              <span className="text-xs font-bold">12</span>
                            </button>
                            <button className="flex items-center gap-2 text-gray-400 hover:text-leaf-green transition-colors">
                              <Megaphone size={18} />
                              <span className="text-xs font-bold">Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between md:hidden z-50">
        <MobileNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={CloudRain} label={t('dashboard')} />
        <MobileNavItem active={activeTab === 'advisor'} onClick={() => setActiveTab('advisor')} icon={Sprout} label={t('crop_advisor')} />
        <MobileNavItem active={activeTab === 'doctor'} onClick={() => setActiveTab('doctor')} icon={Camera} label="Doctor" />
        <MobileNavItem active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} icon={Calendar} label="Calendar" />
        <MobileNavItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={MessageSquare} label={t('ask_ai')} />
        <MobileNavItem active={activeTab === 'chaupal'} onClick={() => setActiveTab('chaupal')} icon={Users} label="Chaupal" />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all duration-300",
        active ? "active-pill" : "text-earthy-brown hover:bg-leaf-green/5"
      )}
    >
      <Icon size={20} className={cn(active ? "text-white" : "text-leaf-green")} />
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
        active ? "bg-forest-green text-white shadow-lg shadow-forest-green/20" : "text-earthy-brown"
      )}
    >
      <Icon size={20} />
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    teal: "bg-teal-100 text-teal-600"
  };
  
  return (
    <div className="glass-stat rounded-3xl p-6 flex items-center gap-4 hover-bounce border border-white/40 relative overflow-hidden">
      <div className="absolute top-2 right-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-leaf-green rounded-full animate-pulse" />
        <span className="text-[8px] font-bold text-leaf-green uppercase tracking-tighter">Live</span>
      </div>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm", colors[color as keyof typeof colors])}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs text-earthy-brown font-bold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-forest-green">{value}</p>
      </div>
    </div>
  );
}
