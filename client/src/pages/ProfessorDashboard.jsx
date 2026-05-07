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
    'LECTURE': { label: 'In Lecture', color: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500', icon: BookOpen },
    'LAB': { label: 'In Lab', color: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500', icon: Coffee },
    'AVAILABLE': { label: 'Available', color: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', icon: CheckCircle2 },
    'BUSY': { label: 'Busy', color: 'bg-violet-500/10 border-violet-500/20', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500', icon: AlertCircle },
    'LEAVE': { label: 'On Leave', color: 'bg-slate-900/10 border-slate-900/20', text: 'text-slate-900 dark:text-slate-100', dot: 'bg-slate-900 dark:bg-slate-100', icon: X },
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
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly' | 'locations'
    const [showStatusModal, setShowStatusModal] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveData, setLeaveData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        slotIds: []
    });
    const [liveLocations, setLiveLocations] = useState([]);

    // Get current day of week (0-6)
    const getTodayDay = () => {
        return new Date().getDay(); 
    };
    const todayDay = getTodayDay();

    const getCurrentSlotId = (time) => {
        const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        if (timeStr >= '09:00' && timeStr < '10:00') return 0;
        if (timeStr >= '10:15' && timeStr < '11:15') return 1;
        if (timeStr >= '11:15' && timeStr < '12:15') return 2;
        if (timeStr >= '13:15' && timeStr < '14:15') return 3;
        if (timeStr >= '14:15' && timeStr < '15:15') return 4;
        if (timeStr >= '15:30' && timeStr < '16:30') return 5;
        if (timeStr >= '16:30' && timeStr < '17:30') return 6;
        return -1;
    };

    const fetchLocations = async () => {
        try {
            const slotId = getCurrentSlotId(currentTime);
            const res = await axios.get(`/api/locations/live-status?day_of_week=${todayDay}&slot_id=${slotId}`);
            setLiveLocations(res.data);
        } catch (err) {
            console.error('Failed to fetch locations', err);
        }
    };

    useEffect(() => {
        if (activeTab === 'locations') {
            fetchLocations();
        }
    }, [activeTab, Math.floor(currentTime.getTime() / 60000)]); // re-run once a minute

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
                status: status === 'DEFAULT' ? null : status
            });
            setShowStatusModal(null);
            fetchData();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleApplyLeave = async () => {
        try {
            if (!leaveData.startDate || !leaveData.endDate) {
                alert("Please select both start and end dates");
                return;
            }
            await axios.post('/api/professors/leave', {
                professor_id: user.id,
                startDate: leaveData.startDate,
                endDate: leaveData.endDate,
                slotIds: leaveData.slotIds
            });
            setShowLeaveModal(false);
            fetchData();
            alert('Leave applied successfully');
        } catch (err) {
            alert('Failed to apply leave');
        }
    };

    const toggleLeaveSlot = (id) => {
        setLeaveData(prev => ({
            ...prev,
            slotIds: prev.slotIds.includes(id) 
                ? prev.slotIds.filter(s => s !== id)
                : [...prev.slotIds, id]
        }));
    };

    const handleMarkLeaveClick = () => {
        setShowLeaveModal(true);
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
                        className="p-2 md:p-3 rounded-xl active:scale-95 glass-panel"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {theme === 'light' ? <Moon size={20} className="md:w-5 md:h-5" /> : <Sun size={20} className="md:w-5 md:h-5" />}
                    </button>
                    <button 
                        onClick={handleMarkLeaveClick}
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
                    <button 
                        onClick={() => setActiveTab('locations')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 md:py-3 rounded-xl font-black text-xs md:text-sm transition-all ${activeTab === 'locations' ? 'shadow-md' : 'hover:opacity-80'}`}
                        style={{ 
                            backgroundColor: activeTab === 'locations' ? 'var(--bg-card)' : 'transparent',
                            color: activeTab === 'locations' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                        }}
                    >
                        <MapPin size={16} className="md:w-[18px] md:h-[18px]" /> 
                        <span className="hidden xs:inline">Live Locations</span>
                        <span className="xs:hidden">Rooms</span>
                    </button>
                </div>
            </nav>

            {/* Status Legend */}
            <div className="max-w-4xl mx-auto mt-4 md:mt-6 px-4 md:px-8">
                <div className="rounded-2xl p-3 md:p-4 flex flex-wrap justify-center items-center gap-3 md:gap-6 glass-panel">
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <div key={key} className="flex items-center gap-1.5 md:gap-2">
                            <div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${config.dot} shadow-sm`}></div>
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
                                <h2 className="text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Today is Rest Day</h2>
                                <p className="font-bold uppercase tracking-[0.3em] text-xs" style={{ color: 'var(--text-secondary)' }}>Recharge for the upcoming week</p>
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
                                            className={`rounded-2xl md:rounded-[2rem] p-3 md:p-5 flex items-center gap-3 md:gap-6 cursor-pointer group active:scale-[0.98] glass-panel relative ${getCurrentSlotId(currentTime) === slot.id ? 'ring-4 ring-indigo-500/20 scale-[1.01]' : ''}`}
                                        >
                                            {getCurrentSlotId(currentTime) === slot.id && (
                                                <div className="absolute -top-2 right-8 bg-indigo-600 text-white text-[8px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg animate-pulse z-10">
                                                    Ongoing
                                                </div>
                                            )}
                                            <div className="w-16 md:w-24 text-center border-r-2 pr-3 md:pr-6 space-y-0.5 md:space-y-1" style={{ borderColor: 'var(--border-secondary)' }}>
                                                <div className="text-[9px] md:text-xs font-black leading-none" style={{ color: 'var(--text-primary)' }}>{slot.time.split(' – ')[0]}</div>
                                                <div className="font-black text-xs md:text-base" style={{ color: 'var(--accent-primary)' }}>-</div>
                                                <div className="text-[9px] md:text-xs font-black leading-none" style={{ color: 'var(--text-primary)' }}>{slot.time.split(' – ')[1]}</div>
                                            </div>
                                            
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl ${config.color} border flex items-center justify-center ${config.text} shadow-sm shrink-0`}>
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

                                            <div className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-[7px] md:text-[10px] uppercase tracking-widest opacity-40 group-hover:opacity-100 transition-all ${config.color} ${config.text} border shrink-0`}>
                                                Update
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )
                ) : activeTab === 'locations' ? (
                    <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-4">
                            <div>
                                <h2 className="text-xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Campus Rooms</h2>
                                <p className="font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-secondary)' }}>Live Status Overview</p>
                            </div>
                            <span className="px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.2em]" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                                {getCurrentSlotId(currentTime) === -1 ? 'BREAK / OUTSIDE HOURS' : `SLOT ${getCurrentSlotId(currentTime) + 1} ONGOING`}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {liveLocations.length === 0 && (
                                <div className="col-span-full py-12 text-center border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                    <MapPin size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="font-black text-lg uppercase tracking-widest">No Locations Found</p>
                                </div>
                            )}
                            {liveLocations.map(loc => {
                                const isAvailable = loc.live_status === 'AVAILABLE';
                                const config = STATUS_CONFIG[isAvailable ? 'AVAILABLE' : (loc.live_status === 'IN LAB' ? 'LAB' : 'LECTURE')];
                                const StatusIcon = config.icon || MapPin;
                                
                                return (
                                    <div key={loc.id} className="rounded-2xl p-4 md:p-5 relative overflow-hidden group glass-panel">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-black text-lg md:text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{loc.name}</h3>
                                                <p className="font-bold text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-secondary)' }}>
                                                    {loc.type} {loc.capacity ? `• CAP: ${loc.capacity}` : ''}
                                                </p>
                                                {loc.parent_name && (
                                                    <p className="font-bold text-[8px] uppercase tracking-widest mt-0.5 opacity-60" style={{ color: 'var(--text-secondary)' }}>
                                                        Inside: {loc.parent_name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className={`w-10 h-10 rounded-xl ${config.color} border flex items-center justify-center ${config.text} shadow-sm shrink-0`}>
                                                <StatusIcon size={20} />
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 rounded-xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-secondary)' }}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                                                <span className={`font-black text-[10px] uppercase tracking-widest ${config.text}`}>{loc.live_status}</span>
                                            </div>
                                            
                                            {!isAvailable && loc.details && (
                                                <div className="mt-2 space-y-1.5">
                                                    <div className="font-black text-xs md:text-sm truncate" style={{ color: 'var(--accent-primary)' }}>{loc.details.subject}</div>
                                                    <div className="flex justify-between items-center text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                                                        <span className="truncate max-w-[120px]">{loc.details.professor_name}</span>
                                                        <span className="shrink-0 ml-2 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                                                            {loc.details.year}-{loc.details.division} {loc.details.batch ? `(${loc.details.batch})` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                        <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {DAYS.slice(1, 6).map((day, idx) => {
                                const dayIdx = idx + 1; // Monday (1) to Friday (5)
                                return (
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
                                                    <div className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest ${config.text} opacity-60 mb-1`}>
                                                        {slot.time.split(' – ')[0]}
                                                    </div>
                                                    <div className={`font-black text-[9px] md:text-[11px] leading-tight ${config.text} truncate`}>
                                                        {entry ? entry.subject : config.label}
                                                    </div>
                                                    <div className={`text-[7px] md:text-[8px] font-bold ${config.text} opacity-40 mt-0.5 truncate`}>
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
                                );
                            })}
                        </div>
                )}
            </main>

            {/* Status Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300 glass-panel">
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
                                        <div className={`w-10 h-10 rounded-xl ${config.color} border flex items-center justify-center ${config.text} shadow-sm`}>
                                            <StatusIcon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-sm" style={{ color: isCurrent ? 'var(--accent-primary)' : 'var(--text-primary)' }}>{config.label}</div>
                                            <div className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>Set current slot availability</div>
                                        </div>
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => handleStatusUpdate('DEFAULT')}
                                className="w-full mt-2 p-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-600"
                                style={{ backgroundColor: 'var(--bg-main)' }}
                            >
                                <Trash2 size={16} className="text-red-500" />
                                <div className="font-black text-xs uppercase tracking-widest text-red-500">Reset to Default</div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-[2.5rem] overflow-hidden animate-in fade-in zoom-in duration-300 glass-panel">
                        <div className="p-6 md:p-8 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                            <div>
                                <h3 className="font-black text-lg md:text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Apply Leave Range</h3>
                                <p className="mt-1 font-bold text-[10px] md:text-[10px] uppercase tracking-widest text-slate-400">Select dates and optional specific slots</p>
                            </div>
                            <button onClick={() => setShowLeaveModal(false)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm dark:bg-slate-800 dark:hover:text-slate-100">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 space-y-6" style={{ backgroundColor: 'var(--bg-main)' }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="font-black text-[10px] uppercase tracking-widest text-slate-500">From Date</label>
                                    <input 
                                        type="date" 
                                        value={leaveData.startDate}
                                        onChange={(e) => setLeaveData(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="w-full p-3 rounded-xl border-2 focus:border-indigo-600 outline-none transition-all dark:bg-slate-800 dark:border-slate-700" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="font-black text-[10px] uppercase tracking-widest text-slate-500">To Date</label>
                                    <input 
                                        type="date" 
                                        value={leaveData.endDate}
                                        onChange={(e) => setLeaveData(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="w-full p-3 rounded-xl border-2 focus:border-indigo-600 outline-none transition-all dark:bg-slate-800 dark:border-slate-700" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="font-black text-[10px] uppercase tracking-widest text-slate-500">Select Slots (Leave empty for all day)</label>
                                <div className="flex flex-wrap gap-2">
                                    {SLOTS.map(slot => (
                                        <button
                                            key={slot.id}
                                            onClick={() => toggleLeaveSlot(slot.id)}
                                            className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border-2 transition-all ${
                                                leaveData.slotIds.includes(slot.id) 
                                                    ? 'bg-indigo-600 text-white border-indigo-600' 
                                                    : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            Slot {slot.id + 1}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                onClick={handleApplyLeave}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 dark:shadow-none mt-4"
                            >
                                Confirm Leave Period
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfessorDashboard;
