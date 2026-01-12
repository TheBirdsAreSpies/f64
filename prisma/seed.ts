/* eslint-disable no-console */

import { prisma } from "../lib/prisma"
import { AlbumPermission, PhotoPermission, PostPermission, TagPermission, ThemePermission, UserPermission } from "../server/types/permissions"

async function main(): Promise<void> {
  // Seed log levels
  console.log("Seeding log levels...")
  const logLevels = [
    { name: "info" },
    { name: "warn" },
    { name: "error" },
    { name: "debug" },
  ]

  for (const level of logLevels) {
    await prisma.logLevel.upsert({
      where: { name: level.name },
      update: {},
      create: level,
    })
    console.log(`Seeded log level: ${level.name}`)
  }

  // Seed log request types
  console.log("Seeding log request types...")
  const logRequestTypes = [
    { name: "API" },
    { name: "Application" },
    { name: "undefined" },
  ]

  for (const type of logRequestTypes) {
    await prisma.logRequestType.upsert({
      where: { name: type.name },
      update: {},
      create: type,
    })
    console.log(`Seeded log request type: ${type.name}`)
  }

  console.log("Seeding permissions and admin role/user...")
  const userPerms = Object.values(UserPermission) as string[]
  const postPerms = Object.values(PostPermission) as string[]
  const photoPerms = Object.values(PhotoPermission) as string[]
  const albumPerms = Object.values(AlbumPermission) as string[]
  const tagPerms = Object.values(TagPermission) as string[]
  const themePerms = Object.values(ThemePermission) as string[]
  const allCodes = [...userPerms, ...postPerms, ...photoPerms, ...albumPerms, ...tagPerms, ...themePerms]

  for (const code of allCodes) {
    let category = "other"
    if (userPerms.includes(code))
      category = "user"
    else if (postPerms.includes(code))
      category = "post"
    else if (photoPerms.includes(code))
      category = "photo"
    else if (albumPerms.includes(code))
      category = "album"
    else if (tagPerms.includes(code))
      category = "tag"
    else if (themePerms.includes(code))
      category = "theme"

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
  const adminEmail = "admin@f64.com"
  const adminPassword = "$scrypt$n=16384,r=8,p=1$+Zp5eNc7U/W7YD2aCNQw0w$6P+xb+XmhWvPGQrpPRno6tnZzVLR9jz5n7h2SIa4tPGNLMOxf4IKoHxz0onVj9YIiEgG5FJvot9zpIWYqgd45g"

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      roles: { connect: [{ id: adminRole.id }] },
      emailVerified: true,
    },
    update: {
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      roles: { connect: [{ id: adminRole.id }] },
      emailVerified: true,
    },
  })

  const userEmail = "user@f64.com"
  const userPassword = "$scrypt$n=16384,r=8,p=1$+Zp5eNc7U/W7YD2aCNQw0w$6P+xb+XmhWvPGQrpPRno6tnZzVLR9jz5n7h2SIa4tPGNLMOxf4IKoHxz0onVj9YIiEgG5FJvot9zpIWYqgd45g"

  await prisma.user.upsert({
    where: { email: userEmail },
    create: {
      email: userEmail,
      password: userPassword,
      firstName: "Test",
      lastName: "User",
      emailVerified: true,
    },
    update: {
      password: userPassword,
      firstName: "Test",
      lastName: "User",
      emailVerified: true,
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
