'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setUser } from '@/store';
import axios from 'axios';
import { toast } from 'sonner';
import Image from 'next/image';
import { updateProfileSchema } from '@/lib/validations';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Camera, 
  Lock,
  Settings,
  Languages,
  Coins
} from 'lucide-react';

interface ProfileFormProps {
  role: 'customer' | 'operator' | 'admin';
  showEmergencyContact?: boolean;
  showPreferences?: boolean;
  showProfileCompletion?: boolean;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode; // Optional custom fields
}

export default function ProfileForm({
  role,
  showEmergencyContact = false,
  showPreferences = false,
  showProfileCompletion = false,
  title,
  subtitle,
  children
}: ProfileFormProps) {
  const dispatch = useDispatch();

  // Dynamic titles based on role if not provided
  const displayTitle = title || (
    role === 'operator' ? 'Operator Profile' : 
    role === 'admin' ? 'Admin Profile' : 'My Profile'
  );
  
  const displaySubtitle = subtitle || (
    role === 'operator' ? 'Manage your operator status, personal details, and credentials.' :
    role === 'admin' ? 'Manage your administrative settings and profile credentials.' :
    'Manage your personal information and credentials.'
  );

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    gender: 'male',
    emergencyContactName: '',
    emergencyContactPhone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Photo state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (response.data?.success && response.data?.data) {
          const u = response.data.data;
          setFormData({
            name: u.name || '',
            email: u.email || '',
            phoneNumber: u.phoneNumber || '',
            gender: u.gender || 'male',
            emergencyContactName: u.emergencyContactName || '',
            emergencyContactPhone: u.emergencyContactPhone || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          if (u.profileImage) {
            setPhotoPreview(u.profileImage);
          }
          // Sync with Redux properly mapping avatar
          dispatch(setUser({
            id: u.id || u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: u.profileImage || u.avatar || '/images/rohit-avatar.jpg'
          }));
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
        toast.error('Failed to fetch user profile details.');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must not exceed 5MB.');
        return;
      }
      setSelectedFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Client-side Zod validation
    const validationObject: any = {
      name: formData.name,
      gender: formData.gender,
      phoneNumber: formData.phoneNumber || undefined,
    };

    if (showEmergencyContact) {
      validationObject.emergencyContactName = formData.emergencyContactName || undefined;
      validationObject.emergencyContactPhone = formData.emergencyContactPhone || undefined;
    }

    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword || !formData.newPassword) {
        toast.error('Please enter both current and new passwords to change password.');
        setLoading(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match.');
        setLoading(false);
        return;
      }
      validationObject.currentPassword = formData.currentPassword;
      validationObject.newPassword = formData.newPassword;
    }

    const validationResult = updateProfileSchema.safeParse(validationObject);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Invalid input details.';
      toast.error(firstError);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('gender', formData.gender);
      if (formData.phoneNumber) data.append('phoneNumber', formData.phoneNumber);
      
      if (showEmergencyContact) {
        if (formData.emergencyContactName) data.append('emergencyContactName', formData.emergencyContactName);
        if (formData.emergencyContactPhone) data.append('emergencyContactPhone', formData.emergencyContactPhone);
      }
      
      if (selectedFile) {
        data.append('profileImage', selectedFile);
      }

      if (formData.currentPassword && formData.newPassword) {
        data.append('currentPassword', formData.currentPassword);
        data.append('newPassword', formData.newPassword);
      }

      const response = await axios.put('/api/auth/profile/update', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        toast.success('Profile updated successfully!');
        const updated = response.data.data;
        dispatch(setUser({
          id: updated.id || updated._id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          avatar: updated.profileImage || updated.avatar || '/images/rohit-avatar.jpg'
        }));
        
        // Clear passwords fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        toast.error(response.data?.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || 'Error occurred while saving profile changes.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse select-none">
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
          <div className="lg:col-span-8 h-[500px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem]" />
          <div className="lg:col-span-4 h-[300px] bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  // Adjust columns based on whether sidebar widget (ProfileCompletion) is rendered
  const leftColSpan = showProfileCompletion ? 'lg:col-span-8' : 'lg:col-span-12';

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col select-none">
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
          {displaySubtitle}
        </p>
      </div>

      {/* SPLIT LAYOUT GRID */}
      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
        
        {/* LEFT PROFILE FORMS */}
        <div className={`${leftColSpan} flex flex-col gap-8`}>
          
          {/* PERSONAL INFORMATION CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800/60 pb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#ff2d88]/10 text-[#ff2d88] rounded-xl flex items-center justify-center shrink-0 border border-[#ff2d88]/15">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Personal Information</h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">
                    Update your personal profile details
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="py-3 px-6 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* AVATAR & NAME BLOCK */}
            <div className="flex items-center gap-6 py-2">
              <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#ff2d88]/20 shadow-md">
                  <Image
                    src={photoPreview || '/images/rohit-avatar.jpg'}
                    alt={formData.name || 'Profile avatar'}
                    fill
                    loading="lazy"
                    sizes="96px"
                    className="object-cover group-hover:opacity-75 transition-opacity duration-300"
                  />
                  {/* Photo Overlay hover trigger */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 h-7 w-7 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                  <Camera className="h-3.5 w-3.5" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>

              <div className="flex flex-col gap-1 select-none">
                <h4 className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                  {formData.name || 'Ravi Tiwari'}
                </h4>
                <span className="inline-flex mt-1.5 px-3 py-1 bg-violet-500/10 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 text-[10px] font-black uppercase tracking-wider rounded-xl self-start leading-none">
                  {role.toUpperCase()}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-1 block">
                  Member since May 2024
                </span>
              </div>
            </div>

            {/* FORM INPUTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              
              {/* Full Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Full Name
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                  <UserIcon className="h-4.5 w-4.5 text-zinc-400" />
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    required
                    placeholder="Enter your name" 
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Email (Disabled, Verified Badge) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Email Address
                </label>
                <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/10 dark:border-zinc-700/10 px-4 py-3 rounded-2xl cursor-not-allowed">
                  <div className="flex items-center gap-3 w-full">
                    <Mail className="h-4.5 w-4.5 text-zinc-400" />
                    <input 
                      type="email" 
                      value={formData.email} 
                      disabled
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-wide flex items-center gap-1 shrink-0 select-none">
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                  <Phone className="h-4.5 w-4.5 text-zinc-400" />
                  <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 shrink-0 select-none border-r border-zinc-200 dark:border-zinc-700 pr-3">+91</span>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange}
                    placeholder="Enter 10-digit number" 
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Gender
                </label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3.5 rounded-2xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 outline-none w-full cursor-pointer"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Custom dynamic fields injected from parent component */}
              {children}

              {/* Emergency Contact Name (Conditional) */}
              {showEmergencyContact && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Emergency Contact Name / Relation
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                    <UserIcon className="h-4.5 w-4.5 text-zinc-400" />
                    <input 
                      type="text" 
                      name="emergencyContactName" 
                      value={formData.emergencyContactName} 
                      onChange={handleChange}
                      placeholder="e.g. Rahul Tiwari (Brother)" 
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Phone (Conditional) */}
              {showEmergencyContact && (
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Emergency Contact Phone Number
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                    <Phone className="h-4.5 w-4.5 text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 shrink-0 select-none border-r border-zinc-200 dark:border-zinc-700 pr-3">+91</span>
                    <input 
                      type="tel" 
                      name="emergencyContactPhone" 
                      value={formData.emergencyContactPhone} 
                      onChange={handleChange}
                      placeholder="Enter 10-digit number" 
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* PREFERENCES CARD (Conditional) */}
          {showPreferences && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
              
              <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-5 select-none">
                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 border border-indigo-500/15">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Preferences</h3>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">
                    Customize your booking experience
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 select-none">
                {/* Preferred Language */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Preferred Language
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-1 rounded-2xl">
                    <Languages className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                    <select 
                      className="bg-transparent border-none outline-none w-full py-2.5 text-xs font-semibold text-zinc-850 dark:text-zinc-250 cursor-pointer"
                      defaultValue="English"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>
                </div>

                {/* Preferred Currency */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Preferred Currency
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-1 rounded-2xl">
                    <Coins className="h-4.5 w-4.5 text-zinc-400 shrink-0" />
                    <select 
                      className="bg-transparent border-none outline-none w-full py-2.5 text-xs font-semibold text-zinc-855 dark:text-zinc-255 cursor-pointer"
                      defaultValue="INR"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="flex flex-col gap-4 mt-1 border-t border-zinc-100 dark:border-zinc-800/60 pt-5 select-none">
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">Email Notifications</span>
                    <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">Receive updates about bookings and offers</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff2d88]" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">SMS Notifications</span>
                    <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">Receive SMS about booking updates</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff2d88]" />
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">Newsletter</span>
                    <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">Get best offers and travel tips</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ff2d88]" />
                  </label>
                </div>

              </div>

            </div>
          )}

          {/* PASSWORD UPDATE CARD */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-8 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
            
            <div className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-5">
              <div className="h-10 w-10 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center shrink-0 border border-orange-500/15">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-zinc-900 dark:text-white">Change Password</h3>
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">
                  Update your security credentials
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Current Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Current Password
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                  <Lock className="h-4.5 w-4.5 text-zinc-400" />
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={formData.currentPassword} 
                    onChange={handleChange}
                    placeholder="••••••••" 
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  New Password
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                  <Lock className="h-4.5 w-4.5 text-zinc-400" />
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={formData.newPassword} 
                    onChange={handleChange}
                    placeholder="••••••••" 
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Confirm Password
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl">
                  <Lock className="h-4.5 w-4.5 text-zinc-400" />
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={formData.confirmPassword} 
                    onChange={handleChange}
                    placeholder="••••••••" 
                    className="bg-transparent border-none outline-none w-full text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN */}
        {showProfileCompletion && (
          <div className="lg:col-span-4 flex flex-col gap-6 select-none">
            
            {/* PROFILE COMPLETION WIDGET */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] text-center relative overflow-hidden">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-white self-start">Profile Completion</h3>
              
              <div className="flex flex-col items-center justify-center py-4">
                
                {/* Radial Completion Chart */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Gray background track */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="none" 
                      className="text-zinc-100 dark:text-zinc-800"
                    />
                    {/* Pink completion track */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="url(#completionGradient)" 
                      strokeWidth="8" 
                      strokeDasharray="251.2" 
                      strokeDashoffset={251.2 - (251.2 * 0.8)} 
                      strokeLinecap="round"
                      fill="none" 
                    />
                    <defs>
                      <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff7c52" />
                        <stop offset="100%" stopColor="#ff2d88" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-zinc-800 dark:text-white leading-none">80%</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">Complete</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 mt-5">
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">Complete your profile</h4>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold leading-relaxed max-w-[200px] mx-auto">
                    Add more details to get better travel recommendations and complete security verification.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs rounded-xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer"
                >
                  Complete Now
                </button>

              </div>

            </div>

          </div>
        )}

      </form>

    </div>
  );
}
