import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      role?: string
      advisorId?: string
    }
  }

  interface User {
    role?: string
    advisorId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    advisorId?: string
  }
}