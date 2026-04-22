import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
    Timer, LayoutGrid, Calendar, LogOut, X, 
    CheckCircle2, Clock, AlertCircle, Coffee, BookOpen,
    MapPin, Trash2, Sun, Moon, Users
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOTS = [
    { id: 0, time: '09:00 AM – 10:00 AM' },
    { id: 1, time: '10:15 AM – 11:15 AM' },
    { id: 2, time: '11:15 AM – 12:15 PM' },
    { id: 3, time: '01:15 PM – 02:15 PM' },
    { id: 4, time: '02:15 PM – 03:15 PM' },
    { id: 5, time: '03:30 PM – 04:30 PM' },
    { id: 6, time: '04:30 PM – 05:30 PM' }
];

const STATUS_CONFIG = {
    'LECTURE': { label: 'In Lecture', color: 'bg-red-500', text: 'text-white', icon: BookOpen },
    'LAB': { label: 'In Lab', color: 'bg-amber-500', text: 'text-white', icon: Coffee },
    'AVAILABLE': { label: 'Available', color: 'bg-emerald-500', text: 'text-white', icon: CheckCircle2 },
    'BUSY': { label: 'Busy', color: 'bg-purple-600', text: 'text-white', icon: AlertCircle },
    'LEAVE': { label: 'On Leave', color: 'bg-slate-900', text: 'text-white', icon: X },
};

const ProfessorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timetable, setTimetable] = useState([]);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly'
    const [showStatusModal, setShowStatusModal] = useState(null);

    // Get current day of week (0-6)
    const getTodayDay = () => {
        return new Date().getDay(); 
    };
    const todayDay = getTodayDay();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [timeRes, statusRes] = await Promise.all([
                axios.get(`/api/professors/timetable/${user.id}`),
                axios.get(`/api/professors/status/${user.id}`)
            ]);
            setTimetable(timeRes.data);
            setOverrides(statusRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        try {
            await axios.post('/api/professors/status', {
                professor_id: user.id,
                day_of_week: showStatusModal.day,
                slot_id: showStatusModal.slot,
                status
            });
            setShowStatusModal(null);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleMarkLeave = async () => {
        if (!window.confirm("Mark yourself on leave for the entire day?")) return;
        try {
            await axios.post('/api/professors/leave', {
                professor_id: user.id,
                days: [todayDay]
            });
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getSlotStatus = (day, slotId) => {
        const override = overrides.find(o => o.day_of_week === day && o.slot_id === slotId);
        if (override) return override.status;
        
        const entry = timetable.find(e => e.day_of_week === day && (e.start_slot === slotId || (e.session_type === 'LAB' && e.start_slot === slotId - 1)));
        if (entry) return entry.session_type;
        
        return 'AVAILABLE';
    };

    const getTimetableEntry = (day, slotId) => {
        return timetable.find(e => e.day_of_week === day && (e.start_slot === slotId || (e.session_type === 'LAB' && e.start_slot === slotId - 1)));
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4 transition-colors" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Syncing Portal...</p>
        </div>
    );

    return (
        <div className="min-h-screen pb-20 transition-colors duration-300 font-sans" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            {/* Header */}
            <header className="border-b px-4 md:px-6 py-4 md:py-6 sticky top-0 z-30 shadow-sm flex justify-between items-center backdrop-blur-md transition-colors duration-300" style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Calendar size={24} className="md:w-7 md:h-7" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg md:text-2xl font-black tracking-tight leading-none" style={{ color: 'var(--text-primary)' }}>
                                <span className="hidden xs:inline">Professor </span>Portal
                            </h1>
                            <p className="font-bold text-[10px] md:text-xs mt-0.5 md:mt-1 uppercase tracking-wider truncate max-w-[120px] md:max-w-none" style={{ color: 'var(--text-secondary)' }}>{user.name}</p>
                        </div>
                    </div>

                    <div className="h-10 w-px hidden lg:block" style={{ backgroundColor: 'var(--border-primary)' }}></div>

                    <div className="hidden lg:flex flex-col">
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                            <Clock size={12} />
                            <span>System Live Status</span>
                        </div>
                        <div className="font-black text-xs" style={{ color: 'var(--text-primary)' }}>
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            <span className="mx-2" style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>|</span>
                            <span style={{ color: 'var(--accent-primary)' }}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-1.5 md:gap-2">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 md:p-3 rounded-xl transition-all active:scale-95 border"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                        {theme === 'light' ? <Moon size={20} className="md:w-5 md:h-5" /> : <Sun size={20} className="md:w-5 md:h-5" />}
                    </button>
                    <button 
                        onClick={handleMarkLeave}
                        className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 bg-slate-900 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
                    >
                        <Users size={16} className="md:w-[18px] md:h-[18px]" /> 
                        <span className="hidden xs:inline">Mark Leave</span>
                        <span className="xs:hidden">Leave</span>
                    </button>
                    <button 
                        onClick={logout}
                        className="p-2 md:p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95 dark:bg-red-900/20 dark:text-red-400"
                    >
                        <LogOut size={18} className="md:w-5 md:h-5" />
                    </button>
                </div>
            </header>

            <nav className="max-w-2xl mx-auto mt-6 md:mt-8 px-4">
                <div className="p-1 rounded-2xl flex gap-1 shadow-inner border transition-colors duration-300" style={{ backgroundColor: 'var(--border-secondary)', borderColor: 'var(--border-primary)' }}>
                    <button 
                        onClick={() => setActiveTab('today')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'today' ? 'shadow-md' : 'hover:opacity-80'}`}
                        style={{ 
                            backgroundColor: activeTab === 'today' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'today' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <Timer size={16} className="md:w-[18px] md:h-[18px]" /> 
                        <span className="hidden xs:inline">Today's Schedule</span>
                        <span className="xs:hidden">Today</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'weekly' ? 'shadow-md' : 'hover:opacity-80'}`}
                        style={{ 
                            backgroundColor: activeTab === 'weekly' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'weekly' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <LayoutGrid size={16} className="md:w-[18px] md:h-[18px]" /> 
                        <span className="hidden xs:inline">Weekly View</span>
                        <span className="xs:hidden">Weekly</span>
                    </button>
                </div>
            </nav>

            {/* Status Legend */}
            <div className="max-w-4xl mx-auto mt-4 md:mt-6 px-4 md:px-8">
                <div className="backdrop-blur-sm border rounded-2xl p-3 md:p-4 flex flex-wrap justify-center items-center gap-3 md:gap-6 shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-1.5 md:gap-2">
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${config.color} shadow-sm`}></div>
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{config.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                {activeTab === 'today' ? (
                    (todayDay === 0 || todayDay === 6) ? (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-indigo-100/50" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                                <Calendar size={64} className="opacity-80" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Today is a Holiday</h2>
                                <p className="font-bold uppercase tracking-[0.3em] text-xs" style={{ color: 'var(--text-secondary)' }}>Recharge for the upcoming week</p>
                            </div>
                            
                            <div className="max-w-md p-10 rounded-[3rem] shadow-2xl border relative overflow-hidden group transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                                <div className="mb-6 flex justify-center" style={{ color: 'var(--accent-primary)' }}>
                                    <BookOpen size={40} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <p className="text-xl font-black leading-relaxed italic" style={{ color: 'var(--text-primary)' }}>
                                    "Education is the most powerful weapon which you can use to change the world."
                                </p>
                                <div className="mt-6 text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>— Nelson Mandela</div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-4">
                                <h2 className="text-xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{DAYS[todayDay]}</h2>
                                <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>Live Status</span>
                            </div>
                            
                            <div className="grid gap-3 md:gap-4">
                                {SLOTS.map(slot => {
                                    const status = getSlotStatus(todayDay, slot.id);
                                    const entry = getTimetableEntry(todayDay, slot.id);
                                    const config = STATUS_CONFIG[status];
                                    const StatusIcon = config.icon;

                                    return (
                                        <div 
                                            key={slot.id}
                                            onClick={() => setShowStatusModal({ day: todayDay, slot: slot.id, currentStatus: status })}
                                            className="rounded-2xl md:rounded-[2rem] p-3 md:p-5 shadow-lg border flex items-center gap-3 md:gap-6 cursor-pointer hover:border-indigo-200 transition-all group active:scale-[0.98]"
                                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                        >
                                            <div className="w-16 md:w-24 text-center border-r-2 pr-3 md:pr-6 space-y-0.5 md:space-y-1" style={{ borderColor: 'var(--border-secondary)' }}>
                                                <div className="text-[9px] md:text-xs font-black leading-none" style={{ color: 'var(--text-primary)' }}>{slot.time.split(' – ')[0]}</div>
                                                <div className="font-black text-xs md:text-base" style={{ color: 'var(--accent-primary)' }}>-</div>
                                                <div className="text-[9px] md:text-xs font-black leading-none" style={{ color: 'var(--text-primary)' }}>{slot.time.split(' – ')[1]}</div>
                                            </div>
                                            
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${config.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                                <StatusIcon size={20} className="md:w-6 md:h-6" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col xs:flex-row xs:items-center gap-1 md:gap-2">
                                                    <h3 className="font-black text-sm md:text-lg tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                                        {entry ? entry.subject : config.label}
                                                    </h3>
                                                    {entry && (
                                                        <div className="flex gap-1 items-center">
                                                            <span className="px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest whitespace-nowrap" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}>
                                                                {entry.year} • {entry.division}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded-md text-[7px] md:text-[8px] font-black uppercase tracking-widest ${
                                                                entry.session_type === 'LAB' ? 'bg-amber-100 text-amber-600' : 
                                                                entry.session_type === 'LECTURE' ? 'bg-indigo-100 text-indigo-600' : 
                                                                'bg-emerald-100 text-emerald-600'
                                                            }`}>
                                                                {entry.session_type}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 md:gap-1.5 font-bold text-[8px] md:text-[10px] mt-0.5 md:mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    <MapPin size={10} className="md:w-3 md:h-3" /> 
                                                    <span className="truncate">{entry ? entry.location : 'Campus'}</span>
                                                </div>
                                            </div>

                                            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[7px] md:text-[10px] uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-all ${config.color} ${config.text} shrink-0`}>
                                                Update
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                ) : (
                        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {DAYS.map((day, dayIdx) => (
                                <div key={day} className="space-y-3 md:space-y-4">
                                    <h3 className="text-xl md:text-2xl font-black tracking-tight px-2 md:px-4" style={{ color: 'var(--text-primary)' }}>{day}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
                                        {SLOTS.map(slot => {
                                            const status = getSlotStatus(dayIdx, slot.id);
                                            const entry = getTimetableEntry(dayIdx, slot.id);
                                            const config = STATUS_CONFIG[status];
                                            
                                            return (
                                                <div 
                                                    key={slot.id}
                                                    onClick={() => setShowStatusModal({ day: dayIdx, slot: slot.id, currentStatus: status })}
                                                    className={`rounded-xl md:rounded-2xl p-2 md:p-3 border shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group relative ${config.color} border-white/10`}
                                                >
                                                    <div className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white/60 mb-1">
                                                        {slot.time.split(' – ')[0]}
                                                    </div>
                                                    <div className="font-black text-[9px] md:text-[11px] leading-tight text-white truncate">
                                                        {entry ? entry.subject : config.label}
                                                    </div>
                                                    <div className="text-[7px] md:text-[8px] font-bold text-white/50 mt-0.5 truncate">
                                                        {entry ? entry.location : 'Campus'}
                                                    </div>
                                                    
                                                    {entry && (
                                                        <div className="absolute -top-1.5 -right-1.5 px-1 py-0.5 rounded-md text-[6px] font-black uppercase tracking-tighter bg-white text-indigo-600 shadow-sm border border-indigo-100">
                                                            {entry.session_type === 'LECTURE' ? 'LEC' : 'LAB'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                )}
            </main>

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="p-6 md:p-8 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                            <div>
                                <h3 className="font-black text-lg md:text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Update Status</h3>
                                <div className="mt-1 font-bold text-[9px] md:text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                                    {DAYS[showStatusModal.day]} • <span style={{ color: 'var(--text-primary)' }}>{SLOTS[showStatusModal.slot].time}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowStatusModal(null)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm dark:bg-slate-800 dark:hover:text-slate-100">
                                <X size={18} className="md:w-5 md:h-5" />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 gap-3">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                const StatusIcon = config.icon;
                                const isCurrent = showStatusModal.currentStatus === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusUpdate(key)}
                                        className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] border-2 ${isCurrent ? 'border-indigo-600' : 'border-transparent'}`}
                                        style={{ backgroundColor: isCurrent ? 'var(--accent-soft)' : 'var(--bg-main)' }}
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-white shadow-lg`}>
                                            <StatusIcon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-sm" style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{config.label}</div>
                                            <div className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>Set current slot availability</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorDashboard;
