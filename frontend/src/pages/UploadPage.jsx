import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom'; // Added Link
import {
    UploadCloud,
    FileText,
    CheckCircle,
    Loader2,
    ArrowRight,
    Briefcase,
    Globe,
    Zap,
    ShieldCheck,
    Search,
    ToggleLeft,
    ToggleRight,
    Sparkles,
    LayoutDashboard // Added Icon
} from 'lucide-react';

const UploadPage = () => {
    // --- State Management (UNCHANGED) ---
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); 
    const [candidateId, setCandidateId] = useState(null);
    
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);

    const [source, setSource] = useState('ATS');
    const [priority, setPriority] = useState('high');
    const [isVerificationEnabled, setIsVerificationEnabled] = useState(false);

    const navigate = useNavigate();

    // --- 1. Fetch Jobs on Mount (UNCHANGED) ---
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get('http://localhost:8080/hr/resume/jobs');
                setJobs(res.data);
                if (res.data.length > 0) {
                    setSelectedJobId(res.data[0].id);
                }
            } catch (err) {
                console.error("Failed to load jobs:", err);
            } finally {
                setIsLoadingJobs(false);
            }
        };
        fetchJobs();
    }, []);

    // --- 2. Handle File Upload (UNCHANGED) ---
    const handleUpload = async () => {
        if (!file) return;
        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('jobId', selectedJobId);
        formData.append('source', source);
        formData.append('priority', priority);

        try {
            const res = await axios.post('http://localhost:8080/hr/resume/upload', formData);
            setCandidateId(res.data.candidateId);
            setStatus('success'); 
        } catch (err) {
            console.error("Upload failed:", err);
            setStatus('error');
        }
    };

    // --- 3. Trigger AI Processing (UNCHANGED) ---
    const handleProcess = async () => {
        if (!candidateId) return;
        setStatus('processing');

        try {
            await axios.post('http://localhost:8080/hr/resume/process', { 
                candidateId, 
                jobId: selectedJobId,
                verificationEnabled: isVerificationEnabled 
            });
            navigate(`/report/${candidateId}`);
        } catch (err) {
            console.error("Processing failed:", err);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-700 flex flex-col">

            {/* --- 1. Header (NEW) --- */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 transition-all">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
                            <Zap className="w-5 h-5" /> 
                        </div>
                        <span className="font-bold text-lg sm:text-xl tracking-tight text-slate-800">Dice.tech AI</span>
                    </div>
                    
                    <Link 
                        to="/dashboard" 
                        className="text-xs sm:text-sm bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 px-4 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-2 font-bold"
                    >
                        <LayoutDashboard className="w-4 h-4" /> 
                        <span className="hidden sm:inline">HR Dashboard</span>
                        <span className="sm:hidden">Dashboard</span>
                    </Link>
                </div>
            </nav>

            {/* --- 2. Main Split Layout --- */}
            <div className="flex-1 flex flex-col lg:flex-row">

                {/* ================= LEFT SIDE: FORM ================= */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12 bg-white relative z-10">
                    
                    {/* Header Text */}
                    <div className="mb-10 mt-4 lg:mt-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold mb-6">
                            <Sparkles className="w-3.5 h-3.5 fill-indigo-200" />
                            <span>AI-Powered Recruitment V2.0</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
                            Resume <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Screener</span>
                        </h1>
                        <p className="text-slate-500 text-lg">
                            Upload a candidate profile to generate a detailed intelligence report.
                        </p>
                    </div>

                    {/* Main Form */}
                    <div className="space-y-6 max-w-lg w-full mx-auto lg:mx-0 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

                        {/* Job Selection */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Target Job Profile</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Briefcase className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                
                                {isLoadingJobs ? (
                                    <div className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 flex items-center gap-2 text-sm font-medium">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading roles...
                                    </div>
                                ) : (
                                    <select
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none font-semibold text-slate-700 transition-all cursor-pointer shadow-sm"
                                    >
                                        {jobs.length === 0 ? (
                                            <option value="" disabled>No jobs found</option>
                                        ) : (
                                            jobs.map((job) => (
                                                <option key={job.id} value={job.id}>
                                                    {job.title} ({job.id})
                                                </option>
                                            ))
                                        )}
                                    </select>
                                )}
                                
                                {!isLoadingJobs && (
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* Source */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Source</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Globe className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <select
                                        value={source}
                                        onChange={(e) => setSource(e.target.value)}
                                        className="w-full pl-11 pr-8 py-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none font-medium text-slate-700 cursor-pointer shadow-sm transition-all text-sm"
                                    >
                                        <option value="ATS">ATS Integration</option>
                                        <option value="Naukri">Naukri.com</option>
                                        <option value="LinkedIn">LinkedIn</option>
                                        <option value="Email">Direct Email</option>
                                        <option value="Referral">Employee Referral</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Priority</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full pl-11 pr-8 py-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none font-medium text-slate-700 cursor-pointer shadow-sm transition-all text-sm"
                                    >
                                        <option value="high">High Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="low">Low Priority</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Verification Toggle */}
                        <div 
                            onClick={() => setIsVerificationEnabled(!isVerificationEnabled)}
                            className={`
                                group flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-300 select-none
                                ${isVerificationEnabled 
                                    ? 'border-indigo-500 bg-indigo-50 shadow-inner' 
                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm'
                                }
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2.5 rounded-xl transition-colors duration-300 ${isVerificationEnabled ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${isVerificationEnabled ? 'text-indigo-900' : 'text-slate-900'}`}>Background Check</h3>
                                    <p className="text-xs text-slate-500">Run identity & employment verification</p>
                                </div>
                            </div>
                            <div className="transition-transform duration-300 group-active:scale-95">
                                {isVerificationEnabled 
                                    ? <ToggleRight className="w-9 h-9 text-indigo-600 fill-indigo-100" /> 
                                    : <ToggleLeft className="w-9 h-9 text-slate-300 group-hover:text-slate-400" />
                                }
                            </div>
                        </div>

                        {/* File Upload Area */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Resume Document</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    disabled={status === 'uploading' || status === 'processing'}
                                />
                                <div className={`
                                    relative z-10 border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ease-out
                                    ${file
                                        ? 'border-emerald-500 bg-emerald-50/50'
                                        : 'border-slate-300 bg-slate-50 group-hover:border-indigo-400 group-hover:bg-indigo-50/30'
                                    }
                                `}>
                                    <div className={`
                                        mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 shadow-sm
                                        ${file 
                                            ? 'bg-emerald-100 text-emerald-600 rotate-0 scale-100' 
                                            : 'bg-white text-indigo-500 rotate-0 scale-100 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md'
                                        }
                                    `}>
                                        {file ? <CheckCircle className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
                                    </div>
                                    <p className="text-base font-bold text-slate-700 truncate px-4">
                                        {file ? file.name : "Click to upload or drag & drop"}
                                    </p>
                                    <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wide">
                                        {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB PDF` : "PDF up to 5MB"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 pb-2">
                            {status === 'processing' ? (
                                <button disabled className="w-full bg-indigo-100 text-indigo-700 py-4 rounded-2xl flex items-center justify-center gap-3 cursor-not-allowed font-bold text-lg animate-pulse">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing AI Analysis...
                                </button>
                            ) : !candidateId ? (
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || status === 'uploading'}
                                    className="
                                        w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-4 rounded-2xl font-bold text-lg 
                                        shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-95
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0
                                    "
                                >
                                    {status === 'uploading' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="animate-spin w-5 h-5" /> Uploading...
                                        </span>
                                    ) : 'Upload & Analyze Resume'}
                                </button>
                            ) : (
                                <div className="space-y-4 animate-in zoom-in fade-in duration-300">
                                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-700 font-bold bg-emerald-50 py-3 rounded-xl border border-emerald-100">
                                        <CheckCircle className="w-4 h-4" /> Upload Complete
                                    </div>
                                    <button
                                        onClick={handleProcess}
                                        className="
                                            w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold text-lg 
                                            shadow-2xl shadow-slate-300/50 transition-all flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-95
                                        "
                                    >
                                        <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                                        Run AI Assessment
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-[10px] text-slate-400 font-semibold tracking-wider uppercase opacity-60">
                            Powered by LangGraph & Supabase
                        </p>

                    </div>
                </div>

                {/* ================= RIGHT SIDE: VISUALS ================= */}
                <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-slate-900 items-center justify-center p-12">
                    
                    {/* Background Decor */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse-slower"></div>
                    
                    {/* Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>

                    {/* Info Card */}
                    <div className="relative z-10 max-w-lg w-full">
                        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl">
                            
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                    <Zap className="w-6 h-6 text-white fill-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white leading-tight">Intelligent Screening</h2>
                                    <p className="text-indigo-200 text-sm">Next-gen candidate analysis</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <FeatureRow
                                    icon={<FileText className="w-5 h-5 text-blue-200" />}
                                    title="Smart Parsing Engine"
                                    desc="Instantly extracts structured data from unstructured PDFs using LLMs."
                                />
                                <FeatureRow
                                    icon={<ShieldCheck className="w-5 h-5 text-emerald-200" />}
                                    title="Integrity & Fraud Check"
                                    desc="Detects AI-generated content, timeline gaps, and fabrication."
                                />
                                <FeatureRow
                                    icon={<Search className="w-5 h-5 text-amber-200" />}
                                    title="Contextual Scoring"
                                    desc="Ranks candidates based on semantic relevance to the job description."
                                />
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
                               <div className="flex items-center -space-x-3">
                                    {[1,2,3].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-200" style={{backgroundImage: `url(https://i.pravatar.cc/150?img=${i+10})`, backgroundSize: 'cover'}}></div>
                                    ))}
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-white/20 flex items-center justify-center text-[10px] text-white font-bold backdrop-blur-sm">
                                        +2k
                                    </div>
                               </div>
                               <div className="text-right">
                                    <p className="text-2xl font-bold text-white">98%</p>
                                    <p className="text-xs text-indigo-200 uppercase tracking-wider font-bold">Accuracy Rate</p>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Helper component for the feature list
const FeatureRow = ({ icon, title, desc }) => (
    <div className="flex gap-5 group p-4 rounded-2xl hover:bg-white/5 transition-colors duration-300 border border-transparent hover:border-white/5">
        <div className="mt-1 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-lg text-white mb-1 group-hover:text-indigo-200 transition-colors">{title}</h3>
            <p className="text-indigo-100/70 text-sm leading-relaxed">{desc}</p>
        </div>
    </div>
);

export default UploadPage;