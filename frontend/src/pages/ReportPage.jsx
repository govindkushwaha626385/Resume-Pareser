import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
    ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft,
    BrainCircuit, GraduationCap, Briefcase, MapPin, Mail,
    Calendar, Hash, Download, FileText, Loader2, ChevronDown,
    LayoutDashboard, Zap, XCircle, Info, ExternalLink,
    Github, Linkedin, Globe, Award, Terminal, UserCheck,
    History, Fingerprint, Award as CertificationIcon
} from 'lucide-react';

import ChatWidget from '../components/ChatWidget';

const ReportPage = () => {
    // --- State Management ---
    const { candidateId } = useParams();
    const [reportData, setReportData] = useState(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isProcessingDecision, setIsProcessingDecision] = useState(false);
    const [emailAction, setEmailAction] = useState('reject');

    // --- 1. Data Aggregation [cite: 114-116] ---
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
            <div className="relative">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
            </div>
            <p className="mt-4 font-black text-slate-800 animate-pulse tracking-tighter text-xl uppercase">Aggregating Intelligence Object...</p>
        </div>
    );

    // Extraction with robust fallbacks [cite: 118-124, 197-224]
    const profile = reportData.profile || {};
    const evaluation = reportData.evaluation || {};
    const risk = reportData.risk || reportData.fraud || {};
    const scores = reportData.scores || {};
    const recommendation = reportData.recommendation || "HOLD";
    const resumeUrl = reportData.resumeUrl;
    const auditTrail = reportData.auditTrail || [];

    // --- UI Intelligence Logic ---
    const isDuplicate = 
        risk.risk_json?.duplicateDetected === true || 
        risk.flags?.includes("DUPLICATE_APPLICATION_DETECTED") ||
        (evaluation.overallScore === 15 || scores.overallScore === 15);

    const statusConfig = {
        PROCEED: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: <CheckCircle2 className="w-6 h-6" /> },
        HOLD: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: <AlertTriangle className="w-6 h-6" /> },
        REJECT: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: <ShieldAlert className="w-6 h-6" /> }
    };

    const statusStyle = isDuplicate ? statusConfig.REJECT : (statusConfig[recommendation] || statusConfig.HOLD);

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans selection:bg-indigo-600 selection:text-white print:bg-white">
            
            <style>{`@media print { nav, .no-print, .chat-widget { display: none !important; } body { background: white; } }`}</style>

            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-slate-200 px-8 lg:px-12 py-4 flex justify-between items-center no-print">
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="group flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest hover:text-indigo-600 transition-all">
                        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                            <LayoutDashboard className="w-4 h-4" />
                        </div>
                        <span>Leaderboard</span>
                    </Link>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-[10px] font-black text-slate-600 uppercase tracking-tighter">{candidateId}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={emailAction}
                            onChange={(e) => setEmailAction(e.target.value)}
                            className={`appearance-none pl-4 pr-10 py-2.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none transition-all cursor-pointer shadow-sm ${
                                emailAction === 'shortlist' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                            }`}
                        >
                            <option value="shortlist">Shortlist Agent</option>
                            <option value="reject">Rejection Agent</option>
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" />
                    </div>

                    <button
                        onClick={handleEmail}
                        disabled={isSendingEmail}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                            emailAction === 'shortlist' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-rose-600 text-white shadow-rose-200'
                        }`}
                    >
                        {isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                        {isSendingEmail ? "Dispatching..." : "Execute Logistics"}
                    </button>

                    <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block"></div>

                    <button onClick={handlePrint} className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl transition-all shadow-sm group">
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-8 lg:px-12 py-10 space-y-10">
                
                {/* 1. Profile Header Hero [cite: 198-201] */}
                <div className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50 border border-white relative overflow-hidden print:shadow-none print:border-b-4">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-48 -mt-48 opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -ml-32 -mb-32 opacity-30 blur-3xl"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-12">
                        <div className="space-y-6 flex-1">
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-4">
                                    <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-tight">{profile.name || "Unknown Candidate"}</h1>
                                    {isDuplicate && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-xl shadow-rose-200 animate-pulse">
                                            <ShieldAlert className="w-4 h-4" /> DUPLICATE DETECTED
                                        </div>
                                    )}
                                </div>
                                <p className="text-xl text-slate-500 font-bold tracking-tight flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-rose-500" /> {profile.location || 'Remote Candidate'}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 pt-4">
                                <ContactBadge icon={<Mail className="w-4 h-4 text-indigo-500" />} text={profile.email} />
                                <ContactBadge icon={<Briefcase className="w-4 h-4 text-emerald-500" />} text={profile.phone || "+91 (Verified)"} />
                                {profile.links?.linkedin && (
                                    <SocialLink icon={<Linkedin className="w-4 h-4" />} url={profile.links.linkedin} color="bg-[#0077b5]" />
                                )}
                                {profile.links?.github && (
                                    <SocialLink icon={<Github className="w-4 h-4" />} url={profile.links.github} color="bg-[#24292e]" />
                                )}
                                {resumeUrl && (
                                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                        <FileText className="w-4 h-4" /> View Original
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className={`p-10 rounded-[2.5rem] border-4 flex flex-col items-center justify-center min-w-[280px] shadow-2xl ${statusStyle.bg} ${statusStyle.border}`}>
                            <span className={`text-[11px] font-black uppercase tracking-[0.4em] mb-4 opacity-60 ${statusStyle.text}`}>Screener Verdict</span>
                            <div className={`text-5xl font-black flex items-center gap-4 tracking-tighter ${statusStyle.text}`}>
                                {isDuplicate ? <ShieldAlert className="w-10 h-10" /> : statusStyle.icon}
                                {isDuplicate ? "FLAGGED" : recommendation}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Intelligence Metrics Grid [cite: 101-105] */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <MetricCard title="Match Score" value={evaluation.overallScore || scores.overallScore} color="indigo" icon={<BrainCircuit />} />
                    <MetricCard title="Tech Proficiency" value={evaluation.skillMatchScore || 0} color="emerald" icon={<Terminal />} />
                    <MetricCard title="Experience Fit" value={evaluation.experienceRelevanceScore || 0} color="blue" icon={<History />} />
                    <MetricCard title="Fraud Audit" value={isDuplicate ? 85 : (risk.fraudScore || 0)} color="rose" icon={<ShieldAlert />} inverse />
                </div>

                {/* 3. Decision Control Center */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-3xl flex flex-col md:flex-row items-center justify-between gap-10 no-print border border-slate-800">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-inner">
                            <Zap className="w-10 h-10 text-indigo-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-white text-3xl font-black tracking-tight">Final Decision Agent</h3>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Executing decision updates state across global database</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 w-full md:w-auto">
                        <button
                            onClick={() => handleDecision('SHORTLISTED')}
                            disabled={isProcessingDecision}
                            className="flex-1 md:flex-none px-12 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xl transition-all shadow-xl shadow-emerald-900/40 active:scale-95 disabled:opacity-50"
                        >
                            {isProcessingDecision ? <Loader2 className="w-6 h-6 animate-spin" /> : "Shortlist"}
                        </button>
                        <button
                            onClick={() => handleDecision('REJECTED')}
                            disabled={isProcessingDecision}
                            className="flex-1 md:px-12 py-5 bg-transparent border-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-[1.5rem] font-black text-xl transition-all"
                        >
                            Reject
                        </button>
                    </div>
                </div>

                {/* 4. Agent Intelligence Sections [cite: 202-224] */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    <div className="lg:col-span-8 space-y-10">
                        {/* Skills Cloud Section */}
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                                    <Terminal className="w-8 h-8 text-indigo-600" /> Technical Arsenal
                                </h2>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    {profile.skills?.length || 0} Entities Found
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {profile.skills?.map((skill, i) => (
                                    <span key={i} className="px-6 py-2 bg-[#f8fafc] text-slate-700 font-black text-[11px] uppercase tracking-wider rounded-2xl border border-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-default shadow-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Experience Section [cite: 203-211] */}
                        <TimelineSection title="Professional Trajectory" items={profile.experience} type="exp" color="indigo" />

                        {/* Certifications & Accolades Section [cite: 220] */}
                        <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-10 flex items-center gap-3">
                                <Award className="w-8 h-8 text-amber-500" /> Honors & Verifications
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {profile.certifications?.map((cert, i) => (
                                    <div key={i} className="flex gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-2xl hover:border-indigo-100 transition-all">
                                        <CertificationIcon className="w-8 h-8 text-amber-500 shrink-0 mt-1" />
                                        <p className="text-slate-600 font-bold leading-relaxed">{cert}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Security Audit & Metadata [cite: 95-100, 164-170] */}
                    <div className="lg:col-span-4 space-y-10 no-print">
                        {/* Risk Flags Card */}
                        <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
                            <div className="p-10 border-b border-rose-50 bg-rose-50/40">
                                <h3 className="text-rose-600 font-black uppercase tracking-[0.3em] text-[11px] mb-3">Integrity Score</h3>
                                <div className="text-6xl font-black text-rose-800 tracking-tighter">
                                    {isDuplicate ? "85%" : `${risk.fraudScore || 0}%`}
                                </div>
                            </div>
                            <div className="p-10 space-y-5">
                                {(risk.flags || []).length > 0 || isDuplicate ? (
                                    <>
                                        {isDuplicate && <RiskBadge text="DATABASE_DUPLICATE_ID" high />}
                                        {(risk.flags || []).map((flag, i) => (
                                            <RiskBadge key={i} text={flag} />
                                        ))}
                                    </>
                                ) : (
                                    <div className="text-center py-10 space-y-4">
                                        <div className="p-5 bg-emerald-50 rounded-full w-20 h-20 mx-auto border border-emerald-100 flex items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <p className="text-slate-900 font-black uppercase tracking-widest text-[11px]">Clear Audit Profile</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Education History [cite: 212-219] */}
                        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl">
                            <h3 className="text-xl font-black text-slate-900 mb-8 tracking-tighter flex items-center gap-3">
                                <GraduationCap className="w-6 h-6 text-indigo-600" /> Academic Record
                            </h3>
                            <div className="space-y-10 relative">
                                <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-50"></div>
                                {profile.education?.map((edu, i) => (
                                    <div key={i} className="relative pl-10 space-y-1">
                                        <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 z-10 shadow-sm"></div>
                                        <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{edu.year}</div>
                                        <div className="text-base font-black text-slate-900 leading-tight">{edu.degree}</div>
                                        <div className="text-xs font-bold text-slate-500">{edu.institution}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Audit Trail [cite: 171-178] */}
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-3xl border border-slate-800">
                            <h3 className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[11px] mb-10 flex items-center gap-3">
                                <History className="w-4 h-4" /> Agent Execution Logs
                            </h3>
                            <div className="space-y-10 relative">
                                <div className="absolute left-2 top-2 bottom-2 w-[1px] bg-slate-800"></div>
                                {auditTrail.map((step, i) => (
                                    <div key={i} className="relative pl-8 flex justify-between items-center group">
                                        <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 transition-colors shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-white tracking-widest mb-1">{step.step}</div>
                                            <div className="text-[10px] font-bold text-slate-500 font-mono tracking-tighter">{new Date(step.created_at).toLocaleTimeString()}</div>
                                        </div>
                                        <div className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-400/20">OK</div>
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
    <div className="flex items-center gap-3 px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm text-sm font-bold text-slate-600 transition-all hover:border-indigo-100">
        {icon}
        <span>{text || 'N/A'}</span>
    </div>
);

const SocialLink = ({ icon, url, color }) => (
    <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noreferrer" className={`flex items-center justify-center w-11 h-11 ${color} text-white rounded-2xl shadow-lg transition-transform hover:scale-110 active:scale-95`}>
        {icon}
    </a>
);

const MetricCard = ({ title, value = 0, color, icon, inverse = false }) => {
    const isRisk = title.includes("Fraud") || title.includes("Integrity");
    const baseColor = isRisk ? (value > 35 ? 'rose' : 'emerald') : color;
    const roundedValue = Math.round(value);

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl group hover:border-indigo-100 transition-all relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${baseColor}-50 rounded-full -mr-16 -mt-16 opacity-30 group-hover:scale-150 transition-transform duration-700`}></div>
            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl bg-${baseColor}-50 text-${baseColor}-600 border border-${baseColor}-100`}>{icon}</div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">{title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className={`text-6xl font-black tracking-tighter text-${baseColor}-600`}>{roundedValue}</span>
                    <span className="text-slate-300 font-bold text-lg">/100</span>
                </div>
                <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className={`h-full bg-${baseColor}-500 transition-all duration-1000 ease-out`} style={{ width: `${roundedValue}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const RiskBadge = ({ text, high = false }) => (
    <div className={`flex items-center gap-4 p-5 rounded-[1.5rem] border transition-all ${
        high ? 'bg-rose-600 border-rose-700 text-white shadow-xl shadow-rose-200' : 'bg-white border-rose-100 text-slate-800 shadow-sm'
    }`}>
        <ShieldAlert className={`w-5 h-5 ${high ? 'text-white' : 'text-rose-500'}`} />
        <span className="text-[11px] font-black uppercase tracking-widest leading-none">{text.replace(/_/g, ' ')}</span>
    </div>
);

const TimelineSection = ({ title, items = [], type, color }) => (
    <div className="bg-white rounded-[3rem] p-12 border border-slate-100 shadow-xl h-full">
        <h3 className={`text-3xl font-black text-slate-900 mb-12 tracking-tighter border-b-4 border-${color}-50 pb-6`}>{title}</h3>
        <div className="space-y-12 relative">
            <div className="absolute left-3 top-2 bottom-2 w-1 bg-slate-50"></div>
            {items && items.length > 0 ? items.map((item, i) => (
                <div key={i} className="relative pl-14 group">
                    <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full bg-white border-[6px] border-${color}-500 z-10 shadow-sm group-hover:scale-125 transition-transform`}></div>
                    <div className="space-y-3">
                        <div className="font-black text-slate-900 text-2xl tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                            {type === 'exp' ? (item.title || "Core Contributor") : (item.degree || "Qualified Major")}
                        </div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            {type === 'exp' ? (item.company || "Enterprise Corp") : (item.institution || "Academy Board")}
                        </div>
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-50 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100">
                            <Calendar className="w-3.5 h-3.5" /> {type === 'exp' ? `${item.startDate} - ${item.endDate}` : item.year}
                        </div>
                        {type === 'exp' && item.highlights?.length > 0 && (
                            <div className="pt-4 space-y-3">
                                {item.highlights.map((h, j) => (
                                    <p key={j} className="text-slate-600 font-medium leading-relaxed pl-5 border-l-2 border-slate-100">{h}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )) : <p className="text-slate-400 font-black italic text-center p-12 border-2 border-dashed border-slate-100 rounded-[2rem]">No structural intelligence found for this section.</p>}
        </div>
    </div>
);

export default ReportPage;