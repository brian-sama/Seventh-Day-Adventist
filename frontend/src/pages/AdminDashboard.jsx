import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { UserPlus, Users, Shield, Trash2, Edit, Search, X, CheckCircle } from 'lucide-react';
import GooeyFooter from '../components/GooeyFooter';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New User State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        role: 'clerk',
        phone_number: ''
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await fetchApi('/api/users/');
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users:", error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetchApi('/api/users/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            setIsAddUserOpen(false);
            setFormData({
                username: '', password: '', email: '',
                first_name: '', last_name: '', role: 'clerk',
                phone_number: ''
            });
            loadUsers();
        } catch (error) {
            alert("Failed to create user. Check if username exists.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            await fetchApi(`/api/users/${id}/`, { method: 'DELETE' });
            loadUsers();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const roles = {
        clerk: 'Clerk',
        elder: 'Elder',
        pastor: 'Pastor',
        admin: 'Administrator'
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                   <span className="text-sda-blue font-bold text-xs uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">System Administration</span>
                   <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-3 flex items-center gap-3">
                     User Management
                   </h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-md">Create and manage Magwegwe West SDA Church official accounts and access levels.</p>
                </div>
                <button 
                    onClick={() => setIsAddUserOpen(true)}
                    className="bg-sda-blue hover:bg-sda-red text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl transition-all flex items-center gap-2"
                >
                    <UserPlus className="w-5 h-5" />
                    Create New User
                </button>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-sda-blue" />
                        System Users
                    </h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search by name or role..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sda-blue outline-none transition-all w-full sm:w-64"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/20">
                                <th className="py-5 px-8">User Information</th>
                                <th className="py-5 px-8">Role</th>
                                <th className="py-5 px-8">Contact</th>
                                <th className="py-5 px-8 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {users.filter(u => 
                                u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                u.role.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="py-5 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                                                {u.first_name?.[0] || u.username[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{u.first_name} {u.last_name}</div>
                                                <div className="text-xs text-slate-400">@{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            u.role === 'admin' ? 'bg-sda-red/10 text-sda-red' :
                                            u.role === 'pastor' ? 'bg-sda-blue/10 text-sda-blue' :
                                            u.role === 'elder' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-600' :
                                            'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                        }`}>
                                            {roles[u.role]}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8">
                                        <div className="text-sm text-slate-600 dark:text-slate-300">{u.email}</div>
                                        <div className="text-xs text-slate-400">{u.phone_number || 'No phone'}</div>
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleDeleteUser(u.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                title="Delete User"
                                                disabled={u.role === 'admin'}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {isAddUserOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Create Official Account</h3>
                            <button onClick={() => setIsAddUserOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">First Name</label>
                                    <input 
                                        type="text" required
                                        value={formData.first_name}
                                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sda-blue outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Last Name</label>
                                    <input 
                                        type="text" required
                                        value={formData.last_name}
                                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sda-blue outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Username</label>
                                <input 
                                    type="text" required
                                    value={formData.username}
                                    onChange={e => setFormData({...formData, username: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sda-blue outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Temporary Password</label>
                                <input 
                                    type="password" required
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sda-blue outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Church Role</label>
                                <select 
                                    value={formData.role}
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-sda-blue outline-none"
                                >
                                    <option value="clerk">Clerk</option>
                                    <option value="elder">Elder</option>
                                    <option value="pastor">Pastor</option>
                                    <option value="admin">System Administrator</option>
                                </select>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsAddUserOpen(false)}
                                    className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3.5 bg-sda-blue text-white font-black rounded-2xl shadow-lg shadow-sda-blue/20 hover:bg-sda-red transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Creating...' : 'Create Account'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <GooeyFooter />
        </div>
    );
};

export default AdminDashboard;
