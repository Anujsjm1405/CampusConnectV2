import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Sun, Moon, GraduationCap, ChevronDown, User, Lock, ArrowLeft } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

const Register = () => {
    const [name, setName] = useState('');
    const [prn, setPrn] = useState('');
    const [year, setYear] = useState('');
    const [division, setDivision] = useState('');
    const [batch, setBatch] = useState('');
    const [password, setPassword] = useState('');
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const { theme, toggleTheme } = React.useContext(ThemeContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const res = await axios.get('/api/auth/classes');
                setClasses(res.data);
                if (res.data.length > 0) {
                    setYear(res.data[0].year);
                    setDivision(res.data[0].division);
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

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/auth/student-register', {
                prn, name, year, division, batch, password
            });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed.');
        }
    };

    const glassStyle = {
        background: theme === 'light' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500" style={{ backgroundColor: 'var(--bg-main)' }}>
            <div className="absolute top-6 right-6 flex gap-2">
                <button 
                    onClick={toggleTheme}
                    className="p-3 rounded-2xl active:scale-95 glass-panel"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
                </button>
            </div>

            <div className="w-full max-w-lg rounded-[2.5rem] overflow-hidden border transition-all duration-300 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="px-10 pt-10 pb-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-indigo-500/20">
                        <GraduationCap size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Student Registration</h1>
                        <p className="font-bold uppercase tracking-[0.2em] text-[9px] mt-2" style={{ color: 'var(--text-secondary)' }}>Create your academic profile</p>
                    </div>
                </div>

                {success ? (
                    <div className="px-10 pb-20 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Lock size={40} />
                        </div>
                        <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Registration Successful!</h2>
                        <p className="font-bold" style={{ color: 'var(--text-secondary)' }}>Redirecting to login gateway...</p>
                    </div>
                ) : (
                    <form onSubmit={handleRegister} className="px-10 pb-10 space-y-4">
                        {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest text-center">{error}</div>}
                        
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                            <input 
                                type="text" required placeholder="Dr. John Doe"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={name} onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>PRN Number</label>
                                <input 
                                    type="text" required placeholder="Enter PRN"
                                    className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                    style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                    value={prn} onChange={(e) => setPrn(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Batch</label>
                                <input 
                                    type="text" required placeholder="B1"
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

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest ml-2" style={{ color: 'var(--text-secondary)' }}>Create Password</label>
                            <input 
                                type="password" required placeholder="••••••••"
                                className="w-full px-5 py-3.5 border-2 rounded-xl outline-none focus:border-indigo-500 font-bold transition-all text-sm"
                                style={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                                value={password} onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20 mt-4">Register Student</button>
                        
                        <div className="text-center pt-4">
                            <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:gap-3 transition-all">
                                <ArrowLeft size={12} /> Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Register;
