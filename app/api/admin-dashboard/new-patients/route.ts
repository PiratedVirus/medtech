import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const newPatients = await prisma.user.findMany({
        where: {
          role: 'PATIENT',
          createdAt: {
            gte: new Date(new Date().setDate(new Date().getDate() - 7)),
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          patientProfile: {
            select: {
              planTrackers: {
                select: {
                  plan: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const formattedPatients = newPatients.map((patient) => ({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        joinedOn: patient.createdAt,
        plan: patient.patientProfile?.planTrackers[0]?.plan?.name || 'N/A',
      }));

      res.status(200).json(formattedPatients);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch new patients' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
