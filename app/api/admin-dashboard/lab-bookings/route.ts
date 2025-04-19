import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const labBookings = await prisma.labBooking.findMany({
        include: {
          patient: true,
          labPackage: true,
        },
      });
      res.status(200).json(labBookings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch lab bookings' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
