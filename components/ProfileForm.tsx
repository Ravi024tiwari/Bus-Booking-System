'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Check
} from 'lucide-react';

interface ProfileFormProps {
  role: 'customer' | 'operator' | 'admin';
  showEmergencyContact?: boolean;
  showProfileCompletion?: boolean;
  title?: string;
  subtitle?: string;
  children?: React.ReactNode; // Optional custom fields
}

export default function ProfileForm({
  role,
  showEmergencyContact = false,
  showProfileCompletion = false,
  title,
  subtitle,
  children
}: ProfileFormProps) {
  const dispatch = useDispatch();
  const userProfile = useSelector((state: RootState) => state.user.profile);

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
    name: userProfile?.name || '',
    email: userProfile?.email || '',
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
  const [photoPreview, setPhotoPreview] = useState<string>(userProfile?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Sync state if Redux userProfile updates
  useEffect(() => {
    if (userProfile?.avatar && !photoPreview) {
      setPhotoPreview(userProfile.avatar);
    }
    if (userProfile?.name && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.name || prev.name,
        email: userProfile.email || prev.email
      }));
    }
  }, [userProfile, photoPreview, formData.name]);

  // Load profile on mount
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/me');
        if (!isMounted) return;
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
          const resolvedAvatar = u.profileImage || u.avatar || userProfile?.avatar || '';
          if (resolvedAvatar) {
            setPhotoPreview(resolvedAvatar);
          }
          // Sync with Redux properly mapping avatar
          dispatch(setUser({
            id: u.id || u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            avatar: resolvedAvatar || '/images/rohit-avatar.jpg'
          }));
        }
      } catch (err: any) {
        if (!isMounted) return;
        // Ignore 401 when logging out or unauthenticated
        if (err.response?.status === 401) {
          return;
        }
        console.error('Failed to load profile:', err);
        toast.error('Failed to fetch user profile details.');
      } finally {
        if (isMounted) {
          setFetching(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
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

  // Focus helper for interactive checklist clicks
  const handleFocusField = (fieldId: string) => {
    if (fieldId === 'avatar') {
      triggerFileInput();
      return;
    }
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus();
    }
  };

  // Dynamic Profile Completion Calculation
  const completionItems = useMemo(() => {
    const items = [
      {
        id: 'profile-field-name',
        fieldKey: 'name',
        label: 'Full Name',
        completed: Boolean(formData.name && formData.name.trim().length > 0),
        hint: 'Enter your legal full name'
      },
      {
        id: 'profile-field-email',
        fieldKey: 'email',
        label: 'Email Verified',
        completed: Boolean(formData.email && formData.email.trim().length > 0),
        hint: 'Verified for ticket confirmations'
      },
      {
        id: 'profile-field-phone',
        fieldKey: 'phoneNumber',
        label: 'Phone Number',
        completed: Boolean(formData.phoneNumber && formData.phoneNumber.trim().length >= 10),
        hint: '10-digit number for trip SMS & OTP'
      },
      {
        id: 'avatar',
        fieldKey: 'avatar',
        label: 'Profile Photo',
        completed: Boolean(selectedFile || (photoPreview && photoPreview !== '' && !photoPreview.endsWith('rohit-avatar.jpg'))),
        hint: 'Upload photo for boarding verification'
      },
      {
        id: 'profile-field-gender',
        fieldKey: 'gender',
        label: 'Gender',
        completed: Boolean(formData.gender),
        hint: 'Helps in seat allocation preferences'
      },
    ];

    if (showEmergencyContact) {
      items.push({
        id: 'profile-field-emergency-name',
        fieldKey: 'emergencyContact',
        label: 'Emergency Contact',
        completed: Boolean(
          formData.emergencyContactName &&
          formData.emergencyContactName.trim().length > 0 &&
          formData.emergencyContactPhone &&
          formData.emergencyContactPhone.trim().length >= 10
        ),
        hint: 'Name & phone for traveler safety'
      });
    }

    return items;
  }, [formData, photoPreview, selectedFile, showEmergencyContact]);

  const completedCount = useMemo(() => completionItems.filter(item => item.completed).length, [completionItems]);
  const totalCount = completionItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);
  const nextIncompleteItem = useMemo(() => completionItems.find(item => !item.completed), [completionItems]);

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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
          {displayTitle}
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-zinc-500 dark:text-zinc-400 font-semibold mt-1">
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
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-white">Personal Information</h3>
                  <span className="text-[11px] sm:text-xs text-zinc-400 font-bold uppercase tracking-wider block mt-0.5">
                    Update your personal profile details
                  </span>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="py-2.5 sm:py-3 px-5 sm:px-6 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

            {/* AVATAR & NAME BLOCK */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-5 sm:gap-6 py-2 text-center sm:text-left">
              <div className="relative group cursor-pointer shrink-0" onClick={triggerFileInput}>
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-[#ff2d88]/20 shadow-md shrink-0 bg-zinc-100 dark:bg-zinc-800">
                  <Image
                    src={photoPreview || userProfile?.avatar || '/images/rohit-avatar.jpg'}
                    alt={formData.name || userProfile?.name || 'Profile avatar'}
                    fill
                    priority
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-cover group-hover:opacity-75 transition-opacity duration-300"
                  />
                  {/* Photo Overlay hover trigger */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 h-7 w-7 sm:h-8 sm:w-8 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-zinc-900">
                  <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden" 
                />
              </div>

              <div className="flex flex-col gap-1 select-none min-w-0 items-center sm:items-start">
                <h4 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-white leading-none truncate max-w-full">
                  {formData.name || userProfile?.name || 'Ravi Tiwari'}
                </h4>
                <span className="inline-flex mt-1.5 px-3 py-1 bg-violet-500/10 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 text-xs font-black uppercase tracking-wider rounded-xl self-center sm:self-start leading-none">
                  {role.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-1 block">
                  Member since May 2024
                </span>
              </div>
            </div>

            {/* FORM INPUTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Full Name
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl focus-within:border-[#ff2d88]/50 transition-colors">
                  <UserIcon className="h-4.5 w-4.5 text-zinc-400" />
                  <input 
                    type="text" 
                    id="profile-field-name"
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange}
                    required
                    placeholder="Enter your name" 
                    className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Email (Disabled, Verified Badge) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Email Address
                </label>
                <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200/10 dark:border-zinc-700/10 px-4 py-3 rounded-2xl cursor-not-allowed">
                  <div className="flex items-center gap-3 w-full">
                    <Mail className="h-4.5 w-4.5 text-zinc-400" />
                    <input 
                      type="email" 
                      id="profile-field-email"
                      value={formData.email} 
                      disabled
                      className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-semibold text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wide flex items-center gap-1 shrink-0 select-none">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Phone Number
                </label>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl focus-within:border-[#ff2d88]/50 transition-colors">
                  <Phone className="h-4.5 w-4.5 text-zinc-400" />
                  <span className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500 shrink-0 select-none border-r border-zinc-200 dark:border-zinc-700 pr-3">+91</span>
                  <input 
                    type="tel" 
                    id="profile-field-phone"
                    name="phoneNumber" 
                    value={formData.phoneNumber} 
                    onChange={handleChange}
                    placeholder="Enter 10-digit number" 
                    className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                  Gender
                </label>
                <select 
                  id="profile-field-gender"
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none w-full cursor-pointer focus:border-[#ff2d88]/50 transition-colors"
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
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Emergency Contact Name / Relation
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl focus-within:border-[#ff2d88]/50 transition-colors">
                    <UserIcon className="h-4.5 w-4.5 text-zinc-400" />
                    <input 
                      type="text" 
                      id="profile-field-emergency-name"
                      name="emergencyContactName" 
                      value={formData.emergencyContactName} 
                      onChange={handleChange}
                      placeholder="e.g. Rahul Tiwari (Brother)" 
                      className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

              {/* Emergency Contact Phone (Conditional) */}
              {showEmergencyContact && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider leading-none">
                    Emergency Contact Phone Number
                  </label>
                  <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/40 dark:border-zinc-700/40 px-4 py-3 rounded-2xl focus-within:border-[#ff2d88]/50 transition-colors">
                    <Phone className="h-4.5 w-4.5 text-zinc-400" />
                    <span className="text-xs sm:text-sm font-bold text-zinc-400 dark:text-zinc-500 shrink-0 select-none border-r border-zinc-200 dark:border-zinc-700 pr-3">+91</span>
                    <input 
                      type="tel" 
                      id="profile-field-emergency-phone"
                      name="emergencyContactPhone" 
                      value={formData.emergencyContactPhone} 
                      onChange={handleChange}
                      placeholder="Enter 10-digit number" 
                      className="bg-transparent border-none outline-none w-full text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200"
                    />
                  </div>
                </div>
              )}

            </div>

          </div>



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
            
            {/* DYNAMIC PROFILE COMPLETION WIDGET */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 rounded-[2rem] p-6 sm:p-7 flex flex-col gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.01)] relative overflow-hidden">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
                <div className="flex flex-col">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-white leading-tight">Profile Completion</h3>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
                    {completedCount} of {totalCount} sections complete
                  </span>
                </div>
                {completionPercentage === 100 ? (
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center gap-1 border border-emerald-500/20">
                    <Sparkles className="h-3 w-3" />
                    Complete
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-[#ff2d88]/10 text-[#ff2d88] rounded-xl text-[11px] font-black uppercase tracking-wide flex items-center gap-1 border border-[#ff2d88]/20">
                    In Progress
                  </span>
                )}
              </div>

              {/* Radial Completion Chart */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background track */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke="currentColor" 
                      strokeWidth="8" 
                      fill="none" 
                      className="text-zinc-100 dark:text-zinc-800 transition-colors"
                    />
                    {/* Dynamic completion track */}
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="40" 
                      stroke={completionPercentage === 100 ? "url(#completeGradient)" : "url(#completionGradient)"} 
                      strokeWidth="8" 
                      strokeDasharray="251.327" 
                      strokeDashoffset={251.327 - (251.327 * (completionPercentage / 100))} 
                      strokeLinecap="round"
                      fill="none" 
                      className="transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                    <defs>
                      <linearGradient id="completionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff7c52" />
                        <stop offset="100%" stopColor="#ff2d88" />
                      </linearGradient>
                      <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center percentage text */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-zinc-900 dark:text-white leading-none transition-all duration-300">
                      {completionPercentage}%
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-1">
                      {completionPercentage === 100 ? 'Verified' : 'Complete'}
                    </span>
                  </div>
                </div>

                {/* Progress bar visual indicator */}
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full mt-5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ease-out rounded-full ${
                      completionPercentage === 100 
                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' 
                        : 'bg-gradient-to-r from-[#ff7c52] to-[#ff2d88]'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>

                <div className="flex flex-col gap-1 mt-4 text-center">
                  <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                    {completionPercentage === 100 ? '🎉 Profile is 100% Complete!' : 'Complete your profile'}
                  </h4>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                    {completionPercentage === 100 
                      ? 'Your profile information is up to date and ready for fast checkout.' 
                      : nextIncompleteItem 
                        ? `Tip: Complete "${nextIncompleteItem.label}" to improve verification.` 
                        : 'Add more details for personalized travel recommendations.'}
                  </p>
                </div>
              </div>

              {/* Interactive Checklist items */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Checklist
                  </span>
                  <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    {completedCount}/{totalCount}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {completionItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFocusField(item.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500/10'
                          : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/40 dark:border-zinc-700/40 text-zinc-600 dark:text-zinc-400 hover:border-[#ff2d88]/40 hover:bg-[#ff2d88]/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.completed ? (
                          <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700/60 text-zinc-400 flex items-center justify-center shrink-0">
                            <Circle className="h-2.5 w-2.5 fill-current" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold truncate ${item.completed ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-300'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">
                            {item.hint}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {item.completed ? (
                          <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Done</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-[#ff2d88] flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Fill <ArrowRight className="h-2.5 w-2.5 inline" />
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-[#ff7c52] to-[#ff2d88] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? 'Saving Changes...' : completionPercentage === 100 ? 'Save Profile' : `Save & Update (${completionPercentage}%)`}
              </button>

            </div>

          </div>
        )}

      </form>

    </div>
  );
}
