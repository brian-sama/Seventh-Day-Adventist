import React, { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Church, User as UserIcon, Bell, Settings } from 'lucide-react';
import NotificationHub from './NotificationHub';
import { useState } from 'react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
            {/* Navigation Header */}
            <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="flex items-center gap-3">
                                <img src="/logo.png" alt="SDA Logo" className="h-10 w-auto" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-lg leading-none tracking-tight text-sda-blue dark:text-white uppercase">
                                        SDA Portal
                                    </span>
                                    <span className="text-[10px] font-bold text-sda-red uppercase tracking-widest mt-0.5">
                                        Service Requests
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => setIsNotifOpen(true)}
                                className="p-2 text-slate-400 hover:text-sda-blue dark:hover:text-white transition-colors relative"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-sda-red rounded-full border-2 border-white dark:border-slate-900"></span>
                            </button>
                            
                            <NotificationHub isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
                            
                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2"></div>

                            <div className="flex items-center space-x-3 group cursor-pointer">
                                <div className="flex flex-col items-end text-right">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 group-hover:text-sda-blue transition-colors">
                                        {user?.username}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold text-slate-400">
                                        {user?.role}
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                    <UserIcon className="w-5 h-5 text-slate-500" />
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="ml-2 p-2.5 text-slate-400 hover:text-sda-red hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200"
                                title="Sign Out"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
