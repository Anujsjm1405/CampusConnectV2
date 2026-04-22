import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
    LogOut, Plus, Trash2, Users, Calendar, X, ChevronDown, 
    MapPin, AlertCircle, RefreshCcw, BookOpen, Layers, 
    LayoutGrid, UserPlus, ClipboardList, Settings, Search,
    Filter, Clock, Sun, Moon
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

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'professors' | 'mapping'
    const [mappingTab, setMappingTab] = useState('LECTURE'); // 'LECTURE' | 'LAB'
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() > 0 && new Date().getDay() < 6 ? new Date().getDay() - 1 : 0);
    const [showMenu, setShowMenu] = useState(false);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const [professors, setProfessors] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    
    // Global selection state (shared between Timetable and Mapping)
    const [selectedYear, setSelectedYear] = useState('SY');
    const [selectedDivision, setSelectedDivision] = useState('A');
    const [selectedClassId, setSelectedClassId] = useState('');

    // Modal state
    const [showProfModal, setShowProfModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showResetMappingModal, setShowResetMappingModal] = useState(false);
    
    const [activeSlot, setActiveSlot] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [professorToDelete, setProfessorToDelete] = useState(null);

    // Form states
    const [newProf, setNewProf] = useState({ name: '', login_id: '', password: '', designation: 'Assistant Professor' });
    const [newEntry, setNewEntry] = useState({ assignment_id: '', location: '', session_type: 'LECTURE', batch: '' });
    const [assignmentForm, setAssignmentForm] = useState({ 
        professor_id: '', 
        subject_name: '', 
        session_type: 'LECTURE' 
    });

    // Computed
    const [classAssignments, setClassAssignments] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        const cls = allClasses.find(c => c.year === selectedYear && c.division === selectedDivision);
        if (cls) {
            setSelectedClassId(cls.id);
            fetchClassAssignments(cls.id);
        } else {
            setSelectedClassId('');
            setClassAssignments([]);
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
            const [profsRes, classesRes, assignRes] = await Promise.all([
                axios.get('/api/admin/professors'),
                axios.get('/api/admin/classes'),
                axios.get('/api/admin/assignments')
            ]);
            setProfessors(profsRes.data);
            setAllClasses(classesRes.data);
            setAssignments(assignRes.data);
        } catch (err) {
            console.error("Error fetching initial data:", err);
        }
    };

    const fetchTimetable = async () => {
        try {
            const res = await axios.get(`/api/timetable?class_id=${selectedClassId}`);
            setTimetable(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchClassAssignments = async (cid) => {
        try {
            const res = await axios.get(`/api/admin/assignments/${cid}`);
            setClassAssignments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // --- Actions ---
    const handleCreateProf = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/admin/professors', newProf);
            setNewProf({ name: '', login_id: '', password: '', designation: 'Assistant Professor' });
            setShowProfModal(false);
            fetchInitialData();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create professor');
        }
    };

    const handleDeleteProfessor = async () => {
        if (!professorToDelete) return;
        try {
            await axios.delete(`/api/admin/professors/${professorToDelete.id}`);
            setProfessorToDelete(null);
            fetchInitialData();
        } catch (err) {
            alert('Failed to delete professor');
        }
    };

    const handleUpdateDesignation = async (profId, designation) => {
        try {
            await axios.put(`/api/admin/professors/${profId}`, { designation });
            fetchInitialData();
        } catch (err) {
            alert('Failed to update designation');
        }
    };

    const handleAddAssignment = async (e) => {
        e.preventDefault();
        const payload = {
            professor_id: assignmentForm.professor_id,
            subject_name: assignmentForm.subject_name,
            session_type: assignmentForm.session_type,
            class_id: selectedClassId
        };
        
        try {
            await axios.post('/api/admin/assignments', payload);
            setAssignmentForm({ professor_id: '', subject_name: '', session_type: 'LECTURE' });
            setShowAssignModal(false);
            fetchInitialData();
            fetchClassAssignments(selectedClassId);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add mapping');
        }
    };

    const handleDeleteAssignment = async () => {
        if (!assignmentToDelete) return;
        try {
            await axios.delete(`/api/admin/assignments/${assignmentToDelete.id}`);
            setAssignmentToDelete(null);
            fetchInitialData();
            fetchClassAssignments(selectedClassId);
        } catch (err) {
            alert('Failed to delete assignment');
        }
    };

    const handleResetMappings = async () => {
        if (!selectedClassId) return;
        try {
            await axios.delete(`/api/admin/assignments/reset/${selectedClassId}`);
            setShowResetMappingModal(false);
            fetchInitialData();
            fetchClassAssignments(selectedClassId);
        } catch (err) {
            alert('Failed to reset mappings');
        }
    };

    const handleCreateEntry = async (e) => {
        e.preventDefault();
        const assignment = classAssignments.find(a => a.id === parseInt(newEntry.assignment_id));
        if (!assignment) return alert('Please select a subject mapping');

        try {
            await axios.post('/api/timetable', {
                class_id: selectedClassId,
                professor_id: assignment.professor_id,
                subject: assignment.subject_name,
                location: newEntry.location,
                day_of_week: activeSlot.day + 1,
                start_slot: activeSlot.slot,
                session_type: newEntry.session_type,
                batch: newEntry.batch
            });
            setShowSlotModal(false);
            setNewEntry({ assignment_id: '', location: '', session_type: 'LECTURE', batch: '' });
            fetchTimetable();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create entry');
        }
    };

    useEffect(() => {
        if (showSlotModal && newEntry.session_type === 'LAB' && !newEntry.batch) {
            setNewEntry(prev => ({ ...prev, batch: selectedDivision + '1' }));
        } else if (showSlotModal && newEntry.session_type === 'LECTURE') {
            setNewEntry(prev => ({ ...prev, batch: '' }));
        }
    }, [showSlotModal, newEntry.session_type, selectedDivision]);

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
        ).sort((a, b) => {
            // Sort by batch name (B1, B2, B3...)
            if (a.batch && b.batch) return a.batch.localeCompare(b.batch);
            return 0;
        });
    };

    const years = [...new Set(allClasses.map(c => c.year))];
    const divisions = [...new Set(allClasses.filter(c => c.year === selectedYear).map(c => c.division))];

    return (
        <div className="min-h-screen pb-20 font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            {/* Nav Bar */}
            <header className="border-b px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center backdrop-blur-md transition-colors duration-300" style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg shadow-indigo-100">C</div>
                        <h1 className="text-lg md:text-xl font-black tracking-tight hidden sm:block" style={{ color: 'var(--text-primary)' }}>CampusConnect Admin</h1>
                    </div>
                    
                    <div className="h-8 w-px hidden lg:block" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                    
                    <div className="hidden lg:flex flex-col">
                        <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent-primary)' }}>
                            <Clock size={12} />
                            <span>Live System Time</span>
                        </div>
                        <div className="font-black text-xs" style={{ color: 'var(--text-primary)' }}>
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            <span className="mx-2" style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>|</span>
                            <span style={{ color: 'var(--accent-primary)' }}>{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl border font-black text-[10px] md:text-xs uppercase tracking-widest transition-all hover:bg-black/5"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    >
                        <LayoutGrid size={16} className="text-indigo-600 md:w-[18px] md:h-[18px]" />
                        <span>Menu</span>
                        <ChevronDown size={14} className={`transition-transform duration-300 md:w-4 md:h-4 ${showMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {showMenu && (
                        <div className="absolute top-full mt-2 left-0 w-64 rounded-[2rem] shadow-2xl border p-2 z-[100] animate-in slide-in-from-top-2 duration-200" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {[
                                { id: 'timetable', label: 'Timetable', icon: Calendar },
                                { id: 'professors', label: 'Professors', icon: Users },
                                { id: 'mapping', label: 'Faculty Mapping', icon: ClipboardList },
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-4 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all text-left hover:bg-black/5"
                                    style={{ 
                                        color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)'
                                    }}
                                >
                                    <tab.icon size={18} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={toggleTheme}
                        className="p-2.5 rounded-xl transition-all active:scale-95 border"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button 
                        onClick={logout}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95 dark:bg-red-900/20 dark:text-red-400"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Selection Bar (Shared for Timetable & Mapping) */}
            {(activeTab === 'timetable' || activeTab === 'mapping') && (
                <div className="border-b px-4 md:px-8 py-4 md:py-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <div className="flex items-center gap-2 md:gap-4 p-1.5 md:p-2 rounded-2xl border w-full md:w-auto overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                        <div className="flex gap-1 shrink-0">
                            {years.map(y => (
                                <button 
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${selectedYear === y ? 'text-white shadow-lg' : 'hover:bg-black/5'}`}
                                    style={{ 
                                        backgroundColor: selectedYear === y ? 'var(--accent-primary)' : 'transparent',
                                        color: selectedYear === y ? '#fff' : 'var(--text-secondary)'
                                    }}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-6 mx-1 md:mx-2 shrink-0" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                        <div className="flex gap-1 shrink-0">
                            {divisions.map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setSelectedDivision(d)}
                                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${selectedDivision === d ? 'text-white shadow-lg' : 'hover:bg-black/5'}`}
                                    style={{ 
                                        backgroundColor: selectedDivision === d ? 'var(--accent-primary)' : 'transparent',
                                        color: selectedDivision === d ? '#fff' : 'var(--text-secondary)'
                                    }}
                                >
                                    {d === 'No Div' ? 'Gen' : d}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-left md:text-right">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Active Selection</p>
                            <p className="text-xs md:text-sm font-black" style={{ color: 'var(--text-primary)' }}>{selectedYear} — {selectedDivision === 'No Div' ? 'General' : `Division ${selectedDivision}`}</p>
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
                
                {/* --- TAB 1: TIMETABLE --- */}
                {activeTab === 'timetable' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Master Schedule</h2>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Allocating slots for {selectedYear} {selectedDivision}</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setShowResetModal(true)}
                                    className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/10"
                                >
                                    <RefreshCcw size={14} className="md:w-4 md:h-4" /> 
                                    <span className="hidden xs:inline">Reset Timetable</span>
                                    <span className="xs:hidden">Reset</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Day Selector */}
                        <div className="md:hidden flex gap-1 p-1 rounded-xl border overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {DAYS.map((day, idx) => (
                                <button 
                                    key={day}
                                    onClick={() => setSelectedDay(idx)}
                                    className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${selectedDay === idx ? 'text-white shadow-md' : ''}`}
                                    style={{ 
                                        backgroundColor: selectedDay === idx ? 'var(--accent-primary)' : 'transparent',
                                        color: selectedDay === idx ? '#fff' : 'var(--text-secondary)'
                                    }}
                                >
                                    {day.slice(0, 3)}
                                </button>
                            ))}
                        </div>

                        {/* Grid */}
                        <div className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border overflow-hidden transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2 transition-colors duration-300" style={{ backgroundColor: 'var(--border-secondary)', borderColor: 'var(--border-primary)' }}>
                                            <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest border-r min-w-[140px]" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>Slot Time</th>
                                            {DAYS.map(day => (
                                                <th key={day} className="p-6 text-center text-[10px] font-black uppercase tracking-widest min-w-[200px]" style={{ color: 'var(--text-primary)' }}>{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SLOTS.map(slot => (
                                            <tr key={slot.id} className="border-b last:border-0 group transition-colors duration-300" style={{ borderColor: 'var(--border-primary)' }}>
                                                <td className="p-6 border-r transition-colors duration-300" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-main)' }}>
                                                    <div className="text-[11px] font-black leading-tight space-y-1 text-center" style={{ color: 'var(--text-primary)' }}>
                                                        <div>{slot.time.split(' – ')[0]}</div>
                                                        <div className="font-black" style={{ color: 'var(--accent-primary)' }}>-</div>
                                                        <div>{slot.time.split(' – ')[1]}</div>
                                                    </div>
                                                </td>
                                                {DAYS.map((day, dayIdx) => {
                                                    const entries = getEntriesAt(dayIdx, slot.id);
                                                    const isSpanOccupied = entries.some(e => e.session_type === 'LAB' && e.start_slot === slot.id - 1);
                                                    if (isSpanOccupied) return null;

                                                    const startingEntries = entries.filter(e => e.start_slot === slot.id);
                                                    const isLabSession = startingEntries.some(e => e.session_type === 'LAB');

                                                    return (
                                                        <td key={day} rowSpan={isLabSession ? 2 : 1} className="p-2 border-r relative min-h-[120px]" style={{ borderColor: 'var(--border-primary)' }}>
                                                            <div className="flex flex-col gap-2 h-full min-h-[100px]">
                                                                {startingEntries.map(entry => (
                                                                    <div key={entry.id} className="w-full rounded-2xl p-4 flex flex-col justify-between transition-all transform hover:scale-[1.02] group/card bg-indigo-600 text-white shadow-none">
                                                                        <div>
                                                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                                                <div className="font-black text-xs leading-tight tracking-tight text-white">{entry.subject}</div>
                                                                                {entry.batch && (
                                                                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter bg-white/20 text-white">
                                                                                        {entry.batch}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-[9px] font-bold flex items-center gap-1.5 mb-2 text-indigo-100">
                                                                                <MapPin size={10} />
                                                                                <span>{entry.location || 'N/A'}</span>
                                                                            </div>
                                                                            <div className="text-[9px] font-bold flex items-center gap-1.5 text-indigo-200">
                                                                                <Users size={10} /> 
                                                                                <span className="truncate">{entry.professor_name}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                                                                            <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white/20 text-white">
                                                                                {entry.session_type}
                                                                            </span>
                                                                            <button 
                                                                                onClick={() => { setEntryToDelete(entry); setShowDeleteModal(true); }}
                                                                                className="p-1.5 rounded-lg transition-all bg-white/10 hover:bg-red-500 text-white"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {startingEntries.length === 0 && (
                                                                    <button 
                                                                        onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                        className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed transition-all group/btn"
                                                                        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                                                    >
                                                                        <Plus size={20} className="group-hover/btn:scale-125 transition-transform" />
                                                                    </button>
                                                                )}
                                                                {isLabSession && (
                                                                    <button 
                                                                        onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                        className="w-full py-2 border border-dashed rounded-xl flex items-center justify-center gap-2 font-black text-[9px] transition-all mt-1"
                                                                        style={{ borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}
                                                                    >
                                                                        <Plus size={10} /> Add Parallel Batch
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

                            {/* Mobile Vertical View */}
                            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {SLOTS.map(slot => {
                                    const entries = getEntriesAt(selectedDay, slot.id);
                                    const startingEntries = entries.filter(e => e.start_slot === slot.id);
                                    const isLabSession = startingEntries.some(e => e.session_type === 'LAB');

                                    return (
                                        <div key={slot.id} className="p-4 space-y-3">
                                            <div className="flex items-center gap-3 mb-1">
                                                <div className="px-3 py-1 rounded-lg font-black text-[10px] tracking-widest text-white shrink-0" style={{ backgroundColor: 'var(--accent-primary)' }}>
                                                    {slot.time.split(' – ')[0]}
                                                </div>
                                                <div className="h-px flex-1" style={{ backgroundColor: 'var(--border-primary)' }}></div>
                                            </div>

                                            <div className="space-y-3">
                                                {startingEntries.map(entry => (
                                                    <div key={entry.id} className="w-full rounded-2xl p-4 bg-indigo-600 text-white shadow-lg space-y-3">
                                                        <div className="flex justify-between items-start">
                                                            <div className="space-y-1">
                                                                <div className="font-black text-sm tracking-tight">{entry.subject}</div>
                                                                <div className="text-[10px] font-bold flex items-center gap-1.5 text-indigo-100">
                                                                    <MapPin size={12} /> {entry.location || 'N/A'}
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-white/20">
                                                                {entry.session_type}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center pt-2 border-t border-white/10">
                                                            <div className="text-[10px] font-black flex items-center gap-2">
                                                                <Users size={12} /> {entry.professor_name}
                                                            </div>
                                                            <button 
                                                                onClick={() => { setEntryToDelete(entry); setShowDeleteModal(true); }}
                                                                className="p-2 rounded-xl bg-white/10 hover:bg-red-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button 
                                                    onClick={() => { setActiveSlot({ day: selectedDay, slot: slot.id }); setShowSlotModal(true); }}
                                                    className="w-full py-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:bg-black/5"
                                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                                >
                                                    <Plus size={24} className="opacity-50" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Add Allotment</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB 2: PROFESSORS --- */}
                {activeTab === 'professors' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="space-y-1">
                                <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Professor Registry</h2>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Manage all registered faculty members</p>
                            </div>
                            <button 
                                onClick={() => setShowProfModal(true)}
                                className="w-full md:w-auto px-6 py-3.5 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                                <UserPlus size={18} /> Register New
                            </button>
                        </div>

                        <div className="rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Professor Name</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Designation</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Login ID</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: 'var(--border-primary)' }}>
                                        {professors.map(p => (
                                            <tr key={p.id} className="hover:bg-black/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>{p.name[0]}</div>
                                                        <div className="font-black" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <select 
                                                        className="px-4 py-2 border rounded-xl font-bold text-xs outline-none focus:border-indigo-500 cursor-pointer"
                                                        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                                        value={p.designation}
                                                        onChange={(e) => handleUpdateDesignation(p.id, e.target.value)}
                                                    >
                                                        {['HOD', 'Professor', 'Associate Professor', 'Assistant Professor'].map(d => (
                                                            <option key={d} value={d}>{d}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{p.login_id}</td>
                                                <td className="px-8 py-6 text-center">
                                                    <button 
                                                        onClick={() => setProfessorToDelete(p)}
                                                        className="p-3 rounded-xl transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        style={{ color: 'var(--text-secondary)' }}
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y" style={{ borderColor: 'var(--border-primary)' }}>
                                {professors.map(p => (
                                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>{p.name[0]}</div>
                                            <div>
                                                <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                                                <div className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>{p.designation} • ID: {p.login_id}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => setProfessorToDelete(p)}
                                            className="p-2.5 rounded-xl text-red-500 bg-red-50 dark:bg-red-900/20 transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {professors.length === 0 && (
                                <div className="px-8 py-20 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>No professors registered yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB 3: FACULTY MAPPING --- */}
                {activeTab === 'mapping' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-8">
                            <div className="space-y-4 w-full md:w-auto">
                                <div className="space-y-1">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Faculty Mapping</h2>
                                    <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Course allotment for {selectedYear} {selectedDivision}</p>
                                </div>
                                
                                <div className="flex p-1 rounded-xl md:rounded-2xl border w-full sm:w-fit overflow-x-auto no-scrollbar" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                    {['LECTURE', 'LAB', 'BOTH'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setMappingTab(t)}
                                            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${mappingTab === t ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-black/5'}`}
                                            style={{ 
                                                backgroundColor: mappingTab === t ? '#4f46e5' : 'transparent',
                                                color: mappingTab === t ? '#fff' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {t === 'BOTH' ? 'Both' : `${t}s`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <button 
                                    onClick={() => setShowResetMappingModal(true)}
                                    className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center justify-center gap-2 border border-red-200 text-red-500 dark:border-red-900/50"
                                >
                                    <RefreshCcw size={14} className="md:w-4 md:h-4" /> 
                                    <span className="hidden xs:inline">Reset Mapping</span>
                                    <span className="xs:hidden">Reset</span>
                                </button>
                                <button 
                                    onClick={() => setShowAssignModal(true)}
                                    className="flex-1 md:flex-none px-4 md:px-6 py-3 md:py-3.5 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                    style={{ backgroundColor: 'var(--accent-primary)' }}
                                >
                                    <Plus size={16} className="md:w-[18px] md:h-[18px]" /> Allot Faculty
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                            {classAssignments
                                .filter(ass => ass.session_type === mappingTab)
                                .map(ass => (
                                <div key={ass.id} className="p-4 md:p-6 rounded-2xl md:rounded-[2rem] shadow-xl border group hover:border-indigo-400 transition-all relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                                     <div className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                                     
                                     <div className="relative space-y-3 md:space-y-4">
                                         <div className="flex justify-between items-start">
                                             <div className="px-2 md:px-3 py-1 text-white rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: 'var(--accent-primary)' }}>
                                                 {selectedYear} - {selectedDivision}
                                             </div>
                                             <button 
                                                 onClick={() => setAssignmentToDelete(ass)}
                                                 className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 md:text-inherit md:hover:text-red-500 transition-colors"
                                                 style={{ color: 'var(--text-secondary)' }}
                                             >
                                                 <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                                             </button>
                                         </div>
                                         
                                         <div className="flex-1">
                                             <h4 className="font-black text-xs md:text-sm" style={{ color: 'var(--text-primary)' }}>{ass.subject_name}</h4>
                                             <div className="flex items-center gap-2 mt-1">
                                                 <p className="text-[10px] md:text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{ass.professor_name}</p>
                                                 <span className={`text-[7px] md:text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                                     ass.session_type === 'LAB' ? 'bg-amber-100 text-amber-600' : 
                                                     ass.session_type === 'LECTURE' ? 'bg-indigo-100 text-indigo-600' : 
                                                     'bg-emerald-100 text-emerald-600'
                                                 }`}>
                                                     {ass.session_type}
                                                 </span>
                                             </div>
                                         </div>
                                     </div>
                                </div>
                            ))}
                            {classAssignments.length === 0 && (
                                <div className="col-span-full py-16 md:py-20 text-center rounded-[1.5rem] md:rounded-[2.5rem] border-4 border-dashed font-black text-xs md:text-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}>
                                    No mappings found for this class. Add subjects here first.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}
            
            {/* Professor Registration Modal */}
            {showProfModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="px-6 md:px-10 py-6 md:py-8 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-black text-xl md:text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Register Faculty</h3>
                            <button onClick={() => setShowProfModal(false)} className="p-2 rounded-2xl hover:opacity-70 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={20} className="md:w-6 md:h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateProf} className="p-6 md:p-10 space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Full Legal Name</label>
                                <input required className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Dr. John Smith" value={newProf.name} onChange={e => setNewProf({...newProf, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Login ID</label>
                                <input required className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="smith_j" value={newProf.login_id} onChange={e => setNewProf({...newProf, login_id: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Designation</label>
                                <select 
                                    required 
                                    className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base appearance-none cursor-pointer" 
                                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                    value={newProf.designation} 
                                    onChange={e => setNewProf({...newProf, designation: e.target.value})}
                                >
                                    {['HOD', 'Professor', 'Associate Professor', 'Assistant Professor'].map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Set Password</label>
                                <input required type="password" className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="••••••••" value={newProf.password} onChange={e => setNewProf({...newProf, password: e.target.value})} />
                            </div>
                            <button className="w-full text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:opacity-90 transition-all shadow-2xl mt-2 md:mt-4" style={{ backgroundColor: 'var(--accent-primary)' }}>Confirm Registration</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Mapping Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="px-6 md:px-10 py-6 md:py-8 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                            <div>
                                <h3 className="font-black text-xl md:text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Faculty Allotment</h3>
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1" style={{ color: 'var(--accent-primary)' }}>For {selectedYear} - {selectedDivision}</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-2 rounded-2xl hover:opacity-70 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={20} className="md:w-6 md:h-6" /></button>
                        </div>
                        <form onSubmit={handleAddAssignment} className="p-6 md:p-10 space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Assign Professor</label>
                                <select required className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={assignmentForm.professor_id} onChange={e => setAssignmentForm({...assignmentForm, professor_id: e.target.value})}>
                                    <option value="">Select Faculty</option>
                                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Subject Name</label>
                                <input required className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="e.g. Data Structures" value={assignmentForm.subject_name} onChange={e => setAssignmentForm({...assignmentForm, subject_name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Mapping Format</label>
                                <div className="flex gap-2">
                                    {['LECTURE', 'LAB', 'BOTH'].map(type => (
                                        <button 
                                            key={type} 
                                            type="button"
                                            onClick={() => setAssignmentForm(prev => ({...prev, session_type: type}))}
                                            className={`flex-1 py-3 px-1.5 rounded-lg md:rounded-xl border-4 font-black transition-all text-[9px] md:text-[10px] ${
                                                assignmentForm.session_type === type 
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                                                : 'border-transparent'
                                            }`}
                                            style={{ 
                                                backgroundColor: assignmentForm.session_type === type ? '#4f46e5' : 'var(--bg-main)',
                                                color: assignmentForm.session_type === type ? '#fff' : 'var(--text-secondary)'
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button className="w-full text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:opacity-90 transition-all shadow-2xl mt-2 md:mt-4" style={{ backgroundColor: 'var(--accent-primary)' }}>Confirm Mapping</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Timetable Assignment Modal */}
            {showSlotModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className="px-6 md:px-10 py-6 md:py-8 border-b flex justify-between items-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                            <div>
                                <h3 className="font-black text-xl md:text-2xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Assign Slot</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[8px] md:text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 text-white rounded-full uppercase tracking-widest" style={{ backgroundColor: 'var(--accent-primary)' }}>{DAYS[activeSlot.day]}</span>
                                    <span className="text-[10px] md:text-xs font-black" style={{ color: 'var(--text-primary)' }}>{SLOTS[activeSlot.slot].time}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowSlotModal(false)} className="p-2 rounded-2xl hover:opacity-70 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={20} className="md:w-6 md:h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateEntry} className="p-6 md:p-10 space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Select Subject Mapping</label>
                                <select required className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newEntry.assignment_id} onChange={e => setNewEntry({...newEntry, assignment_id: e.target.value})}>
                                    <option value="">Mapped Professors</option>
                                    {classAssignments
                                        .filter(a => {
                                            if (newEntry.session_type === 'LECTURE') return a.session_type === 'LECTURE' || a.session_type === 'BOTH';
                                            if (newEntry.session_type === 'LAB') return a.session_type === 'LAB' || a.session_type === 'BOTH';
                                            return true;
                                        })
                                        .map(a => <option key={a.id} value={a.id}>{a.subject_name} ({a.professor_name})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Format</label>
                                    <div className="flex gap-2">
                                        {['LECTURE', 'LAB'].map(type => (
                                            <button 
                                                key={type} 
                                                type="button"
                                                onClick={() => setNewEntry({...newEntry, session_type: type})}
                                                className={`flex-1 py-3 md:py-3.5 rounded-lg md:rounded-xl border-4 font-black transition-all text-[10px] ${
                                                    newEntry.session_type === type 
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                                                    : 'border-transparent'
                                                }`}
                                                style={{ 
                                                    backgroundColor: newEntry.session_type === type ? '#4f46e5' : 'var(--bg-main)',
                                                    color: newEntry.session_type === type ? '#fff' : 'var(--text-secondary)'
                                                }}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Batch (Opt)</label>
                                    <input placeholder="B1" className="w-full px-4 md:px-5 py-3 md:py-3.5 border-2 rounded-lg md:rounded-xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newEntry.batch} onChange={e => setNewEntry({...newEntry, batch: e.target.value.toUpperCase()})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Room / Location</label>
                                <input required placeholder="e.g. Room 302" className="w-full px-5 md:px-6 py-3.5 md:py-4 border-2 rounded-xl md:rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm md:text-base" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newEntry.location} onChange={e => setNewEntry({...newEntry, location: e.target.value})} />
                            </div>

                            <button 
                                disabled={classAssignments.length === 0 || (newEntry.session_type === 'LAB' && activeSlot.slot === 6)}
                                className="w-full text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:opacity-90 transition-all shadow-2xl disabled:opacity-50 mt-2 md:mt-2"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                                Confirm Allotment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            {(entryToDelete || assignmentToDelete || professorToDelete || showResetModal || showResetMappingModal) && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-6" style={{ backgroundColor: 'var(--bg-card)' }}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-xl ${showResetModal || showResetMappingModal || professorToDelete ? 'bg-red-500' : 'bg-slate-900'}`}>
                            {showResetModal || showResetMappingModal ? <RefreshCcw size={40} /> : professorToDelete ? <Trash2 size={40} /> : <AlertCircle size={40} />}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Are you sure?</h3>
                            <p className="font-bold leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                {showResetModal ? `This will wipe the schedule for ${selectedYear} - ${selectedDivision}.` : 
                                 showResetMappingModal ? `This will clear all subject mappings for ${selectedYear} - ${selectedDivision}.` :
                                 professorToDelete ? `Deleting ${professorToDelete.name} will also remove all their assignments and timetable slots.` :
                                 assignmentToDelete ? `This mapping for ${assignmentToDelete.subject_name} will be removed.` :
                                 `The session "${entryToDelete?.subject}" will be deleted.`}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setEntryToDelete(null); setAssignmentToDelete(null); setProfessorToDelete(null); setShowResetModal(false); setShowResetMappingModal(false); }}
                                className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-70 transition-all"
                                style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-secondary)' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => {
                                    if (showResetModal) handleResetTimetable();
                                    else if (showResetMappingModal) handleResetMappings();
                                    else if (professorToDelete) handleDeleteProfessor();
                                    else if (assignmentToDelete) handleDeleteAssignment();
                                    else handleDeleteEntry();
                                }}
                                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl ${showResetModal || showResetMappingModal || professorToDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-900 hover:bg-slate-800 dark:bg-slate-800'}`}
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
