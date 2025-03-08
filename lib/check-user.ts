import prisma  from "@/lib/prisma"; // Assuming you are using Prisma for database access

export async function checkUserExists(phoneNumber: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
  });
  return !!user;
}
