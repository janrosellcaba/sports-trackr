import { prisma } from "@/lib/prisma";

export async function deleteUserRecord(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.gymSession.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}
