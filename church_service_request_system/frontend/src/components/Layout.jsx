import React, { useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Church, User as UserIcon } from 'lucide-react';

const Layout = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
            {/* Navigation Header */}
            <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
                                <Church className="text-white w-5 h-5" />
                            </div>
                            <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                                Service Portal
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-6">
                            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                <UserIcon className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">
                                    {user?.username} <span className="text-slate-400 capitalize">({user?.role})</span>
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 text-slate-500 hover:text-red-500 transition-colors duration-200 font-medium text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
