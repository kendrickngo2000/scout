import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            'user-read-email',
            'playlist-read-private',
            'playlist-modify-private',
            'playlist-modify-public',
            'user-top-read',
            'user-read-recently-played',
            'streaming' // Essential for Web Playback SDK
          ].join(' '),
          show_dialog: true // Helps with debugging auth flow
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if(account) {
        token.accessToken = account.access_token;
        token.accessToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
    },
    async redirect({ session, token }) {
      // refirect to homepage after login
    }
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
