import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Plus, Trash2, Users, Calendar, X, ChevronDown, MapPin, AlertCircle, RefreshCcw, Layers } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SLOTS = [
    { id: 0, time: '09:00–10:00' },
    { id: 1, time: '10:15–11:15' },
    { id: 2, time: '11:15–12:15' },
    { id: 3, time: '13:15–14:15' },
    { id: 4, time: '14:15–15:15' },
    { id: 5, time: '15:30–16:30' },
    { id: 6, time: '16:30–17:30' }
];

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const [professors, setProfessors] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    
    // Selection state
    const [selectedYear, setSelectedYear] = useState('SY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Modal state
    const [showProfModal, setShowProfModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    
    const [activeSlot, setActiveSlot] = useState(null); // { day, slot }
    const [entryToDelete, setEntryToDelete] = useState(null);

    const [newProf, setNewProf] = useState({ name: '', login_id: '', password: '' });
    const [newEntry, setNewEntry] = useState({ professor_id: '', subject: '', location: '', session_type: 'LECTURE', batch: '' });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const cls = allClasses.find(c => c.year === selectedYear && c.division === selectedDivision);
        if (cls) {
            setSelectedClassId(cls.id);
        } else {
            setSelectedClassId('');
        }
    }, [selectedYear, selectedDivision, allClasses]);

    useEffect(() => {
        if (selectedClassId) {
            fetchTimetable();
        } else {
            setTimetable([]);
        }
    }, [selectedClassId]);

    const fetchInitialData = async () => {
        try {
            const [profsRes, classesRes] = await Promise.all([
                axios.get('/api/admin/professors'),
                axios.get('/api/admin/classes')
            ]);
            setProfessors(profsRes.data);
            setAllClasses(classesRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const fetchTimetable = async () => {
        try {
            const res = await axios.get(`/api/timetable?class_id=${selectedClassId}`);
            setTimetable(res.data);
        } catch (err) {
            console.error("Error fetching timetable:", err);
        }
    };

    const fetchProfessors = async () => {
        try {
            const res = await axios.get('/api/admin/professors');
            setProfessors(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateProf = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/professors', newProf);
            setNewProf({ name: '', login_id: '', password: '' });
            setShowProfModal(false);
            await fetchProfessors();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create professor');
        }
    };

    const handleCreateEntry = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/timetable', {
                ...newEntry,
                class_id: selectedClassId,
                day_of_week: activeSlot.day + 1,
                start_slot: activeSlot.slot
            });
            setShowSlotModal(false);
            setNewEntry({ professor_id: '', subject: '', location: '', session_type: 'LECTURE', batch: '' });
            fetchTimetable();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create entry');
        }
    };

    const handleDeleteEntry = async () => {
        if (!entryToDelete) return;
        try {
            await axios.delete(`/api/timetable/${entryToDelete.id}`);
            setShowDeleteModal(false);
            setEntryToDelete(null);
            fetchTimetable();
        } catch (err) {
            alert('Failed to delete entry');
        }
    };

    const handleResetTimetable = async () => {
        if (!selectedClassId) return;
        try {
            await axios.delete(`/api/timetable/reset/${selectedClassId}`);
            setShowResetModal(false);
            fetchTimetable();
        } catch (err) {
            alert('Failed to reset timetable');
        }
    };

    const getEntriesAt = (dayIndex, slotIndex) => {
        return timetable.filter(e => e.day_of_week === dayIndex + 1 && 
            (e.start_slot === slotIndex || (e.session_type === 'LAB' && e.start_slot === slotIndex - 1))
        );
    };

    const years = [...new Set(allClasses.map(c => c.year))];
    const divisions = [...new Set(allClasses.filter(c => c.year === selectedYear).map(c => c.division))];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-10 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">C</div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setShowProfModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 rounded-2xl hover:bg-indigo-100 text-indigo-600 transition-all font-bold text-sm"
                    >
                        <Users size={18} />
                        <span className="hidden md:inline">Add Professor</span>
                    </button>
                    <button 
                        onClick={logout}
                        className="p-2.5 bg-red-50 rounded-2xl hover:bg-red-100 text-red-600 transition-all active:scale-95"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                {/* Class Selection Card */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Master Schedule</h2>
                                <p className="text-slate-500 font-bold text-lg flex items-center gap-2">
                                    <Calendar size={20} className="text-indigo-500" />
                                    {selectedYear} • {selectedDivision === 'No Div' ? 'General' : `Division ${selectedDivision}`}
                                </p>
                            </div>
                            {selectedClassId && (
                                <button 
                                    onClick={() => setShowResetModal(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all group shadow-sm shadow-red-100"
                                >
                                    <RefreshCcw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                                    Reset Class Timetable
                                </button>
                            )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="relative min-w-[200px]">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Academic Year</label>
                                <div className="relative group">
                                    <select 
                                        className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 shadow-sm font-black text-slate-700 appearance-none cursor-pointer transition-all hover:bg-white"
                                        value={selectedYear}
                                        onChange={(e) => {
                                            const year = e.target.value;
                                            setSelectedYear(year);
                                            const divs = allClasses.filter(c => c.year === year).map(c => c.division);
                                            if (!divs.includes(selectedDivision)) {
                                                setSelectedDivision(divs[0] || 'No Div');
                                            }
                                        }}
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus:rotate-180 transition-transform" size={20} />
                                </div>
                            </div>

                            <div className="relative min-w-[200px]">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-2 block">Division</label>
                                <div className="relative group">
                                    <select 
                                        className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 shadow-sm font-black text-slate-700 appearance-none cursor-pointer transition-all hover:bg-white"
                                        value={selectedDivision}
                                        onChange={(e) => setSelectedDivision(e.target.value)}
                                    >
                                        {divisions.map(d => <option key={d} value={d}>{d === 'No Div' ? 'General' : `Div ${d}`}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus:rotate-180 transition-transform" size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timetable Grid */}
                {!selectedClassId ? (
                    <div className="bg-white rounded-[2.5rem] p-24 text-center border-4 border-dashed border-slate-100 shadow-inner">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Calendar size={40} className="text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-black text-2xl tracking-tight">No configuration found for this selection</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b-2 border-slate-200">
                                        <th className="p-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.25em] border-r border-slate-100 min-w-[140px]">Slot Time</th>
                                        {DAYS.map(day => (
                                            <th key={day} className="p-6 text-center text-xs font-black text-slate-600 uppercase tracking-[0.25em] min-w-[200px]">{day}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {SLOTS.map(slot => (
                                        <tr key={slot.id} className="border-b border-slate-100 last:border-0 group">
                                            <td className="p-6 border-r border-slate-100 bg-slate-50/20 group-hover:bg-slate-50 transition-colors">
                                                <div className="text-base font-black text-slate-800 leading-tight">{slot.time}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest opacity-60">Slot {slot.id}</div>
                                            </td>
                                            {DAYS.map((day, dayIdx) => {
                                                const entries = getEntriesAt(dayIdx, slot.id);
                                                
                                                // Check if any entries are LAB sessions starting from previous slot
                                                const isSpanOccupied = entries.some(e => e.session_type === 'LAB' && e.start_slot === slot.id - 1);
                                                if (isSpanOccupied) return null;

                                                // Entries that start in THIS slot
                                                const startingEntries = entries.filter(e => e.start_slot === slot.id);
                                                const isLabSession = startingEntries.some(e => e.session_type === 'LAB');

                                                return (
                                                    <td 
                                                        key={day} 
                                                        rowSpan={isLabSession ? 2 : 1}
                                                        className={`p-2 border-r border-slate-100 relative min-h-[120px] transition-all ${startingEntries.length > 0 ? '' : 'hover:bg-slate-50/40'}`}
                                                    >
                                                        <div className={`flex flex-col gap-2 h-full ${startingEntries.length > 1 ? 'justify-start' : 'justify-center'}`}>
                                                            {startingEntries.map(entry => (
                                                                <div key={entry.id} className={`w-full rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all transform hover:scale-[1.02] group/card ${entry.session_type === 'LAB' ? 'bg-indigo-600 text-white shadow-indigo-200/50' : 'bg-white border-2 border-slate-100 text-slate-800 hover:border-indigo-200'}`}>
                                                                    <div>
                                                                        <div className="flex justify-between items-start gap-2 mb-1">
                                                                            <div className="font-black text-sm leading-tight tracking-tight">{entry.subject}</div>
                                                                            {entry.batch && (
                                                                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${entry.session_type === 'LAB' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                                    {entry.batch}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className={`text-[9px] font-bold flex items-center gap-1.5 mb-2 ${entry.session_type === 'LAB' ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                                            <MapPin size={10} />
                                                                            <span>{entry.location || 'N/A'}</span>
                                                                        </div>
                                                                        <div className={`text-[9px] font-bold flex items-center gap-1.5 ${entry.session_type === 'LAB' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                                            <Users size={10} /> 
                                                                            <span className="truncate">{entry.professor_name}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${entry.session_type === 'LAB' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                            {entry.session_type}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => { setEntryToDelete(entry); setShowDeleteModal(true); }}
                                                                            className={`p-1.5 rounded-lg transition-all ${entry.session_type === 'LAB' ? 'bg-white/10 hover:bg-red-500 text-white' : 'bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            
                                                            {startingEntries.length === 0 && (
                                                                <button 
                                                                    onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                    className="h-full w-full min-h-[100px] flex items-center justify-center rounded-3xl border-4 border-dashed border-transparent hover:border-indigo-100 hover:bg-indigo-50/20 text-indigo-300 transition-all group/btn"
                                                                >
                                                                    <div className="bg-white p-3 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 group-hover/btn:scale-110 transition-all">
                                                                        <Plus size={24} className="text-indigo-500" />
                                                                    </div>
                                                                </button>
                                                            )}

                                                            {/* Option to add more parallel labs if at least one lab already exists */}
                                                            {isLabSession && (
                                                                <button 
                                                                    onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                    className="w-full py-2 border-2 border-dashed border-indigo-100 rounded-xl flex items-center justify-center gap-2 text-indigo-400 font-black text-[10px] hover:bg-indigo-50 transition-all mt-1"
                                                                >
                                                                    <Plus size={12} /> Add Batch
                                                                </button>
                                                            )}
                                                        </div>
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
            </main>

            {/* Modals */}
            {/* Professor Modal */}
            {showProfModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Add Professor</h3>
                            <button onClick={() => setShowProfModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateProf} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Full Legal Name</label>
                                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all" placeholder="e.g. Dr. John Smith" value={newProf.name} onChange={e => setNewProf({...newProf, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Unique Login ID</label>
                                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all" placeholder="e.g. smith_01" value={newProf.login_id} onChange={e => setNewProf({...newProf, login_id: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Security Password</label>
                                <input required type="password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold transition-all" placeholder="••••••••" value={newProf.password} onChange={e => setNewProf({...newProf, password: e.target.value})} />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 active:scale-[0.97] mt-4">Create Account</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showSlotModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Assign Slot</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full uppercase tracking-widest shadow-sm">{DAYS[activeSlot.day]}</span>
                                    <span className="text-xs font-bold text-slate-400">{SLOTS[activeSlot.slot].time}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateEntry} className="p-10 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Format</label>
                                <div className="flex gap-4">
                                    {['LECTURE', 'LAB'].map(type => (
                                        <button 
                                            key={type} 
                                            type="button"
                                            onClick={() => setNewEntry({...newEntry, session_type: type})}
                                            className={`flex-1 py-3 rounded-xl border-4 font-black transition-all ${newEntry.session_type === type ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-50 text-slate-300'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Subject Title</label>
                                    <input required placeholder="e.g. Android Lab" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm" value={newEntry.subject} onChange={e => setNewEntry({...newEntry, subject: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Batch (Optional)</label>
                                    <input placeholder="e.g. B1, B2" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm" value={newEntry.batch} onChange={e => setNewEntry({...newEntry, batch: e.target.value.toUpperCase()})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Manual Location</label>
                                <input required placeholder="e.g. Lab A or Room 302" className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm" value={newEntry.location} onChange={e => setNewEntry({...newEntry, location: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Assign Professor</label>
                                <select required className="w-full px-5 py-3 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all appearance-none cursor-pointer text-sm" value={newEntry.professor_id} onChange={e => setNewEntry({...newEntry, professor_id: e.target.value})}>
                                    <option value="">Select a Professor</option>
                                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            
                            {newEntry.session_type === 'LAB' && activeSlot.slot === 6 && (
                                <div className="flex items-center gap-2 bg-red-50 p-4 rounded-xl">
                                    <AlertCircle className="text-red-500" size={16} />
                                    <p className="text-[9px] text-red-600 font-black uppercase tracking-tight leading-tight">LAB sessions cannot start at 16:30 (requires 2 slots).</p>
                                </div>
                            )}
                            
                            <button 
                                disabled={newEntry.session_type === 'LAB' && activeSlot.slot === 6}
                                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-[0.97] disabled:opacity-50 mt-2"
                            >
                                Confirm Allotment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <AlertCircle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Delete Session?</h3>
                                <p className="text-slate-500 font-bold leading-relaxed">
                                    Are you sure you want to remove <span className="text-slate-900 font-black">"{entryToDelete?.subject}"</span> {entryToDelete?.batch ? `(Batch ${entryToDelete.batch})` : ''}?
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteEntry}
                                    className="flex-1 py-4 bg-red-500 rounded-2xl font-black text-white hover:bg-red-600 shadow-xl shadow-red-200 transition-all active:scale-95"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Confirmation Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-10 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-red-200">
                                <RefreshCcw size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Reset Timetable?</h3>
                                <p className="text-slate-500 font-bold leading-relaxed">
                                    This will permanently delete the entire schedule for <span className="text-slate-900 font-black">{selectedYear} - {selectedDivision === 'No Div' ? 'General' : `Div ${selectedDivision}`}</span>.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleResetTimetable}
                                    className="flex-1 py-4 bg-red-600 rounded-2xl font-black text-white hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
                                >
                                    Reset All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
