import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth-proxy';
import { Bus } from '@/models';

export async function getOperatorContext() {
  const authResult = await verifyAuth(['operator']);

  if (authResult.errorResponse) {
    return { errorResponse: authResult.errorResponse };
  }
  const operatorId = authResult.user?.id;

  if (!operatorId) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: 'Operator credentials could not be resolved.' },
        { status: 400 }
      )
    };
  }

  // Connect to database
  await dbConnect();

  // Fetch operator's buses
  const buses = await Bus.find({ operatorId });
  const busIds = buses.map((b) => b._id);

  return { operatorId, buses, busIds };
}
