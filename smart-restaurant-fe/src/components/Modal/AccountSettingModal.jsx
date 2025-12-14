import { useState, useEffect } from 'react'
import Input from "../../components/Shared/Input";
import Button from "../../components/Shared/Button";
import { userService } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

export default function AccountSettingModal({ onClose }) {
    const { logout, user, setUser } = useAuth();
    const [tab, setTab] = useState('general');

    const [displayName, setDisplayName] = useState(user?.displayName || '');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [log, setLog] = useState({ type: '', content: '' });
    // làm cái spinner quay chỗ button delete
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (log.content) {
            const timerId = setTimeout(() => setLog({ type: '', content: '' }), 2000);
            return () => clearTimeout(timerId);
        }
    }, [log]);

    const handleUpdateInfo = async () => {
        if (!displayName.trim()) {
            setLog({ type: 'error', content: 'Display name cannot be empty.' });
            return;
        }
        try {
            setLoading(true);
            
            const { userResponse } = await userService.updateAccountInfo({ displayName });
            setUser(userResponse);
            setLog({ type: 'success', content: 'Account info updated successfully.' });
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Failed to update.' });
        } finally {
            setLoading(false);
        }
    }

    const handleChangePassword = async () => {
        if (!currentPassword) {
            setLog({ type: 'error', content: 'Please input password'});
            return;
        }

        if (!newPassword) {
            setLog({ type: 'error', content: 'Please input new password'});
            return;
        }

        if (newPassword.length < 5) {
            setLog({ type: 'error', content: 'Password must be at least 5 characters.'});
            return;
        }

        if (confirmPassword !== newPassword) {
            setLog({ type: 'error', content: 'Passwords do not match.' });
            return;
        }

        try {
            setLoading(true);

            await userService.changePassword({ currentPassword, newPassword });
            setLog({ type: 'success', content: 'Password change successfully.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setLog({ type: 'error', content: err.response?.data?.message || 'Failed to change password.' });
        } finally {
            setLoading(false);
        }
    }

    const handleDeleteAccount = async () => {
        if (!window.confirm('Are you sure? This action cannot be undone!')) return;
        
        try {
            setDeleting(true);
            await userService.deleteAccount();

            setTimeout(async () => {
                setDeleting(false);
                logout();
            }, 2000);

        } catch (err) {
            setLog({ 
                type: 'error', 
                content: err.response?.data?.message || 'Error deleting account' 
            });
        }
    }

    const renderGeneralTab = () => (
        <div>
            <div className="w-full font-bold text-xl text-green-600">
                General information
            </div>
            <div className="w-full mt-10 px-14">
                <div className="ml-1">
                    Email
                </div>

                <div className="mt-1 w-full">
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed px-5"
                        value={user?.email}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled
                    />
                    <div className="text-sm text-gray-400 mt-1 ml-1">Email cannot be changed.</div>
                </div>
            </div>
            <div className="w-full mt-6 px-14">
                <div className="ml-1">
                    Display name
                </div>

                <div className="mt-1 w-full">
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-5"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                </div>
            </div>
        

            <div className="w-full mt-3 px-14 flex flex-col items-center justify-center">

                <div
                    className={`h-6 mb-2.5 ${log.type == "error" ? "text-[red]" : "text-[green] success-glow"
                        } font-semibold`}
                >
                    {log.content}
                </div>

                <Button
                    backgrond={{ normal: "#8129d9", hover: "#5D18A2 " }}
                    color="#fff"
                    text={loading ? "Saving..." : "Save Changes"}
                    onClick={handleUpdateInfo}
                />
            </div>

            
        </div>
    )

    const renderChangePasswordTab = () => (
        <div>
            <div className="w-full font-bold text-xl text-blue-600">
                Change your password
            </div>
            <div className="w-full mt-6 px-14">
                <div className="ml-1">
                    Current password
                </div>

                <div className="mt-1 w-full">
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-5"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                </div>
            </div>
            <div className="w-full mt-3 px-14">
                <div className="ml-1">
                    New password
                </div>

                <div className="mt-1 w-full">
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-5"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                </div>
            </div>
            <div className="w-full mt-3 px-14">
                <div className="ml-1">
                    Confirm new password
                </div>

                <div className="mt-1 w-full">
                    <input
                        type="text"
                        className="h-[50px] w-full rounded-xl bg-[#f7f8f6] px-5"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            <div className="w-full mt-3 px-14 flex flex-col items-center justify-center">

                <div
                    className={`h-6 mb-2.5 ${log.type == "error" ? "text-[red]" : "text-[green] success-glow"
                        } font-semibold`}
                >
                    {log.content}
                </div>

                <Button
                    backgrond={{ normal: "#8129d9", hover: "#5D18A2 " }}
                    color="#fff"
                    text={loading ? "Saving..." : "Save Changes"}
                    onClick={handleChangePassword}
                />
            </div>

            
        </div>
    )

    const renderDeleteAccountTab = () => (
        <div>
            <div className="w-full font-bold text-xl text-red-600">
                Delete Account
            </div>

            <div className="w-30 h-30 md:w-40 md:h-40 mt-6 mx-auto">
                <img
                    src="/delete_account.png"
                    alt="Delete account"
                    className="w-full h-full"
                />
            </div>
            <div className="w-full p-4 mb-4 border border-red-200 rounded-2xl bg-red-50">
                <div className="font-bold text-red-800">
                    Warning:
                </div>
                <div className="text-red-700">
                    Deleting your account is permanent. All your links, products, and data will be wiped out immediately. You cannot recover this account.
                </div>
            </div>

            <button 
                className={`cursor-pointer px-6 py-3 ${deleting ? 'bg-red-400' : 'bg-red-500' } hover:bg-red-400 text-white font-bold rounded-xl transition w-full`}
                onClick={handleDeleteAccount}
                disabled={deleting}
            >
                Delete My Account
                {deleting ? <i className="fa-solid fa-circle-notch fa-spin ml-2"></i> : ''}
            </button>

            <div
                className={`text-center h-6 mt-2.5 ${log.type == "error" ? "text-[red]" : "text-[green] success-glow"
                    } font-semibold`}
            >
                {log.content}
            </div>
            
        </div>
    )


    return (
        <div
            className="fixed inset-0 z-100 bg-black/50 backdrop-blur flex items-center justify-center"
            onClick={onClose}
        >
            <div 
                className="flex flex-col items-center w-full max-w-[800px] h-full max-h-[560px] bg-[#fff] md:rounded-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-full relative flex items-center justify-center py-6 font-momo text-2xl border-b border-gray-200 shadow">
                    <div>
                        Account Setting
                        <i className="fa-solid fa-gear ml-2 text-blue-800"></i>
                    </div>

                    <div
                        className="absolute right-6 text-[red] text-2xl cursor-pointer"
                        onClick={onClose}
                    >
                        <i className="fa-regular fa-circle-xmark"></i>
                    </div>
                </div>

                <div className="flex w-full h-full">
                    {/* menu */}
                    <div className="flex-1 bg-[#F9F8FD] px-6 py-3 space-y-4">
                        <div 
                            className={`p-3 rounded-xl cursor-pointer transition ${tab === 'general' ? 'font-bold bg-white shadow-md' : ''}`}
                            onClick={() => setTab('general')}
                        >
                            <i className="fa-solid fa-circle-info mr-4 text-blue-400"></i>
                            General
                        </div>

                        <div 
                            className={`p-3 rounded-xl cursor-pointer transition ${tab === 'change-password' ? 'font-bold bg-white shadow-md' : ''}`}
                            onClick={() => setTab('change-password')}
                        >
                            <i className="fa-solid fa-key mr-4 text-yellow-400"></i>
                            Password
                        </div>

                        {user?.role !== 'admin' && (
                            <div 
                                className={`p-3 rounded-xl cursor-pointer transition ${tab === 'delete-account' ? 'font-bold bg-white shadow-md' : ''}`}
                                onClick={() => setTab('delete-account')}
                            >
                                <i className="fa-solid fa-triangle-exclamation mr-4 text-red-500"></i>
                                Danger
                            </div>
                        )}
                    </div>

                    {/* content */}
                    <div className="flex-3 px-10 py-5">
                        {tab === 'general' && renderGeneralTab()}
                        {tab === 'change-password' && renderChangePasswordTab()}
                        {tab === 'delete-account' && renderDeleteAccountTab()}
                    </div>
                </div>

            </div>

        </div>
    )
}