export interface Role {
  id: string
  name: string
  description: string | null
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  emailVerified: boolean
  createdAt: Date
  roles: Role[]
}
