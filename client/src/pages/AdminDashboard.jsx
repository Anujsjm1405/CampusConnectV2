import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { 
    LogOut, Plus, Trash2, Users, User, Calendar, X, ChevronDown, 
    MapPin, AlertCircle, RefreshCcw, BookOpen, Layers, 
    LayoutGrid, UserPlus, ClipboardList, Settings, Search,
    Filter, Clock, Sun, Moon, GraduationCap, Info, Menu
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
    const [activeTab, setActiveTab] = useState('master'); // 'master' | 'timetable' | 'professors' | 'mapping' | 'locations' | 'students'
    const [mappingTab, setMappingTab] = useState('LECTURE'); // 'LECTURE' | 'LAB'
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() > 0 && new Date().getDay() < 6 ? new Date().getDay() - 1 : 0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [isRegisteringProf, setIsRegisteringProf] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [professors, setProfessors] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [masterTimetable, setMasterTimetable] = useState([]);
    const [allClasses, setAllClasses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [students, setStudents] = useState([]);

    const [showBatchPromoteModal, setShowBatchPromoteModal] = useState(false);

    const [masterFilterProf, setMasterFilterProf] = useState('');
    const [locations, setLocations] = useState([]);
    const [locationTab, setLocationTab] = useState('CLASSROOM'); // 'CLASSROOM' | 'LAB'
    const [editLocationId, setEditLocationId] = useState(null);
    
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
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [locationToDelete, setLocationToDelete] = useState(null);
    
    const [activeSlot, setActiveSlot] = useState(null);
    const [entryToDelete, setEntryToDelete] = useState(null);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [professorToDelete, setProfessorToDelete] = useState(null);

    // Form states
    const [newProf, setNewProf] = useState({ name: '', email: '', login_id: '', password: '', designation: 'Assistant Professor' });
    const [newEntry, setNewEntry] = useState({ assignment_id: '', location_id: '', session_type: 'LECTURE', batch: '', class_id: '' });
    const [newLocation, setNewLocation] = useState({ name: '', type: 'LAB', capacity: '', parent_name: '' });
    const [assignmentForm, setAssignmentForm] = useState({ 
        professor_id: '', 
        subject_name: '', 
        session_type: 'LECTURE' 
    });
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editStudentId, setEditStudentId] = useState(null);
    const [studentForm, setStudentForm] = useState({ 
        name: '', email: '', prn: '', password: '', class_id: '', batch: '' 
    });

    // Computed
    const [classAssignments, setClassAssignments] = useState([]);
    const [classAssignmentsForMaster, setClassAssignmentsForMaster] = useState([]);
    
    useEffect(() => {
        const anyModalOpen = showProfModal || showSlotModal || showDeleteModal || 
                           showResetModal || showAssignModal || showResetMappingModal || 
                           showLocationModal || showStudentModal || showBatchPromoteModal;
        if (anyModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [showProfModal, showSlotModal, showDeleteModal, showResetModal, showAssignModal, showResetMappingModal, showLocationModal, showStudentModal, showBatchPromoteModal]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    // Sync selectedDivision when selectedYear changes
    useEffect(() => {
        const availableDivisions = [...new Set(allClasses.filter(c => c.year === selectedYear).map(c => c.division))];
        if (selectedDivision && !availableDivisions.includes(selectedDivision) && availableDivisions.length > 0) {
            setSelectedDivision(availableDivisions[0]);
        }
    }, [selectedYear, allClasses]);

    useEffect(() => {
        if (!Array.isArray(allClasses)) return;
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

    const fetchStudents = async () => {
        try {
            const res = await axios.get('/api/admin/students');
            setStudents(res.data);
        } catch (err) {
            console.error("Error fetching students:", err);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [profsRes, classesRes, assignRes, locsRes] = await Promise.all([
                axios.get('/api/admin/professors'),
                axios.get('/api/admin/classes'),
                axios.get('/api/admin/assignments'),
                axios.get('/api/locations')
            ]);
            setProfessors(profsRes.data);
            setAllClasses(classesRes.data);
            setAssignments(assignRes.data);
            setLocations(locsRes.data);
            fetchStudents();
        } catch (err) {
            console.error("Error fetching initial data:", err);
        }
    };

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        }
        if (activeTab === 'master') {
            fetchMasterTimetable();
        }
        if (activeTab === 'locations') {
            fetchLocations();
        }
    }, [activeTab]);

    const fetchLocations = async () => {
        try {
            const res = await axios.get('/api/locations');
            setLocations(res.data);
        } catch (err) {
            console.error("Error fetching locations:", err);
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

    const fetchMasterTimetable = async () => {
        try {
            const res = await axios.get('/api/timetable/master');
            setMasterTimetable(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchClassAssignments = async (cid, forMaster = false) => {
        try {
            const res = await axios.get(`/api/admin/assignments/${cid}`);
            if (forMaster) {
                setClassAssignmentsForMaster(res.data);
            } else {
                setClassAssignments(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (newEntry.class_id && activeTab === 'master') {
            fetchClassAssignments(newEntry.class_id, true);
        }
    }, [newEntry.class_id, activeTab]);

    // --- Actions ---
    const handleCreateProf = async (e) => {
        if (e) e.preventDefault();
        if (isRegisteringProf) return;
        
        // Manual Validation
        if (!newProf.name || !newProf.login_id || !newProf.email || !newProf.password) {
            alert(`Incomplete Form! Please provide: ${!newProf.name ? 'Full Name, ' : ''}${!newProf.login_id ? 'Login ID, ' : ''}${!newProf.email ? 'Email ID, ' : ''}${!newProf.password ? 'Password' : ''}`);
            return;
        }

        // Debug Alert (Temporary)
        // alert('Submitting: ' + JSON.stringify(newProf));

        setIsRegisteringProf(true);
        try {
            const response = await axios.post('/api/admin/professors', newProf);
            console.log("Registration response:", response.data);
            
            setShowProfModal(false);
            setNewProf({ name: '', email: '', login_id: '', password: '', designation: 'Assistant Professor' });
            alert('Faculty member registered successfully!');
            fetchInitialData();
        } catch (err) {
            console.error("Registration error:", err);
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error occurred';
            alert('Error: ' + errorMsg);
        } finally {
            setIsRegisteringProf(false);
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
            console.error(err);
        }
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editLocationId) {
                await axios.put(`/api/locations/${editLocationId}`, newLocation);
            } else {
                await axios.post('/api/locations', newLocation);
            }
            setShowLocationModal(false);
            setEditLocationId(null);
            setNewLocation({ name: '', type: locationTab === 'CLASSROOM' ? 'CLASSROOM' : 'LAB', capacity: '', parent_name: '' });
            fetchLocations();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save resource');
        }
    };

    const handleEditLocation = (location) => {
        setEditLocationId(location.id);
        setNewLocation({
            name: location.name,
            type: location.type,
            capacity: location.capacity || '',
            parent_name: location.parent_name || ''
        });
        setShowLocationModal(true);
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            if (editStudentId) {
                await axios.put(`/api/admin/students/${editStudentId}`, studentForm);
            } else {
                await axios.post('/api/admin/students', studentForm);
            }
            setShowStudentModal(false);
            setEditStudentId(null);
            setStudentForm({ name: '', email: '', prn: '', password: '', class_id: '', batch: '' });
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to save student profile');
        }
    };

    const handleEditStudent = (student) => {
        const cls = allClasses.find(c => c.year === student.year && c.division === student.division);
        setEditStudentId(student.id);
        setStudentForm({
            name: student.name,
            email: student.email || '',
            prn: student.prn,
            password: '', // Keep empty for security unless changing
            class_id: cls ? cls.id : '',
            batch: student.batch || ''
        });
        setShowStudentModal(true);
    };

    const handleDeleteStudent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this student?')) return;
        try {
            await axios.delete(`/api/admin/students/${id}`);
            fetchStudents();
        } catch (err) {
            alert('Failed to delete student');
        }
    };

    const handleDeleteLocation = (location) => {
        setLocationToDelete(location);
    };

    const confirmDeleteLocation = async () => {
        if (!locationToDelete) return;
        try {
            await axios.delete(`/api/locations/${locationToDelete.id}`);
            setLocationToDelete(null);
            fetchLocations();
        } catch (err) {
            alert('Failed to delete resource');
        }
    };

    const handleCreateEntry = async (e) => {
        e.preventDefault();
        const targetClassId = activeTab === 'master' ? newEntry.class_id : selectedClassId;
        const currentAssignments = activeTab === 'master' ? classAssignmentsForMaster : classAssignments;
        
        const assignment = currentAssignments.find(a => a.id === parseInt(newEntry.assignment_id));
        if (!assignment) return alert('Please select a subject mapping');

        try {
            await axios.post('/api/timetable', {
                class_id: targetClassId,
                professor_id: assignment.professor_id,
                subject: assignment.subject_name,
                location_id: newEntry.location_id,
                day_of_week: activeSlot.day + 1,
                start_slot: activeSlot.slot,
                session_type: newEntry.session_type,
                batch: newEntry.batch
            });
            setShowSlotModal(false);
            setNewEntry({ assignment_id: '', location_id: '', session_type: 'LECTURE', batch: '', class_id: '' });
            fetchTimetable();
            fetchMasterTimetable();
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
            fetchMasterTimetable();
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



    const handleBatchPromote = async () => {
        if (isPromoting) return;
        if (!confirm('This will promote all SY/TY students and PERMANENTLY DELETE graduating B.Tech students. Proceed?')) return;
        
        setIsPromoting(true);
        try {
            const res = await axios.post('/api/admin/promote-students');
            const { promoted, graduated } = res.data.details || {};
            alert(`Promotion complete!\nPromoted: ${promoted}\nGraduated (Removed): ${graduated}`);
            setShowBatchPromoteModal(false);
            fetchStudents();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to promote students');
        } finally {
            setIsPromoting(false);
        }
    };

    const renderStatusBadge = () => (
        <div className="flex items-center gap-3 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-2xl border-2 border-black/20 dark:border-white/20 backdrop-blur-md">
            <div className={`w-2 h-2 rounded-full animate-pulse ${currentTime.getDay() >= 1 && currentTime.getDay() <= 5 && currentTime.getHours() >= 9 && currentTime.getHours() < 18 ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                {currentTime.getDay() >= 1 && currentTime.getDay() <= 5 && currentTime.getHours() >= 9 && currentTime.getHours() < 18 ? 'Active' : 'Inactive'}
            </span>
            <div className="w-px h-3 bg-black/20 dark:bg-white/20 mx-1"></div>
            <span className="text-sm font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                <span className="mx-2 opacity-20">|</span>
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
        </div>
    );

    const YEAR_COLORS = {
        'SY': '#3b82f6',
        'TY': '#10b981',
        'B.Tech': '#8b5cf6',
        'FY M.Tech': '#ec4899',
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

    const getMasterEntriesAt = (dayIndex, slotIndex) => {
        let filtered = masterTimetable.filter(e => e.day_of_week === dayIndex + 1 && 
            (e.start_slot === slotIndex || (e.session_type === 'LAB' && e.start_slot === slotIndex - 1))
        );
        if (masterFilterProf) {
            filtered = filtered.filter(e => e.professor_id === parseInt(masterFilterProf));
        }
        return filtered.sort((a, b) => {
            if (a.year !== b.year) return a.year.localeCompare(b.year);
            return a.division.localeCompare(b.division);
        });
    };

    const years = Array.isArray(allClasses) ? [...new Set(allClasses.map(c => c.year))] : [];
    const divisions = Array.isArray(allClasses) ? [...new Set(allClasses.filter(c => c.year === selectedYear).map(c => c.division))] : [];

    return (
        <div className="min-h-screen pb-20 font-sans transition-colors duration-300" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
            {/* Nav Bar */}
            <header className="border-b-2 px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40 shadow-md flex justify-between items-center backdrop-blur-md transition-colors duration-300 border-black/10 dark:border-white/10" style={{ backgroundColor: 'var(--bg-header)' }}>
                <div className="flex-1 flex items-center">
                    <img src="/assets/logo.png" alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
                </div>
                <div className="flex flex-col items-center flex-1 text-center">
                    <h2 className="text-2xl font-black tracking-tighter" style={{ color: 'var(--text-primary)' }}>
                        Campus<span className="text-indigo-600">Connect</span>
                    </h2>
                    <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.3em]">
                        <span className="font-black" style={{ color: 'var(--text-primary)' }}>ADMIN</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
                    <button 
                        onClick={toggleTheme}
                        className="p-2 md:p-3 rounded-xl active:scale-95 glass-panel"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        {theme === 'light' ? <Moon size={20} className="md:w-5 md:h-5" /> : <Sun size={20} className="md:w-5 md:h-5" />}
                    </button>
                    
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2.5 md:p-3 rounded-xl md:rounded-2xl border transition-all hover:bg-black/5"
                            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        >
                            <Menu size={20} className="text-indigo-600 md:w-6 md:h-6" />
                        </button>

                        {showMenu && (
                            <div className="absolute top-full mt-2 right-0 w-64 rounded-[2.5rem] p-3 z-[100] animate-in slide-in-from-top-2 duration-200 glass-panel shadow-2xl" style={{ backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.98)' : 'rgba(20, 20, 20, 0.98)' }}>
                                {[
                                    { id: 'master', label: 'Master Timetable', icon: LayoutGrid },
                                    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
                                    { id: 'professors', label: 'Professors', icon: Users },
                                    { id: 'mapping', label: 'Faculty Mapping', icon: ClipboardList },
                                    { id: 'locations', label: 'Classrooms & Labs', icon: MapPin },
                                    { id: 'students', label: 'Students & Promotion', icon: GraduationCap },
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

                    <button 
                        onClick={logout}
                        className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95 dark:bg-red-900/20 dark:text-red-400"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>



            {/* Selection Bar (Shared for Timetable & Mapping) */}
            {(activeTab === 'timetable' || activeTab === 'mapping' || activeTab === 'students') && (
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
                
                {/* --- TAB 0: MASTER TIMETABLE --- */}
                {activeTab === 'master' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Master Timetable</h2>
                                    {renderStatusBadge()}
                                </div>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Unified view of all classes and faculty assignments</p>
                                
                                <div className="flex flex-wrap items-center gap-3 mt-4 pt-2">
                                    {Object.entries(YEAR_COLORS).map(([year, color]) => (
                                        <div key={year} className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }}></div>
                                            <span className="text-[10px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>{year}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-1.5 ml-2 md:ml-4 border-l pl-2 md:pl-4" style={{ borderColor: 'var(--border-primary)' }}>
                                        <div className="w-3 h-3 rounded-sm border-[1.5px] border-dashed" style={{ borderColor: 'var(--text-secondary)' }}></div>
                                        <span className="text-[10px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Lab Session</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <select 
                                        className="w-full pl-11 pr-4 py-3 rounded-xl border-2 outline-none focus:border-indigo-500 font-bold text-xs appearance-none"
                                        style={{ backgroundColor: theme === 'light' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(30, 30, 30, 0.95)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        value={masterFilterProf}
                                        onChange={e => setMasterFilterProf(e.target.value)}
                                    >
                                        <option value="">All Faculty</option>
                                        {Array.isArray(professors) && professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <button 
                                    onClick={fetchMasterTimetable}
                                    className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <RefreshCcw size={14} /> Refresh
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] md:rounded-[2.5rem]  overflow-hidden glass-panel">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b-2" style={{ backgroundColor: 'var(--border-secondary)', borderColor: 'var(--border-primary)' }}>
                                            <th className="p-6 text-left text-[10px] font-black uppercase tracking-widest border-r min-w-[140px]" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}>Slot Time</th>
                                            {DAYS.map(day => (
                                                <th key={day} className="p-6 text-center text-[10px] font-black uppercase tracking-widest min-w-[200px]" style={{ color: 'var(--text-primary)' }}>{day}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {SLOTS.map(slot => (
                                            <tr key={slot.id} className="border-b last:border-0" style={{ borderColor: 'var(--border-primary)' }}>
                                                <td className="p-6 border-r" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-main)' }}>
                                                    <div className="text-[11px] font-black text-center" style={{ color: 'var(--text-primary)' }}>
                                                        {slot.time}
                                                    </div>
                                                </td>
                                                {DAYS.map((day, dayIdx) => {
                                                    const entries = getMasterEntriesAt(dayIdx, slot.id);
                                                    return (
                                                        <td key={day} className="p-2 border-r min-h-[120px]" style={{ borderColor: 'var(--border-primary)' }}>
                                                            <div className="flex flex-col gap-2">
                                                                {entries.map(entry => (
                                                                    <div key={entry.id} className="p-3 rounded-xl text-white shadow-sm space-y-1 relative group overflow-hidden" style={{ backgroundColor: YEAR_COLORS[entry.year] || '#4f46e5', border: entry.session_type === 'LAB' ? '2px dashed rgba(255,255,255,0.6)' : 'none' }}>
                                                                        <div className="flex justify-between items-start">
                                                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/20">{entry.year}-{entry.division}</span>
                                                                            <div className="flex items-center gap-1">
                                                                                {entry.batch && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-white/10">{entry.batch}</span>}
                                                                                <button 
                                                                                    onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry); setShowDeleteModal(true); }}
                                                                                    className="p-1 rounded bg-white/10 hover:bg-red-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <Trash2 size={10} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-black text-[10px] truncate">{entry.subject}</div>
                                                                        <div className="text-[8px] font-bold opacity-80 flex items-center gap-1"><Users size={8} /> {entry.professor_name}</div>
                                                                        <div className="text-[8px] font-bold opacity-80 flex items-center gap-1"><MapPin size={8} /> {entry.location_name || 'N/A'}</div>
                                                                    </div>
                                                                ))}
                                                                
                                                                <button 
                                                                    onClick={() => { setActiveSlot({ day: dayIdx, slot: slot.id }); setShowSlotModal(true); }}
                                                                    className="w-full py-2 border-2 border-dashed rounded-xl flex items-center justify-center transition-all hover:bg-black/5 group/btn"
                                                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                                                >
                                                                    <Plus size={14} className="opacity-40 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                                                                </button>
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

                {/* --- TAB 1: TIMETABLE --- */}
                {activeTab === 'timetable' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Class Timetable</h2>
                                    {renderStatusBadge()}
                                </div>
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
                        <div className="rounded-[1.5rem] md:rounded-[2.5rem]  overflow-hidden transition-colors duration-300 glass-panel">
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
                                                                                <span>{entry.location_name || 'N/A'}</span>
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
                                                                    <MapPin size={12} /> {entry.location_name || 'N/A'}
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
                                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Professor Registry</h2>
                                    {renderStatusBadge()}
                                </div>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Manage all registered faculty members</p>
                            </div>
                            <button 
                                onClick={() => { setNewProf({ name: '', email: '', login_id: '', password: '', designation: 'Assistant Professor' }); setShowProfModal(true); }}
                                className="w-full md:w-auto px-6 py-3.5 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                                <UserPlus size={18} /> Register New
                            </button>
                        </div>

                        <div className="rounded-[1.5rem] md:rounded-[2.5rem]  overflow-hidden glass-panel">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Professor Name</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Email</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Designation</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Login ID</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: 'var(--border-primary)' }}>
                                        {Array.isArray(professors) && professors.map(p => (
                                            <tr key={p.id} className="hover:bg-black/5 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>{p.name?.[0] || '?'}</div>
                                                        <div className="font-black" style={{ color: 'var(--text-primary)' }}>{p.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{p.email || '-'}</td>
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
                                {Array.isArray(professors) && professors.map(p => (
                                    <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black shrink-0" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>{p.name?.[0] || '?'}</div>
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
                                    <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                        <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Faculty Mapping</h2>
                                        {renderStatusBadge()}
                                    </div>
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
                                .filter(ass => ass?.session_type === mappingTab)
                                .map(ass => (
                                <div key={ass.id} className="p-4 md:p-6 rounded-2xl md:rounded-[2rem]  group hover:border-indigo-400 transition-all relative overflow-hidden glass-panel">
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
                                                     ass.session_type === 'LAB' ? 'bg-purple-100 text-purple-600' : 
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
                {/* --- TAB 4: STUDENTS & PROMOTION --- */}
                {activeTab === 'students' && (
                    <div className="space-y-8 relative z-10">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative z-20">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Student Directory</h2>
                                    {renderStatusBadge()}
                                </div>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Manage student profiles and academic transitions</p>
                            </div>
                            <div className="flex flex-col md:flex-row gap-2">
                                <button 
                                    onClick={() => setShowBatchPromoteModal(true)}
                                    className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <Layers size={18} /> Batch Promote
                                </button>
                                <button 
                                    onClick={() => setShowStudentModal(true)}
                                    className="w-full md:w-auto px-6 py-3.5 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={18} /> Register Student
                                </button>
                            </div>
                        </div>

                        <div className="rounded-[1.5rem] md:rounded-[2.5rem]  overflow-hidden glass-panel">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Student Name</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Email</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>PRN</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Class</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Batch</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                            <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: 'var(--border-primary)' }}>
                                        {Array.isArray(students) && students.filter(s => s?.year === selectedYear && s?.division === selectedDivision).map(s => (
                                            <tr key={s.id} className="hover:bg-black/5 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--accent-primary)', border: '1px solid var(--border-primary)' }}>
                                                            <User size={18} />
                                                        </div>
                                                        <div className="font-black" style={{ color: 'var(--text-primary)' }}>{s.name}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{s.email || '-'}</td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{s.prn}</td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-primary)' }}>{s.year} - {s.division}</td>
                                                <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{s.batch || 'Full Class'}</td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        {s.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleEditStudent(s)}
                                                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                        >
                                                            <Settings size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStudent(s.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {Array.isArray(students) && students.filter(s => s?.year === selectedYear && s?.division === selectedDivision).length === 0 && (
                                <div className="px-8 py-20 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>No students registered for this class yet.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB 5: LOCATIONS (Classrooms & Labs) --- */}
                {activeTab === 'locations' && (
                    <div className="space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <h2 className="text-2xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Department Resources</h2>
                                    {renderStatusBadge()}
                                </div>
                                <p className="font-bold uppercase tracking-widest text-[10px] md:text-xs" style={{ color: 'var(--text-secondary)' }}>Manage all allocated classrooms and specialized labs</p>
                            </div>
                            <div className="flex gap-2 p-1.5 rounded-2xl border" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                {['CLASSROOM', 'LAB'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setLocationTab(t)}
                                        className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${locationTab === t ? 'text-white shadow-lg' : 'hover:bg-black/5'}`}
                                        style={{ backgroundColor: locationTab === t ? 'var(--accent-primary)' : 'transparent', color: locationTab === t ? '#fff' : 'var(--text-secondary)' }}
                                    >
                                        {t === 'CLASSROOM' ? 'Classrooms' : 'Labs'}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => {
                                    setEditLocationId(null);
                                    setNewLocation({ name: '', type: locationTab === 'CLASSROOM' ? 'CLASSROOM' : 'LAB', capacity: '', parent_name: '' });
                                    setShowLocationModal(true);
                                }}
                                className="w-full md:w-auto px-6 py-3.5 text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                                <Plus size={18} /> Register {locationTab === 'CLASSROOM' ? 'Classroom' : 'Lab'}
                            </button>
                        </div>

                        <div className="rounded-[1.5rem] md:rounded-[2.5rem]  overflow-hidden glass-panel">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                        <tr>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Resource Name</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Type</th>
                                            <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Capacity</th>
                                            <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{ divideColor: 'var(--border-primary)' }}>
                                        {locationTab === 'CLASSROOM' ? (
                                            Array.isArray(locations) && locations.filter(l => l?.type === 'CLASSROOM').map(classroom => (
                                                <tr key={classroom.id} className="hover:bg-black/5 transition-colors group">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
                                                                <BookOpen size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-sm uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{classroom.name}</div>
                                                                <div className="text-[9px] font-black opacity-50 uppercase tracking-widest text-emerald-500">Classroom</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-emerald-100 text-emerald-600`}>
                                                            {classroom.type}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{classroom.capacity || 'N/A'} Students</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleEditLocation(classroom)}
                                                                className="p-3 rounded-xl transition-all hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                style={{ color: 'var(--text-secondary)' }}
                                                            >
                                                                <Settings size={20} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteLocation(classroom)}
                                                                className="p-3 rounded-xl transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                style={{ color: 'var(--text-secondary)' }}
                                                            >
                                                                <Trash2 size={20} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            (() => {
                                                const labLocations = Array.isArray(locations) ? locations.filter(l => l?.type === 'LAB') : [];
                                                const parents = labLocations.filter(l => !l.parent_id);
                                                const orphans = labLocations.filter(l => l.parent_id && !parents.some(p => p.id === l.parent_id));
                                                
                                                return [...parents, ...orphans].map(parent => (
                                                    <React.Fragment key={parent.id}>
                                                        {/* Parent Row */}
                                                        <tr className="hover:bg-black/5 transition-colors group">
                                                            <td className="px-8 py-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}>
                                                                        <Layers size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-black text-sm uppercase tracking-tight" style={{ color: 'var(--text-primary)' }}>{parent.name}</div>
                                                                        <div className="text-[9px] font-black opacity-50 uppercase tracking-widest text-indigo-500">Main Lab / Root</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-indigo-600 text-white shadow-lg shadow-indigo-500/20`}>
                                                                    {parent.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-6 font-bold" style={{ color: 'var(--text-secondary)' }}>{parent.capacity || 'N/A'} Students</td>
                                                            <td className="px-8 py-6 text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button 
                                                                        onClick={() => handleEditLocation(parent)}
                                                                        className="p-3 rounded-xl transition-all hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                    >
                                                                        <Settings size={20} />
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteLocation(parent)}
                                                                        className="p-3 rounded-xl transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                        style={{ color: 'var(--text-secondary)' }}
                                                                    >
                                                                        <Trash2 size={20} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                        
                                                        {/* Children Rows */}
                                                        {labLocations
                                                            .filter(child => child.parent_id === parent.id)
                                                            .map(child => (
                                                                <tr key={child.id} className="bg-black/[0.02] dark:bg-white/[0.01] hover:bg-black/5 transition-colors border-l-4 border-indigo-500/30">
                                                                    <td className="px-8 py-5 pl-16">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}>
                                                                                <Settings size={14} />
                                                                            </div>
                                                                            <div>
                                                                                <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{child.name}</div>
                                                                                <div className="text-[8px] font-black opacity-40 uppercase">Sub-resource</div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-8 py-5">
                                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-purple-100 text-purple-600`}>
                                                                            {child.type}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-8 py-5 text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{child.capacity || 'N/A'} Students</td>
                                                                    <td className="px-8 py-5 text-center">
                                                                        <div className="flex items-center justify-center gap-2">
                                                                            <button 
                                                                                onClick={() => handleEditLocation(child)}
                                                                                className="p-2 rounded-xl transition-all hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                                style={{ color: 'var(--text-secondary)' }}
                                                                            >
                                                                                <Settings size={16} />
                                                                            </button>
                                                                            <button 
                                                                                onClick={() => handleDeleteLocation(child)}
                                                                                className="p-2 rounded-xl transition-all hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                                style={{ color: 'var(--text-secondary)' }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                    </React.Fragment>
                                                ));
                                            })()
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {locations.length === 0 && (
                                <div className="px-8 py-20 text-center font-bold" style={{ color: 'var(--text-secondary)' }}>No resources registered yet.</div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}
            
            {/* Professor Registration Modal */}
            {showProfModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Register Faculty</h3>
                            <button onClick={() => setShowProfModal(false)} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Full Legal Name</label>
                                        <input className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="Dr. John Smith" value={newProf.name} onChange={e => setNewProf({...newProf, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Login ID</label>
                                        <input className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="smith_j" value={newProf.login_id} onChange={e => setNewProf({...newProf, login_id: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Email ID</label>
                                        <input type="email" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="smith@college.edu" value={newProf.email} onChange={e => setNewProf({...newProf, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Designation</label>
                                        <select className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newProf.designation} onChange={e => setNewProf({...newProf, designation: e.target.value})}>
                                            {['Professor', 'Associate Professor', 'Assistant Professor', 'HOD'].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Security Password</label>
                                    <input type="password" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="••••••••" value={newProf.password} onChange={e => setNewProf({...newProf, password: e.target.value})} />
                                </div>
                                <div className="pt-6">
                                    <button 
                                        onClick={handleCreateProf}
                                        disabled={isRegisteringProf}
                                        className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl transform active:scale-[0.98] disabled:opacity-50" 
                                        style={{ backgroundColor: 'var(--accent-primary)' }}
                                    >
                                        {isRegisteringProf ? 'Registering...' : 'Confirm Registration'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Mapping Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                            <div>
                                <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Faculty Allotment</h3>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] mt-3" style={{ color: 'var(--accent-primary)' }}>For {selectedYear} - {selectedDivision}</p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                            <form onSubmit={handleAddAssignment} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Assign Professor</label>
                                    <select required className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={assignmentForm.professor_id} onChange={e => setAssignmentForm({...assignmentForm, professor_id: e.target.value})}>
                                        <option value="">Select Faculty Member</option>
                                        {Array.isArray(professors) && professors.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Subject Name</label>
                                    <input required className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="e.g. Data Structures" value={assignmentForm.subject_name} onChange={e => setAssignmentForm({...assignmentForm, subject_name: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Mapping Format</label>
                                    <div className="flex gap-3">
                                        {['LECTURE', 'LAB', 'BOTH'].map(type => (
                                            <button 
                                                key={type} 
                                                type="button"
                                                onClick={() => setAssignmentForm(prev => ({...prev, session_type: type}))}
                                                className={`flex-1 py-4 md:py-4.5 rounded-2xl md:rounded-[2rem] border-2 font-black transition-all text-xs tracking-widest ${
                                                    assignmentForm.session_type === type 
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20' 
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
                                <div className="pt-6">
                                    <button className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl transform active:scale-[0.98]" style={{ backgroundColor: 'var(--accent-primary)' }}>Confirm Mapping</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Location Registration Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{editLocationId ? 'Edit Resource' : 'Register Resource'}</h3>
                            <button onClick={() => setShowLocationModal(false)} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                            <form onSubmit={handleLocationSubmit} className="space-y-8">
                                {newLocation.type === 'LAB' && (
                                    <div className="flex gap-4 p-5 rounded-[2rem] border-2 bg-indigo-50/50 dark:bg-indigo-900/10" style={{ borderColor: 'var(--border-primary)' }}>
                                        <label className="flex items-center gap-4 cursor-pointer flex-1 group">
                                            <input 
                                                type="checkbox" 
                                                className="w-6 h-6 rounded-xl border-2 accent-indigo-600 cursor-pointer shadow-sm"
                                                checked={!newLocation.parent_name || newLocation.parent_name === newLocation.name}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewLocation({...newLocation, parent_name: newLocation.name});
                                                    } else {
                                                        setNewLocation({...newLocation, parent_name: ''});
                                                    }
                                                }}
                                            />
                                            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:opacity-80 transition-all">Register as Main Hub</span>
                                        </label>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Resource Name</label>
                                        <input 
                                            required 
                                            className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" 
                                            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                            placeholder={newLocation.type === 'LAB' ? "e.g. Computer Lab 1" : "e.g. Room 302"} 
                                            value={newLocation.name} 
                                            onChange={e => {
                                                const isMain = !newLocation.parent_name || newLocation.parent_name === newLocation.name;
                                                setNewLocation({
                                                    ...newLocation, 
                                                    name: e.target.value,
                                                    parent_name: isMain ? e.target.value : newLocation.parent_name
                                                });
                                            }} 
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Student Capacity</label>
                                        <input type="number" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} placeholder="60" value={newLocation.capacity} onChange={e => setNewLocation({...newLocation, capacity: e.target.value})} />
                                    </div>
                                </div>

                                {newLocation.type === 'LAB' && (!newLocation.parent_name || newLocation.parent_name !== newLocation.name) && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Parent Resource (Mandatory)</label>
                                        <div className="relative">
                                            <input 
                                                required 
                                                list="parent-labs"
                                                className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" 
                                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                                placeholder="Select or type Parent Hub"
                                                value={newLocation.parent_name} 
                                                onChange={e => setNewLocation({...newLocation, parent_name: e.target.value})}
                                            />
                                            <datalist id="parent-labs">
                                                {locations
                                                    .filter(l => l.type === 'LAB' && !l.parent_id && l.id !== editLocationId)
                                                    .map(l => (
                                                        <option key={l.id} value={l.name} />
                                                    ))}
                                            </datalist>
                                        </div>
                                    </div>
                                )}
                                <div className="pt-6">
                                    <button className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl transform active:scale-[0.98]" style={{ backgroundColor: 'var(--accent-primary)' }}>{editLocationId ? 'Save Changes' : 'Confirm Registration'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

             {/* Timetable Assignment Modal */}
             {showSlotModal && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                     <div className="w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                         {/* Header - Fixed at top */}
                         <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                             <div>
                                 <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Assign Allotment</h3>
                                 <div className="flex items-center gap-3 mt-3">
                                     <span className="text-[10px] md:text-xs font-black px-3 md:px-4 py-1 md:py-1.5 text-white rounded-full uppercase tracking-widest" style={{ backgroundColor: 'var(--accent-primary)' }}>{DAYS[activeSlot.day]}</span>
                                     <span className="text-xs md:text-sm font-black" style={{ color: 'var(--text-primary)' }}>{SLOTS[activeSlot.slot].time}</span>
                                 </div>
                             </div>
                             <button onClick={() => setShowSlotModal(false)} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                         </div>

                         {/* Body - Scrollable */}
                         <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                             <form onSubmit={handleCreateEntry} className="space-y-8">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     {activeTab === 'master' && (
                                         <div className="space-y-3">
                                             <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Target Class</label>
                                             <select required className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newEntry.class_id} onChange={e => setNewEntry({...newEntry, class_id: e.target.value, assignment_id: ''})}>
                                                 <option value="">Select Class</option>
                                                 {Array.isArray(allClasses) && allClasses.map(c => <option key={c.id} value={c.id}>{c.year} - {c.division}</option>)}
                                             </select>
                                         </div>
                                     )}

                                     <div className="space-y-3">
                                         <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Format</label>
                                         <div className="flex gap-3">
                                             {['LECTURE', 'LAB'].map(type => (
                                                 <button 
                                                     key={type} 
                                                     type="button"
                                                     onClick={() => setNewEntry({...newEntry, session_type: type})}
                                                     className={`flex-1 py-4 md:py-4.5 rounded-2xl md:rounded-[2rem] border-2 font-black transition-all text-xs tracking-widest ${
                                                         newEntry.session_type === type 
                                                         ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-500/20' 
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
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-3">
                                         <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Subject Mapping</label>
                                         <select 
                                             required 
                                             disabled={activeTab === 'master' && !newEntry.class_id}
                                             className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base disabled:opacity-50 shadow-sm" 
                                             style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                             value={newEntry.assignment_id} 
                                             onChange={e => setNewEntry({...newEntry, assignment_id: e.target.value})}
                                         >
                                             <option value="">{activeTab === 'master' && !newEntry.class_id ? 'Pick a class first' : 'Select Faculty'}</option>
                                             {(activeTab === 'master' ? classAssignmentsForMaster : classAssignments)
                                                 .filter(a => {
                                                     if (newEntry.session_type === 'LECTURE') return a.session_type === 'LECTURE' || a.session_type === 'BOTH';
                                                     if (newEntry.session_type === 'LAB') return a.session_type === 'LAB' || a.session_type === 'BOTH';
                                                     return true;
                                                 })
                                                 .map(a => <option key={a.id} value={a.id}>{a.subject_name} ({a.professor_name})</option>)}
                                         </select>
                                     </div>

                                     <div className="space-y-3">
                                         <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Location</label>
                                         <select 
                                             required 
                                             className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold appearance-none cursor-pointer text-sm md:text-base shadow-sm" 
                                             style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                             value={newEntry.location_id} 
                                             onChange={e => setNewEntry({...newEntry, location_id: e.target.value})}
                                         >
                                             <option value="">Select {newEntry.session_type === 'LAB' ? 'Laboratory' : 'Classroom'}</option>
                                             {locations
                                                 .filter(l => {
                                                     if (newEntry.session_type === 'LECTURE') return l.type === 'CLASSROOM';
                                                     if (newEntry.session_type === 'LAB') return l.type === 'LAB';
                                                     return true;
                                                 })
                                                 .sort((a, b) => a.name.localeCompare(b.name))
                                                 .map(l => (
                                                 <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                                             ))}
                                         </select>
                                     </div>
                                 </div>

                                 {newEntry.session_type === 'LAB' && (
                                     <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                                         <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Batch Assignment</label>
                                         <input placeholder="e.g. B1" required className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-indigo-500 font-bold text-sm md:text-base shadow-sm" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={newEntry.batch} onChange={e => setNewEntry({...newEntry, batch: e.target.value.toUpperCase()})} />
                                     </div>
                                 )}

                                 <div className="pt-6">
                                     <button 
                                         disabled={(activeTab === 'master' ? (classAssignmentsForMaster?.length === 0) : (classAssignments?.length === 0)) || (newEntry.session_type === 'LAB' && activeSlot?.slot === 6)}
                                         className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl disabled:opacity-50 transform active:scale-[0.98]"
                                         style={{ backgroundColor: 'var(--accent-primary)' }}
                                     >
                                         Confirm Allotment
                                     </button>
                                 </div>
                             </form>
                         </div>
                     </div>
                 </div>
             )}

            {/* Batch Promotion Modal */}
            {showBatchPromoteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                            <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>Global Batch Promotion</h3>
                            <button onClick={() => setShowBatchPromoteModal(false)} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-8">
                            <div className="text-center space-y-4">
                                <p className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: 'var(--text-secondary)' }}>Automated Workflow</p>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Promote SY Students', desc: 'Migration to TY (Third Year)', color: 'bg-indigo-500' },
                                        { label: 'Promote TY Students', desc: 'Migration to B.Tech (Final Year)', color: 'bg-indigo-500' },
                                        { label: 'Process Graduation', desc: 'Clear B.Tech & M.Tech Students', color: 'bg-red-500' }
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-center gap-6 p-5 rounded-3xl border-2 text-left transition-all hover:border-indigo-500" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                                            <div className={`w-3 h-3 rounded-full ${step.color} shadow-lg shadow-current/20`}></div>
                                            <div>
                                                <p className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>{step.label}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-[2rem] border-2 border-red-100 dark:border-red-900/30">
                                <div className="flex gap-4 items-start">
                                    <div className="p-2 bg-red-500 rounded-xl text-white shadow-lg"><AlertCircle size={20} /></div>
                                    <div>
                                        <p className="font-black text-xs text-red-600 dark:text-red-400 uppercase tracking-widest">Permanent Action</p>
                                        <p className="font-bold text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>Graduating students will be permanently removed from the active database. Ensure you have exported all necessary data before proceeding.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button 
                                    onClick={handleBatchPromote}
                                    disabled={isPromoting}
                                    className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl bg-indigo-600 shadow-indigo-500/20 transform active:scale-[0.98] disabled:opacity-50"
                                >
                                    {isPromoting ? 'Executing Cycle...' : 'Execute Promotion Cycle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Modal */}


            {/* Student Registration Modal */}
            {showStudentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="w-full max-w-2xl max-h-[95vh] flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="px-8 md:px-12 py-8 md:py-10 border-b flex justify-between items-center shrink-0" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a', borderColor: 'var(--border-primary)' }}>
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600 shadow-inner">{editStudentId ? <Settings size={28} /> : <UserPlus size={28} />}</div>
                                <h3 className="font-black text-2xl md:text-3xl tracking-tight" style={{ color: 'var(--text-primary)' }}>{editStudentId ? 'Edit Profile' : 'New Enrollment'}</h3>
                            </div>
                            <button onClick={() => { setShowStudentModal(false); setEditStudentId(null); setStudentForm({ name: '', email: '', prn: '', password: '', class_id: '', batch: '' }); }} className="p-3 rounded-3xl hover:bg-black/5 dark:hover:bg-white/5 transition-all" style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                            <form onSubmit={handleAddStudent} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Full Legal Name</label>
                                        <input required placeholder="John Doe" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold text-sm md:text-base shadow-sm transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={studentForm.name} onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Personal Email</label>
                                        <input required type="email" placeholder="john@example.com" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold text-sm md:text-base shadow-sm transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={studentForm.email} onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>PRN Number</label>
                                        <input required placeholder="Enter PRN" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold text-sm md:text-base shadow-sm transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={studentForm.prn} onChange={(e) => setStudentForm({ ...studentForm, prn: e.target.value })} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>{editStudentId ? 'Change Password (Optional)' : 'Login Password'}</label>
                                        <input required={!editStudentId} type="password" placeholder="••••••••" className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold text-sm md:text-base shadow-sm transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={studentForm.password} onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Academic Class</label>
                                        <select required className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold appearance-none cursor-pointer text-sm md:text-base shadow-sm transition-all" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} value={studentForm.class_id} onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}>
                                            <option value="">Select Class</option>
                                            {allClasses.map(c => (
                                                <option key={c.id} value={c.id}>{c.year} - {c.division === 'No Div' ? 'GEN' : c.division}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] ml-2" style={{ color: 'var(--text-secondary)' }}>Practical Batch</label>
                                        <input 
                                            placeholder="e.g. Batch 1" 
                                            className="w-full px-6 md:px-7 py-4 md:py-4.5 border-2 rounded-2xl md:rounded-[2rem] outline-none focus:border-emerald-500 font-bold text-sm md:text-base shadow-sm transition-all" 
                                            style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} 
                                            value={studentForm.batch} 
                                            onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })} 
                                        />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button type="submit" className="w-full text-white py-5 md:py-6 rounded-2xl md:rounded-[2.5rem] font-black text-lg md:text-xl hover:opacity-90 transition-all shadow-2xl bg-emerald-600 shadow-emerald-500/20 transform active:scale-[0.98]">
                                        {editStudentId ? 'Save Changes' : 'Register Student Profile'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modals */}
            {(entryToDelete || assignmentToDelete || professorToDelete || locationToDelete || showResetModal || showResetMappingModal) && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                    <div className="w-full max-w-xl flex flex-col rounded-[2.5rem] md:rounded-[3.5rem] overflow-hidden animate-in fade-in zoom-in duration-500 shadow-2xl" style={{ backgroundColor: theme === 'light' ? '#ffffff' : '#1a1a1a' }}>
                        <div className="p-10 md:p-12 text-center space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white shadow-2xl transform hover:scale-110 transition-all duration-500 ${showResetModal || showResetMappingModal || professorToDelete || locationToDelete ? 'bg-red-500 shadow-red-500/20' : 'bg-slate-900 shadow-slate-900/20'}`}>
                                {showResetModal || showResetMappingModal ? <RefreshCcw size={48} className="animate-spin-slow" /> : (professorToDelete || locationToDelete) ? <Trash2 size={48} /> : <AlertCircle size={48} />}
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Are you sure?</h3>
                                <p className="text-sm md:text-base font-bold leading-relaxed opacity-70 px-4" style={{ color: 'var(--text-secondary)' }}>
                                    {showResetModal ? `This will wipe the entire schedule for ${selectedYear} - ${selectedDivision}. All slots will be vacated.` : 
                                     showResetMappingModal ? `This will clear all subject mappings for ${selectedYear} - ${selectedDivision}. Faculty assignments will be lost.` :
                                     professorToDelete ? `Deleting ${professorToDelete.name} will also remove all their active assignments and associated timetable slots.` :
                                     assignmentToDelete ? `This mapping for ${assignmentToDelete.subject_name} will be permanently removed.` :
                                     locationToDelete ? `Deleting ${locationToDelete.name} will also vacate all timetable slots currently using this resource.` :
                                     `The session "${entryToDelete?.subject}" will be deleted from the class timetable.`}
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-4">
                                <button 
                                    onClick={() => { setEntryToDelete(null); setAssignmentToDelete(null); setProfessorToDelete(null); setLocationToDelete(null); setShowResetModal(false); setShowResetMappingModal(false); }}
                                    className="flex-1 py-5 rounded-2xl md:rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black/5 dark:hover:bg-white/5 transition-all border-2"
                                    style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                >
                                    No, Keep it
                                </button>
                                <button 
                                    onClick={() => {
                                        if (showResetModal) handleResetTimetable();
                                        else if (showResetMappingModal) handleResetMappings();
                                        else if (professorToDelete) handleDeleteProfessor();
                                        else if (assignmentToDelete) handleDeleteAssignment();
                                        else if (locationToDelete) confirmDeleteLocation();
                                        else handleDeleteEntry();
                                    }}
                                    className={`flex-1 py-5 rounded-2xl md:rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] text-white transition-all active:scale-95 shadow-xl ${showResetModal || showResetMappingModal || professorToDelete || locationToDelete ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 dark:bg-slate-800'}`}
                                >
                                    Yes, Proceed
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
