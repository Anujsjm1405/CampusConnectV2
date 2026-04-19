import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Calendar, Clock, BookOpen, MapPin, Layers, CheckCircle2, AlertCircle, UserMinus, ChevronRight, LayoutGrid, Timer } from 'lucide-react';

const DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = [
    { id: 0, time: '09:00–10:00' },
    { id: 1, time: '10:15–11:15' },
    { id: 2, time: '11:15–12:15' },
    { id: 3, time: '13:15–14:15' },
    { id: 4, time: '14:15–15:15' },
    { id: 5, time: '15:30–16:30' },
    { id: 6, time: '16:30–17:30' }
];

const STATUS_CONFIG = {
    'LECTURE': { label: 'In Lecture', color: 'bg-red-500', text: 'text-white', icon: BookOpen },
    'LAB': { label: 'In Lab', color: 'bg-amber-500', text: 'text-white', icon: Layers },
    'AVAILABLE': { label: 'Available', color: 'bg-emerald-500', text: 'text-white', icon: CheckCircle2 },
    'BUSY': { label: 'Busy', color: 'bg-purple-600', text: 'text-white', icon: Clock },
    'LEAVE': { label: 'On Leave', color: 'bg-slate-900', text: 'text-white', icon: UserMinus }
};

const ProfessorDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [timetable, setTimetable] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('today'); // 'today' | 'weekly'
    
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [selectedLeaveDays, setSelectedLeaveDays] = useState([]);
    const [showStatusModal, setShowStatusModal] = useState(null); // { day, slot, currentStatus }

    // Get current day of week (1-5, mapping Sat/Sun to Mon for demo purposes or showing "Weekend")
    const getTodayDay = () => {
        const d = new Date().getDay();
        if (d === 0 || d === 6) return 1; // Default to Monday on weekends for demo
        return d;
    };
    const todayDay = getTodayDay();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [ttRes, statusRes] = await Promise.all([
                axios.get(`/api/professors/timetable/${user.id}`),
                axios.get(`/api/professors/status/${user.id}`)
            ]);
            setTimetable(ttRes.data);
            setOverrides(statusRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getSlotStatus = (day, slotId) => {
        // 1. Check override
        const override = overrides.find(o => o.day_of_week === day && o.slot_id === slotId);
        if (override) return override.status;

        // 2. Check timetable
        const entry = timetable.find(e => e.day_of_week === day && 
            (e.start_slot === slotId || (e.session_type === 'LAB' && e.start_slot === slotId - 1))
        );
        if (entry) return entry.session_type; // 'LECTURE' or 'LAB'

        // 3. Default
        return 'AVAILABLE';
    };

    const getTimetableEntry = (day, slotId) => {
        return timetable.find(e => e.day_of_week === day && 
            (e.start_slot === slotId || (e.session_type === 'LAB' && e.start_slot === slotId - 1))
        );
    };

    const handleUpdateStatus = async (status) => {
        if (!showStatusModal) return;
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

    const handleApplyLeave = async () => {
        if (selectedLeaveDays.length === 0) return;
        try {
            await axios.post('/api/professors/leave', {
                professor_id: user.id,
                days: selectedLeaveDays
            });
            setShowLeaveModal(false);
            setSelectedLeaveDays([]);
            fetchData();
        } catch (err) {
            alert('Failed to apply leave');
        }
    };

    const toggleLeaveDay = (day) => {
        setSelectedLeaveDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Syncing Schedule...</p>
        </div>
    );

    return (
        <div className="min-h-screen pb-20 bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b px-6 py-6 sticky top-0 z-30 shadow-sm flex justify-between items-center backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Professor Portal</h1>
                        <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-wider">{user.name}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowLeaveModal(true)}
                        className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <UserMinus size={16} /> Mark Leave
                    </button>
                    <button 
                        onClick={logout}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="max-w-2xl mx-auto mt-8 px-4">
                <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('today')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'today' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Timer size={18} /> Today's Schedule
                    </button>
                    <button 
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'weekly' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <LayoutGrid size={18} /> Weekly View
                    </button>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-8">
                {activeTab === 'today' ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between px-4">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">{DAYS[todayDay]}</h2>
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full font-black text-[10px] uppercase tracking-[0.2em]">Live Status Active</span>
                        </div>
                        
                        <div className="grid gap-4">
                            {SLOTS.map(slot => {
                                const status = getSlotStatus(todayDay, slot.id);
                                const entry = getTimetableEntry(todayDay, slot.id);
                                const config = STATUS_CONFIG[status];
                                const StatusIcon = config.icon;

                                return (
                                    <div 
                                        key={slot.id}
                                        onClick={() => setShowStatusModal({ day: todayDay, slot: slot.id, currentStatus: status })}
                                        className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-200/50 border border-slate-100 flex items-center gap-6 cursor-pointer hover:border-indigo-200 transition-all group active:scale-[0.98]"
                                    >
                                        <div className="w-20 text-center border-r-2 border-slate-50 pr-6">
                                            <div className="text-xs font-black text-slate-900 leading-none">{slot.time.split('–')[0]}</div>
                                            <div className="text-[10px] font-bold text-slate-400 mt-1">{slot.time.split('–')[1]}</div>
                                        </div>
                                        
                                        <div className={`w-12 h-12 rounded-2xl ${config.color} flex items-center justify-center text-white shadow-lg`}>
                                            <StatusIcon size={24} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-black text-lg text-slate-800 tracking-tight">
                                                    {entry ? entry.subject : config.label}
                                                </h3>
                                                {entry && (
                                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[8px] font-black uppercase tracking-widest">
                                                        {entry.year} • Div {entry.division}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] mt-0.5">
                                                <MapPin size={12} /> {entry ? entry.location : 'Campus'}
                                            </div>
                                        </div>

                                        <div className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all ${config.color} ${config.text}`}>
                                            Change
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {[1, 2, 3, 4, 5].map(day => (
                            <section key={day} className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em]">{DAYS[day]}</h3>
                                    <div className="h-0.5 flex-1 bg-slate-200 rounded-full opacity-50"></div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                                    {SLOTS.map(slot => {
                                        const status = getSlotStatus(day, slot.id);
                                        const config = STATUS_CONFIG[status];
                                        return (
                                            <div 
                                                key={slot.id}
                                                onClick={() => setShowStatusModal({ day, slot: slot.id, currentStatus: status })}
                                                className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer transition-all hover:scale-105 ${config.color} shadow-lg shadow-slate-200/50`}
                                            >
                                                <span className="text-[8px] font-black uppercase opacity-60 text-white">Slot {slot.id}</span>
                                                <div className="text-[10px] font-black text-white leading-none whitespace-pre-wrap">{slot.time.split('–').join('\n')}</div>
                                                <div className="w-1 h-1 bg-white/40 rounded-full mt-1"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </main>

            {/* Status Switcher Modal */}
            {showStatusModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-xl text-slate-900 tracking-tight">Update Status</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {DAYS[showStatusModal.day]} • Slot {showStatusModal.slot}
                                </p>
                            </div>
                            <button onClick={() => setShowStatusModal(null)} className="p-2 bg-white rounded-xl text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8 grid gap-3">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <button 
                                        key={key}
                                        onClick={() => handleUpdateStatus(key)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${showStatusModal.currentStatus === key ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-50 hover:border-slate-100 bg-slate-50/50'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${config.color} flex items-center justify-center text-white`}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-black text-slate-900 text-sm">{config.label}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mark as {config.label.toLowerCase()}</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-slate-200">
                                <UserMinus size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Mark Leave</h3>
                                <p className="text-slate-400 font-bold text-sm">Select the days you will be away.</p>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-2">
                                {[1, 2, 3, 4, 5].map(day => (
                                    <button 
                                        key={day}
                                        onClick={() => toggleLeaveDay(day)}
                                        className={`w-12 h-12 rounded-xl font-black text-xs transition-all border-2 ${selectedLeaveDays.includes(day) ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                    >
                                        {DAYS[day].substring(0, 3)}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button 
                                    onClick={() => setShowLeaveModal(false)}
                                    className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleApplyLeave}
                                    disabled={selectedLeaveDays.length === 0}
                                    className="flex-1 py-4 bg-indigo-600 rounded-2xl font-black text-xs uppercase tracking-widest text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50"
                                >
                                    Apply Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Simple X icon replacement since I missed it in imports
const X = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default ProfessorDashboard;
