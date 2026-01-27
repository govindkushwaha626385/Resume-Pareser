import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Users, Trophy, ArrowRight, Briefcase, 
  FileText, Loader2, Mail, Calendar, Search, Plus, X, 
  PlusCircle, ShieldAlert, Zap, Filter, Fingerprint, TrendingUp,
  Target, Layers, ChevronDown
} from 'lucide-react';

const DashboardPage = () => {
  // --- State Management ---
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Complete state mapping for the Job Schema (Core Requirement)
  const [newJob, setNewJob] = useState({
    id: '', title: '', jd_text: '',
    must_have_skills: '', good_to_have_skills: '',
    min_exp_years: '', max_exp_years: ''
  });

  // --- 1. Fetch Active Job Openings ---
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const res = await axios.get('http://localhost:8080/hr/resume/jobs');
      setJobs(res.data);
      if (res.data.length > 0 && !selectedJobId) {
        setSelectedJobId(res.data[0].id);
      }
    } catch (err) {
      console.error("Fetch Jobs Error:", err);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  // --- 2. Fetch Ranked Candidates for selected Job ---
  useEffect(() => {
    if (!selectedJobId) return;
    const fetchCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const res = await axios.get(`http://localhost:8080/hr/resume/jobs/${selectedJobId}/candidates`);
        setCandidates(res.data);
      } catch (err) {
        console.error("Fetch Candidates Error:", err);
      } finally {
        setIsLoadingCandidates(false);
      }
    };
    fetchCandidates();
  }, [selectedJobId]);

  // --- 3. Add Job Logic (Deterministic Mapping) ---
  const handleAddJob = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Mandatory: Format skills into Arrays for the AI Matching Agent
      const formattedJob = {
        ...newJob,
        must_have_skills: newJob.must_have_skills.split(',').map(s => s.trim()).filter(s => s),
        good_to_have_skills: newJob.good_to_have_skills.split(',').map(s => s.trim()).filter(s => s),
        min_exp_years: parseInt(newJob.min_exp_years || 0),
        max_exp_years: parseInt(newJob.max_exp_years || 10)
      };
      await axios.post('http://localhost:8080/hr/resume/jobs', formattedJob);
      setIsModalOpen(false);
      // Reset state
      setNewJob({ id: '', title: '', jd_text: '', must_have_skills: '', good_to_have_skills: '', min_exp_years: '', max_exp_years: '' });
      fetchJobs();
    } catch (err) {
      alert("System Error: Failed to publish job opening to the pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-500';
    if (score >= 60) return 'text-amber-600 bg-amber-500';
    return 'text-rose-600 bg-rose-500';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-indigo-600 selection:text-white">
      
      {/* Navigation Bar */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-2.5 rounded-2xl text-white shadow-xl">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span className="font-black text-2xl tracking-tighter text-slate-900 uppercase">Recruit.AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm">
              <PlusCircle className="w-4 h-4 inline mr-2" /> Post New Job
            </button>
            <Link to="/upload" className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
              <FileText className="w-4 h-4 inline mr-2" /> Process Resume
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-12">
        
        {/* Header and Job Selector */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-none uppercase">Leaderboard</h1>
            <p className="text-slate-500 font-bold uppercase text-[11px] tracking-[0.3em] ml-1">Real-time ranking based on Must-Have Skill weights & Fraud Audits</p>
          </div>

          <div className="w-full lg:w-[450px] space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Filter className="w-3 h-3" /> Targeted Opportunity Profile
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400">
                <Briefcase className="h-5 w-5 group-hover:text-indigo-600 transition-colors" />
              </div>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] py-5 pl-14 pr-12 text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-xs uppercase tracking-widest shadow-2xl appearance-none cursor-pointer hover:border-indigo-400 transition-all"
              >
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title} — ({job.id})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <StatsCard title="Total Applications" value={candidates.length} icon={<Users />} color="indigo" />
           <StatsCard title="Shortlist Candidates" value={candidates.filter(c => c.score >= 75).length} icon={<Trophy />} color="emerald" />
           <StatsCard title="High Risk Alerts" value={candidates.filter(c => c.score < 40).length} icon={<ShieldAlert />} color="rose" />
        </div>

        {/* Candidate Table Area */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600"></div>
          
          {isLoadingCandidates ? (
            <div className="py-40 flex flex-col items-center justify-center space-y-6">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              <p className="font-black text-slate-400 tracking-[0.3em] uppercase text-xs">Analyzing Pipeline Data...</p>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-32 flex flex-col items-center text-center">
              <div className="bg-slate-50 p-10 rounded-full text-slate-200 mb-8"><Users className="w-16 h-16" /></div>
              <h3 className="text-3xl font-black tracking-tighter">Zero Candidates Found</h3>
              <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Upload a resume to begin AI scoring</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <th className="px-12 py-8">Intelligence Rank</th>
                    <th className="px-8 py-8">Profile Details</th>
                    <th className="px-8 py-8 text-center">AI Scoring</th>
                    <th className="px-8 py-8">Logistics State</th>
                    <th className="px-12 py-8 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {candidates.map((candidate, index) => {
                    const scoreStyle = getScoreColor(candidate.score);
                    const isTop3 = index < 3;
                    return (
                      <tr key={candidate.candidateId} className="group hover:bg-indigo-50/30 transition-all duration-300">
                        <td className="px-12 py-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transition-transform group-hover:scale-110 ${
                              isTop3 ? 'bg-indigo-600 text-white rotate-3' : 'bg-slate-100 text-slate-400'}`}>
                            {isTop3 ? <Trophy className="w-7 h-7" /> : index + 1}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-black text-slate-900 text-xl tracking-tight leading-none mb-2">{candidate.name}</div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> {candidate.email}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3" /> Received: {candidate.uploadedAt}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                             <div className={`text-4xl font-black tracking-tighter ${scoreStyle.split(' ')[0]}`}>{Math.round(candidate.score)}%</div>
                             <div className="w-24 h-2 bg-slate-100 rounded-full mt-2 mx-auto overflow-hidden border border-slate-200">
                                <div className={`h-full ${scoreStyle.split(' ')[1]} transition-all duration-1000`} style={{ width: `${candidate.score}%` }}></div>
                             </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border transition-colors ${
                              candidate.status === 'SHORTLISTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              candidate.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-12 py-6 text-right">
                          <Link to={`/report/${candidate.candidateId}`} className="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black hover:shadow-2xl transition-all hover:-translate-x-1">
                            <Search className="w-4 h-4" /> Open Report
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* --- Complete New Job Modal (Mandatory Fields) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-3xl border border-white p-12 relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 p-3 bg-slate-50 rounded-full hover:bg-slate-100 transition-all"><X className="w-6 h-6 text-slate-400" /></button>
              <h2 className="text-4xl font-black tracking-tighter mb-8 uppercase">Publish Opportunity</h2>
              
              <form onSubmit={handleAddJob} className="space-y-6">
                 {/* ID and Title */}
                 <div className="grid grid-cols-2 gap-6">
                    <InputField label="JOB ID" placeholder="JOB-101" onChange={v => setNewJob({...newJob, id: v})} />
                    <InputField label="TITLE" placeholder="Lead Product Designer" onChange={v => setNewJob({...newJob, title: v})} />
                 </div>

                 {/* Experience Range */}
                 <div className="grid grid-cols-2 gap-6">
                    <InputField label="MIN EXPERIENCE (YRS)" type="number" placeholder="2" onChange={v => setNewJob({...newJob, min_exp_years: v})} />
                    <InputField label="MAX EXPERIENCE (YRS)" type="number" placeholder="10" onChange={v => setNewJob({...newJob, max_exp_years: v})} />
                 </div>

                 {/* Skills Breakdown (Mandatory for AI Matching) */}
                 <div className="space-y-6">
                    <InputField label="MUST-HAVE SKILLS" placeholder="React, Node.js, Python (comma separated)" onChange={v => setNewJob({...newJob, must_have_skills: v})} />
                    <InputField label="GOOD-TO-HAVE SKILLS" placeholder="Docker, AWS, TypeScript" onChange={v => setNewJob({...newJob, good_to_have_skills: v})} />
                 </div>

                 {/* JD Text */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Requirements (JD)</label>
                    <textarea required placeholder="Paste full job description text here..." rows="4" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition-all" onChange={e => setNewJob({...newJob, jd_text: e.target.value})} />
                 </div>

                 <button disabled={isSubmitting} className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-indigo-700 transition-all flex justify-center items-center gap-4">
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><TrendingUp className="w-6 h-6" /> SAVE OPPORTUNITY</>}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Specialized Components ---

const StatsCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl flex items-center gap-6 group hover:border-indigo-100 transition-all">
        <div className={`p-5 bg-${color}-50 rounded-3xl text-${color}-600 group-hover:scale-110 transition-transform`}>{icon}</div>
        <div>
            <h4 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
        </div>
    </div>
);

const InputField = ({ label, placeholder, type="text", onChange }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <input required type={type} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-black tracking-tight transition-all" />
    </div>
);

export default DashboardPage;