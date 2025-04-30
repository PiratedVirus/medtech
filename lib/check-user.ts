import prisma  from "@/lib/prisma"; // Assuming you are using Prisma for database access

export async function checkUserExists(phoneNumber: string): Promise<boolean> {
  console.log("Checking if user exists with phone number:", phoneNumber); 
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
  });
  return !!user;
}
