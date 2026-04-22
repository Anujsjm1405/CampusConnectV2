import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Lock, User, GraduationCap, ChevronDown, UserCheck, Layers } from 'lucide-react';

const Login = () => {
    const [loginType, setLoginType] = useState('FACULTY'); // FACULTY or STUDENT
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [prn, setPrn] = useState('');
    const [batch, setBatch] = useState('B1');
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');
    const [error, setError] = useState('');
    const [classes, setClasses] = useState([]);
    
    const { login } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await axios.get('/api/auth/classes');
                setClasses(res.data);
                if (res.data.length > 0) {
                    setYear(res.data[0].year);
                    setDivision(res.data[0].division);
                    setBatch(res.data[0].division + '1'); // Default batch based on division
                }
            } catch (err) {
                console.error("Failed to fetch classes", err);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (division) {
            setBatch(division + '1');
        }
    }, [division]);

    const handleFacultyLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('/api/auth/login', { login_id: loginId, password });
            login(res.data.user);
            navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/professor');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        }
    };

    const handleStudentLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('/api/auth/student-login', { 
                prn, 
                name, 
                year, 
                division, 
                batch 
            });
            login(res.data.user);
            navigate('/student');
        } catch (err) {
            setError(err.response?.data?.error || 'Access failed. Please check your details.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="absolute top-6 right-6">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl transition-all active:scale-95 border shadow-sm"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </div>

            <div className="w-full max-w-md rounded-[2.5rem] overflow-hidden border transition-all duration-300 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="px-10 pt-10 pb-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
                        {loginType === 'FACULTY' ? <Lock size={32} /> : <GraduationCap size={32} />}
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>CampusConnect</h1>
                        <p className="font-bold uppercase tracking-[0.2em] text-[9px] mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {loginType === 'FACULTY' ? 'Faculty Gateway' : 'Student Hub'}
                        </p>
                    </div>
                </div>

                <div className="px-10 mb-6">
                    <div className="flex p-1 rounded-2xl border" style={{ backgroundColor: 'var(--border-secondary)', borderColor: 'var(--border-primary)' }}>
                        <button 
                            onClick={() => setLoginType('FACULTY')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] transition-all ${loginType === 'FACULTY' ? 'shadow-md scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                            style={{ 
                                backgroundColor: loginType === 'FACULTY' ? 'var(--bg-card)' : 'transparent',
                                color: 'var(--text-primary)' 
                            }}
                        >
                            <User size={12} /> FACULTY
                        </button>
                        <button 
                            onClick={() => setLoginType('STUDENT')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] transition-all ${loginType === 'STUDENT' ? 'shadow-md scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                            style={{ 
                                backgroundColor: loginType === 'STUDENT' ? 'var(--bg-card)' : 'transparent',
                                color: 'var(--text-primary)' 
                            }}
                        >
                            <GraduationCap size={14} /> STUDENT
                        </button>
                    </div>
                </div>
                
                {loginType === 'FACULTY' ? (
                    <form onSubmit={handleFacultyLogin} className="px-10 pb-10 space-y-5">
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center">{error}</div>}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Login ID</label>
                            <input 
                                type="text" required placeholder="Enter ID"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={loginId} onChange={(e) => setLoginId(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Password</label>
                            <input 
                                type="password" required placeholder="••••••••"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 mt-2">Login to Faculty</button>
                    </form>
                ) : (
                    <form onSubmit={handleStudentLogin} className="px-10 pb-10 space-y-4">
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center">{error}</div>}
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                            <input 
                                type="text" required placeholder="Enter your Name"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Student PRN</label>
                                <input 
                                    type="text" required placeholder="PRN"
                                    className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    value={prn} onChange={(e) => setPrn(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Batch</label>
                                <input 
                                    type="text" required placeholder="e.g. B1"
                                    className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm uppercase"
                                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    value={batch} onChange={(e) => setBatch(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 relative">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Year</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer appearance-none text-sm"
                                        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        value={year} onChange={(e) => setYear(e.target.value)}
                                    >
                                        {[...new Set(classes.map(c => c.year))].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={14} />
                                </div>
                            </div>
                            <div className="space-y-2 relative">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Division</label>
                                <div className="relative">
                                    <select 
                                        className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold cursor-pointer appearance-none text-sm"
                                        style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                        value={division} onChange={(e) => setDivision(e.target.value)}
                                    >
                                        {[...new Set(classes.filter(c => c.year === year).map(c => c.division))].map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" size={14} />
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 mt-2">Access Dashboard</button>
                    </form>
                )}
                
                <div className="px-10 py-5 border-t text-center" style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)' }}>
                    <p className="text-[8px] font-black uppercase tracking-[0.3em]" style={{ color: 'var(--text-secondary)' }}>IT Department Portal</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
