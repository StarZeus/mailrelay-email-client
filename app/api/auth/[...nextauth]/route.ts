import NextAuth from "next-auth"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  providers: [
    {
      id: "oidc",
      name: "OIDC Provider",
      type: "oauth",
      wellKnown: process.env.OIDC_ISSUER_URL,
      authorization: { params: { scope: "openid profile email" } },
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token as string
        token.idToken = account.id_token as string
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.idToken = token.idToken as string
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }