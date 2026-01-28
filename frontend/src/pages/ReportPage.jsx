import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft,
    BrainCircuit, GraduationCap, Briefcase, MapPin, Mail,
    Calendar, Hash, Download, FileText, Loader2, ChevronDown,
    LayoutDashboard, Zap, XCircle, Info, ExternalLink,
    Github, Linkedin, Globe, Award, Terminal, UserCheck,
    History, Fingerprint, Award as CertificationIcon, Sparkles,
    ShieldCheck, SearchCode, TrendingUp
} from 'lucide-react';

import ChatWidget from '../components/ChatWidget';

const ReportPage = () => {
    // --- State Management ---
    const { candidateId } = useParams();
    const [reportData, setReportData] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isProcessingDecision, setIsProcessingDecision] = useState(false);
    const [emailAction, setEmailAction] = useState('reject');

    // --- 1. Data Aggregation ---
    useEffect(() => {
        const fetchReport = async () => {
            try {
                const res = await axios.get(`http://localhost:8080/hr/resume/candidate/${candidateId}/report`);
                setReportData(res.data);

                // Dynamic Logic: Score threshold for automated logistics dispatch
                const score = res.data.evaluation?.overallScore || res.data.scores?.overallScore || 0;
                setEmailAction(score >= 75 ? 'shortlist' : 'reject');
            } catch (err) {
                console.error("Error fetching report:", err);
            }
        };
        fetchReport();
    }, [candidateId]);

    // --- 2. Controller Handlers ---
    const handlePrint = () => window.print();

    const handleEmail = async () => {
        if (!reportData) return;
        setIsSendingEmail(true);
        try {
            await axios.post('http://localhost:8080/hr/resume/email', {
                candidateId,
                type: emailAction,
            });
            alert(`✅ Logistics Agent: Email successfully dispatched for ${emailAction.toUpperCase()}`);
        } catch (err) {
            alert("❌ Logistics Error: Failed to send email.");
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleDecision = async (decisionStatus) => {
        setIsProcessingDecision(true);
        try {
            await axios.post(`http://localhost:8080/hr/resume/decision`, {
                candidateId,
                decision: decisionStatus
            });
            alert(`✅ Pipeline: Candidate status updated to ${decisionStatus.toLowerCase()}!`);
            window.location.href = '/dashboard';
        } catch (err) {
            alert("❌ System Error: Failed to process decision.");
        } finally {
            setIsProcessingDecision(false);
        }
    };

    if (!reportData) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8fafc] font-sans">
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full animate-pulse"></div>
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                <div className="absolute inset-0 flex items-center justify-center relative z-20">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
            </div>
            <p className="mt-8 font-black text-slate-800 animate-pulse tracking-[0.3em] text-sm uppercase">Aggregating Intelligence Object</p>
        </div>
    );

    // Extraction with robust fallbacks
    const profile = reportData.profile || {};
    const evaluation = reportData.evaluation || {};
    const risk = reportData.risk || reportData.fraud || {};
    const scores = reportData.scores || {};
    const recommendation = reportData.recommendation || "HOLD";
    const resumeUrl = reportData.resumeUrl;
    const auditTrail = reportData.auditTrail || [];
    const explainability = evaluation.explainability || scores.explainability || [];

    // --- UI Intelligence Logic ---
    const isDuplicate = 
        risk.risk_json?.duplicateDetected === true || 
        risk.flags?.includes("DUPLICATE_APPLICATION_DETECTED") ||
        (evaluation.overallScore === 15 || scores.overallScore === 15);

    const statusConfig = {
        PROCEED: { bg: 'bg-emerald-50/50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-8 h-8" />, glow: 'shadow-emerald-200/50' },
        HOLD: { bg: 'bg-amber-50/50', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertTriangle className="w-8 h-8" />, glow: 'shadow-amber-200/50' },
        REJECT: { bg: 'bg-rose-50/50', text: 'text-rose-700', border: 'border-rose-200', icon: <ShieldAlert className="w-8 h-8" />, glow: 'shadow-rose-200/50' }
    };

    const statusStyle = isDuplicate ? statusConfig.REJECT : (statusConfig[recommendation] || statusConfig.HOLD);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans selection:bg-indigo-600 selection:text-white print:bg-white overflow-x-hidden">
            
            <style>{`@media print { nav, .no-print, .chat-widget { display: none !important; } body { background: white; } .print-full-width { width: 100% !important; max-width: 100% !important; } }`}</style>

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-white/80 border-b border-slate-200/60 px-4 lg:px-12 py-4 flex flex-wrap justify-between items-center gap-4 no-print shadow-sm">
                <div className="flex items-center gap-4 lg:gap-6">
                    <Link to="/dashboard" className="group flex items-center gap-3 text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] hover:text-indigo-600 transition-all">
                        <div className="p-2.5 rounded-2xl bg-white border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span className="hidden sm:inline">Leaderboard</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-full border border-slate-200/50 shadow-inner">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[10px] font-bold text-slate-600 uppercase tracking-tight">{candidateId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-3">
                    <div className="relative hidden md:block">
                        <select
                            value={emailAction}
                            onChange={(e) => setEmailAction(e.target.value)}
                            className={`appearance-none pl-5 pr-12 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none transition-all cursor-pointer shadow-sm hover:shadow-md ${
                                emailAction === 'shortlist' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}
                        >
                            <option value="shortlist">Shortlist Agent</option>
                            <option value="reject">Rejection Agent</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>

                    <button
                        onClick={handleEmail}
                        disabled={isSendingEmail}
                        className={`flex items-center gap-3 px-6 lg:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 disabled:opacity-50 ${
                            emailAction === 'shortlist' ? 'bg-emerald-600 text-white shadow-emerald-200/60' : 'bg-rose-600 text-white shadow-rose-200/60'
                        }`}
                    >
                        {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                        {isSendingEmail ? "Dispatching..." : "Execute Logistics"}
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                    <button onClick={handlePrint} className="p-3 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-600 rounded-2xl transition-all shadow-sm group">
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 lg:px-12 py-8 lg:py-12 space-y-10">
                
                {/* 1. Profile Header Hero */}
                <div className="bg-white rounded-[2.5rem] lg:rounded-[4rem] p-8 lg:p-16 shadow-2xl shadow-slate-200/40 border border-white relative overflow-hidden print:shadow-none print:border-b-4">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full -mr-64 -mt-64 opacity-50 blur-[100px]"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50/30 rounded-full -ml-48 -mb-48 opacity-30 blur-[80px]"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
                        <div className="space-y-8 flex-1">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                                    <h1 className="text-4xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-[1.1]">{profile.name || "Unknown Candidate"}</h1>
                                    {isDuplicate && (
                                        <div className="flex items-center gap-3 px-6 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.25em] rounded-full shadow-2xl shadow-rose-300 animate-pulse border-2 border-rose-400">
                                            <ShieldAlert className="w-4 h-4" /> DUPLICATE DETECTED
                                        </div>
                                    )}
                                </div>
                                <p className="text-lg lg:text-2xl text-slate-500 font-bold tracking-tight flex items-center gap-3">
                                    <MapPin className="w-6 h-6 text-rose-500" /> {profile.location || 'Remote Candidate'}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 lg:gap-4 pt-4">
                                <ContactBadge icon={<Mail className="w-4 h-4 text-indigo-500" />} text={profile.email} />
                                <ContactBadge icon={<Briefcase className="w-4 h-4 text-emerald-500" />} text={profile.phone} />
                                <div className="flex gap-3">
                                    {profile.links?.linkedin && (
                                        <SocialLink icon={<Linkedin className="w-5 h-5" />} url={profile.links.linkedin} color="bg-[#0077b5]" />
                                    )}
                                    {profile.links?.github && (
                                        <SocialLink icon={<Github className="w-5 h-5" />} url={profile.links.github} color="bg-[#181717]" />
                                    )}
                                    {profile.links?.portfolio && (
                                        <SocialLink icon={<Globe className="w-5 h-5" />} url={profile.links.portfolio} color="bg-indigo-600" />
                                    )}
                                </div>
                                {resumeUrl && (
                                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-7 py-3.5 bg-slate-900 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:-translate-y-1 transition-all shadow-xl shadow-slate-200">
                                        <FileText className="w-5 h-5" /> View Original Document
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className={`p-8 lg:p-14 rounded-[2.5rem] lg:rounded-[3.5rem] border-[3px] flex flex-col items-center justify-center min-w-[280px] lg:min-w-[340px] shadow-2xl backdrop-blur-sm ${statusStyle.bg} ${statusStyle.border} ${statusStyle.glow} transition-all duration-500`}>
                            <span className={`text-[12px] font-black uppercase tracking-[0.5em] mb-6 opacity-60 ${statusStyle.text}`}>Screener Verdict</span>
                            <div className={`text-4xl lg:text-6xl font-black flex items-center gap-5 tracking-tighter ${statusStyle.text}`}>
                                {isDuplicate ? <ShieldAlert className="w-12 h-12" /> : statusStyle.icon}
                                {isDuplicate ? "FLAGGED" : recommendation}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Intelligence Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    <MetricCard title="AI Match Score" value={evaluation.overallScore || scores.overallScore} color="indigo" icon={<BrainCircuit className="w-6 h-6" />} />
                    <MetricCard title="Skill Proficiency" value={evaluation.skillMatchScore || 0} color="emerald" icon={<Terminal className="w-6 h-6" />} />
                    <MetricCard title="Experience Fit" value={evaluation.experienceRelevanceScore || 0} color="blue" icon={<TrendingUp className="w-6 h-6" />} />
                    <MetricCard title="Fraud Risk" value={isDuplicate ? 85 : (risk.fraudScore || 0)} color="rose" icon={<ShieldAlert className="w-6 h-6" />} inverse />
                </div>

                {/* 3. Decision Control Center */}
                <div className="bg-slate-900 rounded-[2.5rem] lg:rounded-[3.5rem] p-8 lg:p-14 shadow-3xl flex flex-col xl:flex-row items-center justify-between gap-10 no-print border border-slate-800 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                        <div className="p-6 bg-indigo-500/10 rounded-[2rem] border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <Zap className="w-12 h-12 text-indigo-400 animate-pulse" />
                        </div>
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-white text-3xl lg:text-4xl font-black tracking-tight leading-none">Decision Terminal</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Executing final status update across the neural pipeline</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-5 w-full xl:w-auto relative z-10">
                        <button
                            onClick={() => handleDecision('SHORTLISTED')}
                            disabled={isProcessingDecision}
                            className="flex-1 xl:px-16 py-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] lg:rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {isProcessingDecision ? <Loader2 className="w-7 h-7 animate-spin" /> : <UserCheck className="w-7 h-7" />}
                            Shortlist
                        </button>
                        <button
                            onClick={() => handleDecision('REJECTED')}
                            disabled={isProcessingDecision}
                            className="flex-1 xl:px-16 py-6 bg-transparent border-2 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 rounded-[1.5rem] lg:rounded-[2rem] font-black text-xl transition-all flex items-center justify-center gap-3"
                        >
                            {isProcessingDecision ? <Loader2 className="w-7 h-7 animate-spin" /> : <XCircle className="w-7 h-7" />}
                            Reject
                        </button>
                    </div>
                </div>

                {/* 4. Agent Intelligence Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    
                    <div className="lg:col-span-8 space-y-10 lg:space-y-12">
                        
                        {/* Explainability Section - NEW ENHANCED DESIGN */}
                        <div className="bg-indigo-600 rounded-[3rem] p-10 lg:p-14 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white tracking-tighter">AI Logic Insights</h2>
                                </div>
                                <div className="space-y-4">
                                    {explainability.length > 0 ? explainability.map((bullet, i) => (
                                        <div key={i} className="flex gap-5 p-5 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 transition-all hover:bg-white/20">
                                            <div className="mt-1 flex-shrink-0">
                                                <div className="w-6 h-6 bg-white text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                            </div>
                                            <p className="text-white font-bold text-lg leading-relaxed tracking-tight">{bullet}</p>
                                        </div>
                                    )) : (
                                        <div className="text-white/60 font-black italic text-center py-6">Intelligence aggregation complete - No specific flags raised.</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Skills Cloud Section */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-xl relative group">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                    <Terminal className="w-9 h-9 text-indigo-600" /> Technical Arsenal
                                </h2>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 uppercase tracking-[0.2em] shadow-sm">
                                        {profile.skills?.length || 0} Core Entities
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 lg:gap-4">
                                {profile.skills?.map((skill, i) => (
                                    <div key={i} className="px-6 lg:px-8 py-3 bg-slate-50 text-slate-700 font-black text-[12px] uppercase tracking-wider rounded-2xl border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all cursor-default shadow-sm hover:scale-105 active:scale-95">
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Experience Section */}
                        <TimelineSection title="Professional Trajectory" items={profile.experience} type="exp" color="indigo" icon={<Briefcase className="w-8 h-8" />} />

                        {/* Certifications Section */}
                        <div className="bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-xl overflow-hidden">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-12 flex items-center gap-4">
                                <Award className="w-9 h-9 text-amber-500" /> Certifications & Accolades
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                                {profile.certifications?.map((cert, i) => (
                                    <div key={i} className="flex gap-6 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:border-amber-200 transition-all relative">
                                        <div className="absolute top-6 right-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <CertificationIcon className="w-12 h-12 text-amber-500" />
                                        </div>
                                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:bg-amber-100">
                                            <Award className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <p className="text-slate-600 font-bold text-lg leading-snug pt-1 relative z-10">{cert}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Security Audit & Metadata */}
                    <div className="lg:col-span-4 space-y-10 no-print">
                        
                        {/* Risk Flags Card */}
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden group">
                            <div className="p-12 border-b border-rose-100 bg-rose-50/30 group-hover:bg-rose-50/50 transition-colors">
                                <h3 className="text-rose-600 font-black uppercase tracking-[0.4em] text-[12px] mb-4">Integrity Audit</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-7xl font-black text-rose-800 tracking-tighter">
                                        {isDuplicate ? "85" : (risk.fraudScore || 0)}
                                    </span>
                                    <span className="text-2xl font-black text-rose-400">%</span>
                                </div>
                            </div>
                            <div className="p-12 space-y-6 bg-white">
                                {(risk.flags || []).length > 0 || isDuplicate ? (
                                    <div className="space-y-4">
                                        {isDuplicate && <RiskBadge text="DATABASE_DUPLICATE_ID" high />}
                                        {(risk.flags || []).map((flag, i) => (
                                            <RiskBadge key={i} text={flag} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 space-y-5">
                                        <div className="p-7 bg-emerald-50 rounded-full w-24 h-24 mx-auto border-2 border-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100">
                                            <ShieldCheck className="w-12 h-12 text-emerald-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-slate-900 font-black uppercase tracking-[0.3em] text-[12px]">Clear Integrity</p>
                                            <p className="text-slate-400 text-[10px] font-bold">No suspicious patterns detected</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Education History */}
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <h3 className="text-2xl font-black text-slate-900 mb-10 tracking-tighter flex items-center gap-4">
                                <GraduationCap className="w-8 h-8 text-indigo-600" /> Academic History
                            </h3>
                            <div className="space-y-12 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                                {profile.education?.map((edu, i) => (
                                    <div key={i} className="relative pl-12 group">
                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 z-10 shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <div className="space-y-1.5">
                                            <div className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.2em]">{edu.year}</div>
                                            <div className="text-lg font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{edu.degree}</div>
                                            <div className="text-sm font-bold text-slate-500">{edu.institution}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Trail */}
                        <div className="bg-slate-900 rounded-[3rem] p-12 shadow-3xl border border-slate-800 overflow-hidden relative">
                             <div className="absolute inset-0 bg-indigo-500/[0.02] pointer-events-none"></div>
                            <h3 className="text-indigo-400 font-black uppercase tracking-[0.4em] text-[11px] mb-12 flex items-center gap-4">
                                <History className="w-5 h-5" /> Pipeline State Logs
                            </h3>
                            <div className="space-y-10 relative">
                                <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-slate-800"></div>
                                {auditTrail.map((step, i) => (
                                    <div key={i} className="relative pl-10 flex justify-between items-center group">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 border border-slate-700 z-10 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:bg-indigo-300 transition-colors"></div>
                                        </div>
                                        <div>
                                            <div className="text-[11px] font-black uppercase text-white tracking-widest mb-1 group-hover:text-indigo-300 transition-colors">{step.step.replace(/_/g, ' ')}</div>
                                            <div className="text-[10px] font-bold text-slate-500 font-mono tracking-tight">{new Date(step.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                                        </div>
                                        <div className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest border ${
                                            step.status === 'OK' || step.status === 'SUCCESS' 
                                            ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20' 
                                            : 'text-amber-400 bg-amber-400/5 border-amber-400/20'
                                        }`}>
                                            {step.status}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ChatWidget candidateId={candidateId} candidateName={profile.name} />
        </div>
    );
};

// --- Specialized UI Components ---

const ContactBadge = ({ icon, text }) => (
    <div className="flex items-center gap-4 px-6 py-3.5 bg-white rounded-2xl border border-slate-200/60 shadow-sm text-[13px] font-bold text-slate-600 transition-all hover:border-indigo-400 hover:shadow-md">
        {icon}
        <span className="truncate max-w-[200px]">{text || 'N/A'}</span>
    </div>
);

const SocialLink = ({ icon, url, color }) => (
    <a 
        href={url?.startsWith('http') ? url : `https://${url}`} 
        target="_blank" 
        rel="noreferrer" 
        className={`flex items-center justify-center w-12 h-12 ${color} text-white rounded-2xl shadow-lg transition-all hover:scale-110 hover:-translate-y-1 active:scale-95`}
    >
        {icon}
    </a>
);

const MetricCard = ({ title, value = 0, color, icon, inverse = false }) => {
    const isRisk = title.includes("Fraud") || title.includes("Risk");
    const baseColor = isRisk ? (value > 35 ? 'rose' : 'emerald') : color;
    const roundedValue = Math.round(value);

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl group hover:border-indigo-200 transition-all relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${baseColor}-50/50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-1000 ease-in-out`}></div>
            <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-2xl bg-${baseColor}-50 text-${baseColor}-600 border border-${baseColor}-100 shadow-sm`}>{icon}</div>
                    <span className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={`text-6xl lg:text-7xl font-black tracking-tighter text-${baseColor}-600`}>{roundedValue}</span>
                    <span className="text-slate-300 font-black text-2xl">/100</span>
                </div>
                <div className="space-y-3">
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <div className={`h-full bg-${baseColor}-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: `${roundedValue}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                        <span>Baseline</span>
                        <span>Optimization</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const RiskBadge = ({ text, high = false }) => (
    <div className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
        high ? 'bg-rose-600 border-rose-700 text-white shadow-2xl shadow-rose-200' : 'bg-white border-rose-100 text-slate-800 shadow-sm hover:border-rose-300'
    }`}>
        <div className={`p-2 rounded-xl ${high ? 'bg-white/20' : 'bg-rose-50'}`}>
            <ShieldAlert className={`w-5 h-5 ${high ? 'text-white' : 'text-rose-600'}`} />
        </div>
        <span className="text-[12px] font-black uppercase tracking-widest leading-none truncate">{text.replace(/_/g, ' ')}</span>
    </div>
);

const TimelineSection = ({ title, items = [], type, color, icon }) => (
    <div className="bg-white rounded-[3rem] p-10 lg:p-14 border border-slate-100 shadow-xl h-full relative group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 border-b-2 border-slate-50 pb-8">
            <h3 className={`text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4`}>
                <div className={`p-3 rounded-2xl bg-${color}-50 text-${color}-600`}>{icon}</div>
                {title}
            </h3>
        </div>
        
        <div className="space-y-12 relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-1 bg-slate-50"></div>
            {items && items.length > 0 ? items.map((item, i) => (
                <div key={i} className="relative pl-16 group/item">
                    <div className={`absolute left-0 top-1.5 w-7 h-7 rounded-full bg-white border-[6px] border-${color}-500 z-10 shadow-lg group-hover/item:scale-125 transition-transform`}></div>
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="font-black text-slate-900 text-2xl lg:text-3xl tracking-tight leading-tight group-hover/item:text-indigo-600 transition-colors">
                                    {type === 'exp' ? (item.title || "Core Contributor") : (item.degree || "Qualified Major")}
                                </div>
                                <div className="text-sm lg:text-base font-bold text-slate-500 uppercase tracking-widest">
                                    {type === 'exp' ? (item.company || "Enterprise Corp") : (item.institution || "Academy Board")}
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-slate-50 rounded-2xl text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] border border-slate-200/60 shadow-inner shrink-0">
                                <Calendar className="w-4 h-4 text-indigo-500" /> 
                                {type === 'exp' ? `${item.startDate} — ${item.endDate}` : item.year}
                            </div>
                        </div>
                        
                        {type === 'exp' && item.highlights?.length > 0 && (
                            <div className="pt-2 space-y-4">
                                {item.highlights.map((h, j) => (
                                    <div key={j} className="flex gap-4">
                                        <div className="mt-2.5 w-2 h-2 rounded-full bg-indigo-200 shrink-0"></div>
                                        <p className="text-slate-600 font-bold text-lg leading-relaxed">{h}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )) : (
                <div className="text-center py-20 px-10 border-4 border-dashed border-slate-50 rounded-[3rem]">
                    <div className="p-6 bg-slate-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <SearchCode className="w-12 h-12 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Structural Data Extracted</p>
                </div>
            )}
        </div>
    </div>
);

export default ReportPage;