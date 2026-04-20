import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
    LogOut, Plus, Trash2, Users, Calendar, X, ChevronDown, 
    MapPin, AlertCircle, RefreshCcw, BookOpen, Layers, 
    LayoutGrid, UserPlus, ClipboardList, Settings, Search,
    Filter, Clock
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
    const [currentTime, setCurrentTime] = useState(new Date());
    const [activeTab, setActiveTab] = useState('timetable'); // 'timetable' | 'professors' | 'mapping'
    
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
    const [newProf, setNewProf] = useState({ name: '', login_id: '', password: '' });
    const [newEntry, setNewEntry] = useState({ assignment_id: '', location: '', session_type: 'LECTURE', batch: '' });
    const [newAssignment, setNewAssignment] = useState({ professor_id: '', subject_name: '' });

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
            setNewProf({ name: '', login_id: '', password: '' });
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

    const handleCreateAssignment = async (e) => {
        e.preventDefault();
        if (!selectedClassId) return alert("Please select a class first");
        try {
            await axios.post('/api/admin/assignments', {
                ...newAssignment,
                class_id: selectedClassId
            });
            setNewAssignment({ professor_id: '', subject_name: '' });
            setShowAssignModal(false);
            fetchInitialData();
            fetchClassAssignments(selectedClassId);
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create assignment');
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
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Nav Bar */}
            <header className="bg-white border-b px-6 py-4 sticky top-0 z-40 shadow-sm flex justify-between items-center backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">C</div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight hidden lg:block">CampusConnect Admin</h1>
                    </div>
                    
                    <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                            <Clock size={12} />
                            <span>Live System Time</span>
                        </div>
                        <div className="text-slate-900 font-black text-xs">
                            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            <span className="mx-2 text-slate-300">|</span>
                            <span className="text-indigo-600">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                    </div>
                </div>
                
                <nav className="hidden md:flex gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    {[
                        { id: 'timetable', label: 'Timetable', icon: Calendar },
                        { id: 'professors', label: 'Professors', icon: Users },
                        { id: 'mapping', label: 'Faculty Mapping', icon: ClipboardList },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <button 
                    onClick={logout}
                    className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95"
                >
                    <LogOut size={20} />
                </button>
            </header>

            {/* Selection Bar (Shared for Timetable & Mapping) */}
            {(activeTab === 'timetable' || activeTab === 'mapping') && (
                <div className="bg-white border-b px-8 py-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full md:w-auto">
                        <div className="flex gap-1">
                            {years.map(y => (
                                <button 
                                    key={y}
                                    onClick={() => setSelectedYear(y)}
                                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedYear === y ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-2"></div>
                        <div className="flex gap-1">
                            {divisions.map(d => (
                                <button 
                                    key={d}
                                    onClick={() => setSelectedDivision(d)}
                                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${selectedDivision === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {d === 'No Div' ? 'Gen' : d}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Active Selection</p>
                            <p className="text-sm font-black text-slate-900">{selectedYear} — {selectedDivision === 'No Div' ? 'General' : `Division ${selectedDivision}`}</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                            <Filter size={18} />
                        </div>
                    </div>
                </div>
            )}

            <main className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
                
                {/* --- TAB 1: TIMETABLE --- */}
                {activeTab === 'timetable' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Master Schedule</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Allocating slots for {selectedYear} {selectedDivision}</p>
                            </div>
                            <button 
                                onClick={() => setShowResetModal(true)}
                                className="px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                            >
                                <RefreshCcw size={16} /> Reset Grid
                            </button>
                        </div>

                        {/* Grid */}
                        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b-2 border-slate-200">
                                            <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 min-w-[140px]">Slot Time</th>
                                            {DAYS.map(day => (
                                                <th key={day} className="p-6 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest min-w-[200px]">{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SLOTS.map(slot => (
                                            <tr key={slot.id} className="border-b border-slate-100 last:border-0 group">
                                                <td className="p-6 border-r border-slate-100 bg-slate-50/20 group-hover:bg-slate-50 transition-colors">
                                                    <div className="text-[11px] font-black text-slate-800 leading-tight space-y-1 text-center">
                                                        <div>{slot.time.split(' – ')[0]}</div>
                                                        <div className="text-indigo-400 font-black">-</div>
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
                                                        <td key={day} rowSpan={isLabSession ? 2 : 1} className="p-2 border-r border-slate-100 relative min-h-[120px]">
                                                            <div className="flex flex-col gap-2 h-full min-h-[100px]">
                                                                {startingEntries.map(entry => (
                                                                    <div key={entry.id} className={`w-full rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all transform hover:scale-[1.02] group/card ${entry.session_type === 'LAB' ? 'bg-indigo-600 text-white shadow-indigo-200/50' : 'bg-white border-2 border-slate-100 text-slate-800 hover:border-indigo-200'}`}>
                                                                        <div>
                                                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                                                <div className="font-black text-xs leading-tight tracking-tight">{entry.subject}</div>
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
                                                                        className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/20 text-slate-300 transition-all group/btn"
                                                                    >
                                                                        <Plus size={20} className="group-hover/btn:scale-125 transition-transform" />
                                                                    </button>
                                                                )}
                                                                {isLabSession && (
                                                                    <button 
                                                                        onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                        className="w-full py-2 border border-dashed border-indigo-100 rounded-xl flex items-center justify-center gap-2 text-indigo-400 font-black text-[9px] hover:bg-indigo-50 transition-all mt-1"
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
                        </div>
                    </div>
                )}

                {/* --- TAB 2: PROFESSORS --- */}
                {activeTab === 'professors' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Professor Registry</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Manage all registered faculty members</p>
                            </div>
                            <button 
                                onClick={() => setShowProfModal(true)}
                                className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                <UserPlus size={18} /> Register New
                            </button>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50/50 border-b">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Professor Name</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Login ID</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {professors.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">{p.name[0]}</div>
                                                    <div className="font-black text-slate-800">{p.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 font-bold text-slate-400">{p.login_id}</td>
                                            <td className="px-8 py-6 text-center">
                                                <button 
                                                    onClick={() => setProfessorToDelete(p)}
                                                    className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {professors.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="px-8 py-20 text-center text-slate-400 font-bold">No professors registered yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- TAB 3: FACULTY MAPPING --- */}
                {activeTab === 'mapping' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Faculty Mapping</h2>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Course allotment for {selectedYear} {selectedDivision}</p>
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowResetMappingModal(true)}
                                    className="px-6 py-3.5 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
                                >
                                    <RefreshCcw size={16} /> Reset Mapping
                                </button>
                                <button 
                                    onClick={() => setShowAssignModal(true)}
                                    className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} /> Allot Faculty
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classAssignments.map(a => (
                                <div key={a.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 group hover:border-indigo-300 transition-all relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                                    
                                    <div className="relative space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                {a.year} - {a.division}
                                            </div>
                                            <button 
                                                onClick={() => setAssignmentToDelete(a)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 leading-tight">{a.subject_name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400 font-bold text-xs mt-2">
                                                <Users size={14} className="text-indigo-400" />
                                                {a.professor_name}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {classAssignments.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-4 border-dashed border-slate-100 text-slate-300 font-black">
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
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Register Faculty</h3>
                            <button onClick={() => setShowProfModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateProf} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Full Legal Name</label>
                                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="Dr. John Smith" value={newProf.name} onChange={e => setNewProf({...newProf, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Login ID</label>
                                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="smith_j" value={newProf.login_id} onChange={e => setNewProf({...newProf, login_id: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Set Password</label>
                                <input required type="password" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="••••••••" value={newProf.password} onChange={e => setNewProf({...newProf, password: e.target.value})} />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 active:scale-[0.97] mt-4">Confirm Registration</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Mapping Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Faculty Allotment</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">For {selectedYear} - {selectedDivision}</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateAssignment} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Assign Professor</label>
                                <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer" value={newAssignment.professor_id} onChange={e => setNewAssignment({...newAssignment, professor_id: e.target.value})}>
                                    <option value="">Select Faculty</option>
                                    {professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subject Name</label>
                                <input required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold" placeholder="e.g. Data Structures" value={newAssignment.subject_name} onChange={e => setNewAssignment({...newAssignment, subject_name: e.target.value})} />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 mt-4">Confirm Mapping</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Timetable Assignment Modal */}
            {showSlotModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Assign Slot</h3>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[9px] font-black px-3 py-1 bg-indigo-600 text-white rounded-full uppercase tracking-widest">{DAYS[activeSlot.day]}</span>
                                    <span className="text-xs font-black text-slate-900">{SLOTS[activeSlot.slot].time}</span>
                                </div>
                            </div>
                            <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-900 p-2 rounded-2xl hover:bg-white transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleCreateEntry} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Subject Mapping</label>
                                <select required className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer" value={newEntry.assignment_id} onChange={e => setNewEntry({...newEntry, assignment_id: e.target.value})}>
                                    <option value="">Mapped Professors for this Class</option>
                                    {classAssignments.map(a => <option key={a.id} value={a.id}>{a.subject_name} ({a.professor_name})</option>)}
                                </select>
                                {classAssignments.length === 0 && (
                                    <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1.5"><AlertCircle size={12} /> No faculty mapped to this class yet. Go to "Mapping" tab first.</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Format</label>
                                    <div className="flex gap-2">
                                        {['LECTURE', 'LAB'].map(type => (
                                            <button 
                                                key={type} 
                                                type="button"
                                                onClick={() => setNewEntry({...newEntry, session_type: type})}
                                                className={`flex-1 py-3.5 rounded-xl border-4 font-black transition-all ${newEntry.session_type === type ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-50 text-slate-300'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Batch (Optional)</label>
                                    <input placeholder="e.g. B1" className="w-full px-5 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-xl outline-none focus:border-indigo-500 font-bold" value={newEntry.batch} onChange={e => setNewEntry({...newEntry, batch: e.target.value.toUpperCase()})} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Room / Lab Location</label>
                                <input required placeholder="e.g. Room 302 or Lab A" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl outline-none focus:border-indigo-500 font-bold" value={newEntry.location} onChange={e => setNewEntry({...newEntry, location: e.target.value})} />
                            </div>

                            <button 
                                disabled={classAssignments.length === 0 || (newEntry.session_type === 'LAB' && activeSlot.slot === 6)}
                                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-100 disabled:opacity-50 mt-2"
                            >
                                Confirm Allotment
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            {(entryToDelete || assignmentToDelete || professorToDelete || showResetModal || showResetMappingModal) && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-10 text-center space-y-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto text-white shadow-xl ${showResetModal || showResetMappingModal || professorToDelete ? 'bg-red-500' : 'bg-slate-900'}`}>
                            {showResetModal || showResetMappingModal ? <RefreshCcw size={40} /> : professorToDelete ? <Trash2 size={40} /> : <AlertCircle size={40} />}
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Are you sure?</h3>
                            <p className="text-slate-400 font-bold leading-relaxed">
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
                                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all"
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
                                className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl ${showResetModal || showResetMappingModal || professorToDelete ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-slate-900 hover:bg-slate-800'}`}
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
