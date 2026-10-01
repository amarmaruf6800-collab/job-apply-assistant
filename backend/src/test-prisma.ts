import prisma from "./lib/prisma.ts";

async function main() {
    const users = await prisma.user.findMany();

    console.log("Koneksi Prisma berhasil!");
    console.log("Jumlah user:", users.length);
}

main()
    .catch((error) => {
        console.error("Prisma error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });