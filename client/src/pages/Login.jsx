import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, Lock, User, GraduationCap, ChevronDown, UserCheck, Layers } from 'lucide-react';

const Login = () => {
    const [loginType, setLoginType] = useState('FACULTY'); // FACULTY or STUDENT
    const [prn, setPrn] = useState('');
    const [password, setPassword] = useState('');
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
            } catch (err) {
                console.error("Failed to fetch classes", err);
            }
        };
        fetchClasses();
    }, []);


    const handleFacultyLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await axios.post('/api/auth/login', { login_id: prn, password });
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
                password
            });
            login(res.data.user);
            navigate('/student');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your details.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="absolute top-6 right-6">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl active:scale-95 glass-panel"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </div>

            <div className="w-full max-w-md rounded-[2.5rem] overflow-hidden glass-panel">
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
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] ${loginType === 'FACULTY' ? 'shadow-md scale-[1.02]' : 'opacity-50 hover:opacity-80'} ${loginType === 'FACULTY'  ? 'glass-panel' : ''}`}
                            style={{ color: 'var(--text-primary)' }}
                        >
                            <User size={12} /> FACULTY
                        </button>
                        <button 
                            onClick={() => setLoginType('STUDENT')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[10px] ${loginType === 'STUDENT' ? 'shadow-md scale-[1.02]' : 'opacity-50 hover:opacity-80'} ${loginType === 'STUDENT'  ? 'glass-panel' : ''}`}
                            style={{ color: 'var(--text-primary)' }}
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
                                value={prn} onChange={(e) => setPrn(e.target.value)}
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
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Student PRN</label>
                            <input 
                                type="text" required placeholder="Enter your PRN"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={prn} onChange={(e) => setPrn(e.target.value)}
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

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 mt-2">Access Hub</button>
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
