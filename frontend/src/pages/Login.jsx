import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Church, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/token/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const tokens = await response.json();

            if (response.ok) {
                // Fetch user profile using the access token
                const userResponse = await fetch('/api/auth/profile/', {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                const userData = await userResponse.json();

                login(userData, tokens);
                navigate('/');
            } else {
                setError(tokens.detail || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Network error. Is the server running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex overflow-hidden">
            {/* Left Side: Branding & Info (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-sda-blue via-[#002A6B] to-slate-900 relative p-12 flex-col justify-between text-white overflow-hidden">
                {/* Decorative background patterns */}
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full border-[60px] border-white/20"></div>
                  <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full border-[40px] border-white/10"></div>
                </div>

                <div className="relative z-10 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
                            <Church className="w-6 h-6 text-sda-gold" />
                        </div>
                        <span className="font-bold text-xl tracking-tight uppercase">Magwegwe West SDA</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mb-12 animate-fade-in delay-100">
                    <img src="/logo.png" alt="SDA Logo" className="w-48 mb-8 drop-shadow-2xl" />
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight uppercase">
                        Magwegwe West <br />
                        <span className="text-sda-gold">SDA Church</span>
                    </h1>
                    <p className="text-xl text-blue-100 font-light leading-relaxed">
                        Securely manage memberships, certificates, and document requests with one centralized platform.
                    </p>
                    
                    <div className="mt-12 flex flex-col gap-4">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-sda-gold animate-pulse"></div>
                        <span className="text-sm font-medium">Production-Ready & Secure</span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <span className="text-sm font-medium">Automatic Activity Logging</span>
                      </div>
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-blue-200 text-sm animate-fade-in delay-200">
                    <p>© 2026 Magwegwe West Seventh-day Adventist Church</p>
                    <div className="flex items-center gap-4">
                      <a href="#" className="hover:text-white transition-colors">Help</a>
                      <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-white dark:bg-slate-900 overflow-y-auto">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="lg:hidden flex justify-center mb-8">
                        <img src="/logo.png" alt="SDA Logo" className="h-16" />
                    </div>
                    
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Welcome Back</h2>
                        <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access your dashboard</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-xl p-4 text-center animate-shake">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Username</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-sda-blue transition-colors duration-200 text-slate-400">
                                    <User className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    className="block w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-2xl focus:ring-sda-blue/20 focus:border-sda-blue outline-none transition-all duration-300 placeholder:text-slate-400"
                                    placeholder="Enter username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                                <a href="#" className="text-xs font-bold text-sda-blue hover:text-sda-red transition-colors duration-200">Forgot Password?</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-sda-blue transition-colors duration-200 text-slate-400">
                                    <Lock className="h-5 w-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="block w-full pl-12 pr-12 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-2xl focus:ring-sda-blue/20 focus:border-sda-blue outline-none transition-all duration-300 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-sda-blue transition-colors duration-200"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center ml-1">
                          <input 
                            id="remember-me" 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-sda-blue focus:ring-sda-blue cursor-pointer" 
                          />
                          <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                            Keep me logged in
                          </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group mt-4 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl shadow-xl text-base font-bold text-white bg-gradient-to-r from-sda-blue to-blue-700 hover:from-sda-red hover:to-red-700 transform transition-all duration-300 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Authenticating...</span>
                              </div>
                            ) : (
                              <>
                                <span>Sign In to Portal</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                        </button>
                    </form>

                    <p className="mt-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      Authorized personnel only. For access issues, please contact the <span className="font-bold text-sda-blue hover:text-sda-red cursor-pointer">System Administrator</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
