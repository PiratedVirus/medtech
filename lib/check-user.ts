import prisma  from "@/lib/prisma"; // Assuming you are using Prisma for database access

export async function checkUserExists(phoneNumber: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { phoneNumber, deletedAt: null },
  });
  console.log("Checking if user exists with phone number:", phoneNumber, user); 

  return !!user;
}
