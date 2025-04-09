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

## notes
+ migration to next.js from streamlit
- The 401 Unauthorized response from curl suggests getServerSession isn’t returning a valid session with an accessToken.
    - probably bc testing with standalone curl doesn't carry the session context. Expected