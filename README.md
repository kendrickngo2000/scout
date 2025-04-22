## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
- chrome works, safari does not

## notes
+ migration to next.js from streamlit
- The 401 Unauthorized response from curl suggests getServerSession isn’t returning a valid session with an accessToken.
    - probably bc testing with standalone curl doesn't carry the session context. Expected


References:L
https://next-auth.js.org/configuration/nextjs
https://dev.to/matdweb/how-to-authenticate-a-spotify-user-in-nextjs-14-using-nextauth-5f6i
https://evannotfound.com/blog/tutorial-setup-and-use-nextauthjs-in-nextjs-13-app-directory
https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks\