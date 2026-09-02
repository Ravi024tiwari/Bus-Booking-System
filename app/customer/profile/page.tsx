'use client';

import React from 'react';
import ProfileForm from '@/components/ProfileForm';

export default function ProfilePage() {
  return (
    <ProfileForm
      role="customer"
      showEmergencyContact={true}
      showProfileCompletion={true}
    />
  );
}
