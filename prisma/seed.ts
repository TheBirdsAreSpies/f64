import { prisma } from "../lib/prisma"
import { PostPermission, UserPermission } from "../server/types/permissions"

async function main(): Promise<void> {
  console.log("Seeding permissions and admin role/user...")
  const userPerms = Object.values(UserPermission) as string[]
  const postPerms = Object.values(PostPermission) as string[]
  const allCodes = [...userPerms, ...postPerms]

  for (const code of allCodes) {
    const category = userPerms.includes(code) ? "user" : "post"
    await prisma.permission.upsert({
      where: { code },
      create: {
        code,
        name: code,
        category,
        createdBy: "system",
      },
      update: {
        name: code,
        category,
        isActive: true,
        updatedBy: "system",
      },
    })
    console.log(`Upserted permission: ${code}`)
  }

  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    create: {
      name: "admin",
      description: "Default administrator role",
      createdBy: "system",
      updatedBy: "system",
    },
    update: {
      description: "Default administrator role",
      isActive: true,
      updatedBy: "system",
    },
  })

  const perms = await prisma.permission.findMany({ where: { code: { in: allCodes } } })
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: { set: perms.map(p => ({ id: p.id })) },
      updatedBy: "system",
    },
  })

  // Create default admin user - password: test
  const adminEmail = "admin@example.com"
  const adminPassword = "$scrypt$n=16384,r=8,p=1$+Zp5eNc7U/W7YD2aCNQw0w$6P+xb+XmhWvPGQrpPRno6tnZzVLR9jz5n7h2SIa4tPGNLMOxf4IKoHxz0onVj9YIiEgG5FJvot9zpIWYqgd45g"

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      roles: { connect: [{ id: adminRole.id }] },
    },
    update: {
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      roles: { connect: [{ id: adminRole.id }] },
    },
  })

  console.log("Seeding complete.")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
  })
