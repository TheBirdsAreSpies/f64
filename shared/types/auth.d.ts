declare module "#auth-utils" {
  interface User {
    id: string
    firstName: string
    lastName: string
  }

  interface UserSession {
    lastLoggedIn: Date
  }

  interface SecureSessionData {
    apiKey: string
  }
}

export {}
