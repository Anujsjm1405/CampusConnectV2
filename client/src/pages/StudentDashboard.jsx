import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
    LogOut, Sun, Moon, Calendar, Clock, 
    User, Search, GraduationCap, MapPin, 
    CheckCircle2, XCircle, AlertCircle, RefreshCw,
    Timer, Coffee, Users, BookOpen, Award,
    Check
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const SLOTS = [
    { id: 0, time: '09:00 AM – 10:00 AM' },
    { id: 1, time: '10:15 AM – 11:15 AM' },
    { id: 2, time: '11:15 AM – 12:15 PM' },
    { id: 3, time: '01:15 PM – 02:15 PM' },
    { id: 4, time: '02:15 PM – 03:15 PM' },
    { id: 5, time: '03:30 PM – 04:30 PM' },
    { id: 6, time: '04:30 PM – 05:30 PM' }
];

const StudentDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [professors, setProfessors] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('FACULTY');
    const [scheduleSubTab, setScheduleSubTab] = useState('TODAY');

    const isCollegeHours = () => {
        const day = currentTime.getDay();
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        if (day === 0 || day === 6) return false;
        return nowMinutes >= 540 && nowMinutes < 1050;
    };

    const getCurrentDayIdx = () => {
        const day = currentTime.getDay();
        return day === 0 ? 6 : day - 1;
    };

    const getCurrentSlotIdx = () => {
        const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        return SLOTS.findIndex(s => {
            const [start, end] = s.time.split(' – ');
            const [shm, sampm] = start.split(' ');
            const [ehm, eampm] = end.split(' ');
            let [sh, sm] = shm.split(':');
            let [eh, em] = ehm.split(':');
            let startM = parseInt(sh) * 60 + parseInt(sm);
            if (sampm === 'PM' && sh !== '12') startM += 720;
            if (sampm === 'AM' && sh === '12') startM -= 720;
            let endM = parseInt(eh) * 60 + parseInt(em);
            if (eampm === 'PM' && eh !== '12') endM += 720;
            if (eampm === 'AM' && eh === '12') endM -= 720;
            return nowMinutes >= startM && nowMinutes < endM;
        });
    };

    useEffect(() => {
        const socket = io('http://localhost:5000', { withCredentials: true });
        socket.on('status-update', (data) => {
            const currentDay = getCurrentDayIdx() + 1;
            const currentSlot = getCurrentSlotIdx();
            if (data.day_of_week === currentDay && data.slot_id === currentSlot) {
                setProfessors(prev => prev.map(p => 
                    p.id === data.professor_id ? { ...p, status: data.status } : p
                ));
            }
        });
        fetchData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => {
            socket.disconnect();
            clearInterval(timer);
        };
    }, []);

    useEffect(() => {
        fetchData();
    }, [getCurrentDayIdx(), getCurrentSlotIdx()]);

    const fetchData = async () => {
        try {
            const day = getCurrentDayIdx() + 1;
            const slot = getCurrentSlotIdx();
            const [profRes, timeRes] = await Promise.all([
                axios.get(`/api/students/professors-status?day=${day}&slot=${slot}`),
                axios.get('/api/students/timetable')
            ]);
            setProfessors(profRes.data);
            setTimetable(timeRes.data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusInfo = (status) => {
        if (!isCollegeHours()) return { icon: <Coffee size={14} />, color: '#94a3b8', label: 'Off-Campus', vibrant: 'bg-slate-500' };
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return { icon: <CheckCircle2 size={14} />, color: '#10b981', label: 'Available', vibrant: 'bg-emerald-500' };
            case 'BUSY': return { icon: <AlertCircle size={14} />, color: '#f59e0b', label: 'Busy', vibrant: 'bg-amber-500' };
            case 'LEAVE': return { icon: <XCircle size={14} />, color: '#ef4444', label: 'On Leave', vibrant: 'bg-red-500' };
            default: return { icon: <RefreshCw size={14} />, color: '#10b981', label: 'Available', vibrant: 'bg-emerald-500' };
        }
    };

    const currentDayIdx = getCurrentDayIdx();
    const currentSlotIdx = getCurrentSlotIdx();
    const inCollege = isCollegeHours();

    const assignedProfIds = new Set(timetable.map(t => t.professor_id));
    const semesterProfs = professors.filter(p => assignedProfIds.has(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const departmentalProfs = professors.filter(p => !assignedProfIds.has(p.id) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getEntryAt = (dayIdx, slotIdx) => {
        return timetable.find(t => t.day_of_week === (dayIdx + 1) && 
            (t.start_slot === slotIdx || (t.session_type === 'LAB' && t.start_slot === slotIdx - 1))
        );
    };

    const getFullDailySchedule = (dayIdx) => {
        return SLOTS.map(slot => {
            const lecture = getEntryAt(dayIdx, slot.id);
            return lecture ? { ...lecture, isFree: false } : { start_slot: slot.id, isFree: true };
        });
    };

    const todayFullSchedule = getFullDailySchedule(currentDayIdx);

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center space-y-6 bg-slate-950">
            <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="font-black text-2xl tracking-tighter text-white animate-pulse">CAMPUS_CONNECT.SYS</div>
        </div>
    );

    const glassStyle = {
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
    };

    const ProfCard = ({ prof, isSemester }) => {
        const status = getStatusInfo(prof.status);
        const assignedSubjects = isSemester 
            ? [...new Set(timetable.filter(t => t.professor_id === prof.id).map(t => t.subject))]
            : [];

        return (
            <div className="group p-4 md:p-6 rounded-[2rem] transition-all hover:scale-[1.02] relative overflow-hidden h-full flex flex-col justify-between" style={glassStyle}>
                <div className={`absolute top-0 right-0 w-20 h-20 ${status.vibrant} opacity-10 blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
                <div>
                    <div className="flex items-start justify-between mb-4 relative">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shadow-inner">
                            <User size={24} />
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg" 
                             style={{ backgroundColor: status.color, color: 'white' }}>
                            {status.icon} {status.label}
                        </div>
                    </div>
                    <div className="relative mb-3">
                        <h3 className="font-black text-lg leading-tight mb-0.5 truncate" style={{ color: 'var(--text-primary)' }}>{prof.name}</h3>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 truncate" style={{ color: 'var(--text-secondary)' }}>{prof.designation || 'Assistant Professor'}</p>
                    </div>
                </div>
                {isSemester && assignedSubjects.length > 0 && (
                    <div className="relative mt-auto pt-3 border-t border-white/5">
                        <div className="flex flex-wrap gap-1.5">
                            {assignedSubjects.map((sub, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-500 text-[8px] font-black uppercase tracking-tighter">
                                    {sub}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden transition-colors duration-500 pb-10" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <header className="sticky top-0 z-[100] border-b backdrop-blur-3xl" style={{ backgroundColor: 'rgba(var(--bg-card-rgb), 0.5)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg transform rotate-3">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h1 className="font-black text-lg md:text-xl tracking-tighter" style={{ color: 'var(--text-primary)' }}>Campus<span className="text-indigo-500">Connect</span></h1>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500/60">{user.year} {user.division}</span>
                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded uppercase">{user.batch}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 rounded-xl border transition-all active:scale-90" style={{ ...glassStyle }}>
                            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        <button onClick={logout} className="p-2 rounded-xl border transition-all hover:text-red-500" style={{ ...glassStyle }}>
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-4 md:pt-6 space-y-6">
                <section className="p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden group shadow-xl" style={glassStyle}>
                    <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-[60px] -mr-30 -mt-30 group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                    <div className="relative flex items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </h2>
                            <p className="font-black text-sm opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                {currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${inCollege ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'}`}>
                                {inCollege ? '• Campus Active' : '• Off Hours'}
                            </span>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                                <Clock size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{currentSlotIdx !== -1 ? SLOTS[currentSlotIdx].time.split(' – ')[0] : "Break"}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="flex gap-2 p-1.5 rounded-2xl border sticky top-20 z-50 shadow-lg" style={{ ...glassStyle }}>
                    <button 
                        onClick={() => setActiveTab('FACULTY')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === 'FACULTY' ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                    >
                        <Users size={16} /> FACULTY
                    </button>
                    <button 
                        onClick={() => setActiveTab('SCHEDULE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[10px] transition-all ${activeTab === 'SCHEDULE' ? 'bg-indigo-600 text-white shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                    >
                        <Calendar size={16} /> SCHEDULE
                    </button>
                </div>

                {activeTab === 'FACULTY' ? (
                    <div className="space-y-8">
                        <div className="relative max-w-md mx-auto">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" size={16} />
                            <input 
                                placeholder="Search faculty..."
                                className="w-full pl-12 pr-6 py-3.5 text-sm rounded-2xl border-2 outline-none focus:border-indigo-500 transition-all shadow-inner"
                                style={{ ...glassStyle, background: 'rgba(255,255,255,0.08)' }}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <section>
                            <h2 className="font-black text-xl mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <BookOpen size={20} className="text-indigo-500" /> Semester Faculty
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                {semesterProfs.length > 0 ? semesterProfs.map(prof => <ProfCard key={prof.id} prof={prof} isSemester={true} />) : <div className="col-span-full p-8 text-center rounded-2xl border-2 border-dashed opacity-20">No faculty found</div>}
                            </div>
                        </section>

                        <section>
                            <h2 className="font-black text-xl mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <Users size={20} className="text-purple-500" /> Dept. Faculty
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                {departmentalProfs.map(prof => <ProfCard key={prof.id} prof={prof} isSemester={false} />)}
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex gap-4 border-b border-white/5 pb-2">
                            {['TODAY', 'WEEKLY'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setScheduleSubTab(t)}
                                    className={`pb-2 px-2 font-black text-[10px] tracking-widest transition-all relative ${scheduleSubTab === t ? 'text-indigo-500' : 'opacity-40'}`}
                                >
                                    {t === 'TODAY' ? "TODAY'S PLAN" : "WEEKLY MATRIX"}
                                    {scheduleSubTab === t && <div className="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-full"></div>}
                                </button>
                            ))}
                        </div>

                        {scheduleSubTab === 'TODAY' ? (
                            <div className="grid grid-cols-1 gap-3">
                                {todayFullSchedule.map((lecture, idx) => {
                                    const isNow = currentSlotIdx === lecture.start_slot && inCollege;
                                    const isLab = lecture.session_type === 'LAB';
                                    const isFree = lecture.isFree;
                                    const cardColor = isFree ? 'border-emerald-500/30' : (isLab ? 'border-amber-500/30' : 'border-red-500/30');
                                    const accentBg = isFree ? 'bg-emerald-500/10 text-emerald-500' : (isLab ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500');
                                    const accentSolid = isFree ? 'bg-emerald-500' : (isLab ? 'bg-amber-500' : 'bg-red-500');

                                    return (
                                        <div key={idx} className={`group relative p-4 md:p-6 rounded-3xl border-2 transition-all ${cardColor} ${isNow ? 'ring-4 ring-indigo-500/10 scale-[1.01]' : ''}`} style={glassStyle}>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${accentBg}`}>
                                                        {isFree ? <Check size={20} /> : <Clock size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">{SLOTS[lecture.start_slot || idx].time}</p>
                                                        <h3 className={`font-black text-base md:text-xl tracking-tight ${isNow ? 'text-indigo-500' : ''}`}>
                                                            {isFree ? 'FREE SLOT' : lecture.subject}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {isFree ? (
                                                        <span className="text-[9px] font-black px-2 py-1 rounded-lg bg-emerald-500 text-white uppercase tracking-widest">Available</span>
                                                    ) : (
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg text-white uppercase tracking-widest ${accentSolid}`}>{lecture.session_type}</span>
                                                            <p className="text-[10px] font-bold opacity-40 flex items-center gap-1 justify-end"><User size={12} /> {lecture.professor_name?.split(' ')[0]}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isNow && <div className="absolute -top-2 right-6 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Ongoing</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="overflow-x-auto pb-4 custom-scrollbar">
                                <div className="min-w-[800px] p-4 rounded-3xl" style={glassStyle}>
                                    <table className="w-full border-separate border-spacing-2">
                                        <thead>
                                            <tr>
                                                <th className="p-3 text-[9px] font-black uppercase tracking-widest opacity-40">Time</th>
                                                {DAYS.map(day => <th key={day} className="p-3 text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>{day}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SLOTS.map(slot => (
                                                <tr key={slot.id}>
                                                    <td className="p-3 rounded-xl bg-white/5 text-center min-w-[120px]">
                                                        <p className="text-[10px] font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>{slot.time.split(' – ')[0]}</p>
                                                    </td>
                                                    {DAYS.map((day, dIdx) => {
                                                        const lecture = getEntryAt(dIdx, slot.id);
                                                        const isLab = lecture?.session_type === 'LAB';
                                                        const colorClass = lecture ? (isLab ? 'bg-amber-500/20 text-amber-600' : 'bg-red-500/20 text-red-600') : 'bg-emerald-500/10 text-emerald-600';
                                                        
                                                        return (
                                                            <td key={day} className={`p-3 rounded-xl transition-all relative min-h-[60px] text-center ${colorClass}`}>
                                                                {lecture ? (
                                                                    <div className="space-y-1">
                                                                        <p className="font-black text-[10px] leading-tight tracking-tighter">{lecture.subject}</p>
                                                                        <p className="text-[8px] font-bold opacity-60 truncate">{lecture.professor_name?.split(' ')[0]}</p>
                                                                    </div>
                                                                ) : <Check size={14} className="mx-auto opacity-30" />}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style>{`
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(79,70,229,0.2); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default StudentDashboard;
