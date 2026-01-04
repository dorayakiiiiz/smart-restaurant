import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { staffService } from "../../../../services/staffService";
import Input from "../../../../components/Shared/Input";
import { Validator } from "../../../../utils/validators";

// Modal nhập thông tin (Create/Edit Staff)
export default function StaffFormModal({ staff, role, onClose, onSuccess }) {
    const isEditMode = !!staff;
    
    const [email, setEmail] = useState(staff?.email || "");
    const [fullName, setFullName] = useState(staff?.fullName || "");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [log, setLog] = useState({ type: '', content: '' });

    useEffect(() => {
        if (log.content) {
            setTimeout(() => setLog({ type: '', content: '' }), 2600);
        }
    }, [log]);

    const mutation = useMutation({
        mutationFn: (data) => {
            if (isEditMode) {
                return staffService.updateStaff(staff._id, data);
            }
            return staffService.createStaff(data);
        },
        onSuccess: () => {
            onSuccess();
            setLog({ 
                type: 'success', 
                content: isEditMode ? 'Updated staff successfully.' : 'Created staff successfully.' 
            });
            setTimeout(onClose, 2000);
        },
        onError: (err) => {
            setLog({ 
                type: 'error', 
                content: err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} staff.` 
            });
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate email
        const emailError = Validator.validateEmail(email);
        if (emailError) {
            setLog({ type: 'error', content: emailError });
            return;
        }

        // Validate fullName
        const fullNameError = Validator.validateFullName(fullName);
        if (fullNameError) {
            setLog({ type: 'error', content: fullNameError });
            return;
        }

        // Validate password (chỉ bắt buộc khi tạo mới)
        if (!isEditMode) {
            const passwordError = Validator.validatePassword(password);
            if (passwordError) {
                setLog({ type: 'error', content: passwordError });
                return;
            }

            if (confirmPassword !== password) {
                setLog({ type: 'error', content: 'Passwords do not match.' });
                return;
            }
        } else if (password.trim() !== '') {
            // Khi edit, nếu có nhập password thì validate
            const passwordError = Validator.validatePassword(password);
            if (passwordError) {
                setLog({ type: 'error', content: passwordError });
                return;
            }

            if (confirmPassword !== password) {
                setLog({ type: 'error', content: 'Passwords do not match.' });
                return;
            }
        }

        const data = { 
            email, 
            fullName, 
            role: staff?.role || role
        };

        // Chỉ gửi password nếu có nhập
        if (password.trim() !== '') {
            data.password = password;
        }

        mutation.mutate(data);
    };

    const roleTitle = (staff?.role || role) === 'waiter' ? 'Waiter' : 'Kitchen Staff';
    const roleIcon = (staff?.role || role) === 'waiter' ? '🍽️' : '👨‍🍳';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" 
            onClick={onClose}
        >
            <div className="bg-white rounded-2xl w-full max-w-xl p-10 shadow-2xl" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{roleIcon}</span>
                    <h3 className="text-2xl font-bold font-momo text-[#1a1a1a]">
                        {isEditMode ? `Edit ${roleTitle}` : `Create ${roleTitle}`}
                    </h3>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col gap-1">
                    <label className="text-sm font-semibold text-gray-700">Email</label>
                    <Input type="email" value={email} placeholder="staff@example.com" setState={setEmail} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">Full Name</label>
                    <Input type="text" value={fullName} placeholder="John Doe" setState={setFullName} />
                    
                    <label className="text-sm font-semibold text-gray-700 mt-2">
                        Password {isEditMode && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
                    </label>
                    <Input type="password" value={password} placeholder="Secure password" setState={setPassword} />

                    <label className="text-sm font-semibold text-gray-700 mt-2">Confirm Password</label>
                    <Input type="password" value={confirmPassword} placeholder="Secure password" setState={setConfirmPassword} />

                    <div className={`text-center text-sm font-semibold ${log.type === 'error' ? 'text-red-600' : log.type === 'success' ? 'text-green-600 success-glow' : ''}`}>
                        {log.content}
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>

                        <button 
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold hover:bg-[#333] transition disabled:opacity-70"
                        >
                            {mutation.isPending 
                                ? (isEditMode ? "Updating..." : "Creating...") 
                                : (isEditMode ? "Update" : "Create Account")
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
