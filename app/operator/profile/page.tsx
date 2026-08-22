'use client';

import React from 'react';
import ProfileForm from '@/components/ProfileForm';

export default function OperatorProfilePage() {
  return (
    <ProfileForm
      role="operator"
      showEmergencyContact={false}
      showPreferences={false}
      showProfileCompletion={false}
    />
  );
}
