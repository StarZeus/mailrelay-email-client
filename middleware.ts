import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    return null
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const isLoggedIn = !!token
        const isAuthPage = req.nextUrl.pathname.startsWith('/api/auth')
        
        if (isAuthPage) {
          return true
        }
        return isLoggedIn
      }
    }
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}