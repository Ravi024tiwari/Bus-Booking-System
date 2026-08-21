import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import OperatorBusesClient from './buses-client';
import UnverifiedOperator from '../dashboard/unverified-operator';

export const dynamic = 'force-dynamic';

export default async function OperatorBusesPage() {
  let firstName = 'Operator';
  let isApproved = false;
  let approvalStatus = 'PENDING';

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      redirect('/login');
    }

    const jwtSecret = process.env.JWT_SECRET || 'movego-super-secret-key-12345';
    const decoded: any = jwt.verify(token, jwtSecret);

    if (decoded && decoded.id) {
      await dbConnect();
      const user = await User.findById(decoded.id);

      if (!user || user.role !== 'operator') {
        redirect('/login');
      }

      if (user.name) {
        firstName = user.name.split(' ')[0]; // Extract first name
      }

      if (user.operatorApprovalStatus !== 'APPROVED') {
        isApproved = false;
        approvalStatus = user.operatorApprovalStatus || 'PENDING';
      } else {
        isApproved = true;
      }
    } else {
      redirect('/login');
    }
  } catch (err) {
    console.error('[Operator Buses Server] Auth check error:', err);
    redirect('/login');
  }

  if (!isApproved) {
    return <UnverifiedOperator operatorName={firstName} status={approvalStatus} />;
  }

  return (
    <OperatorBusesClient operatorName={firstName} />
  );
}
