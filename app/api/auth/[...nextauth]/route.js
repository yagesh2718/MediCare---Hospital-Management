import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { findUserByEmail } from "@/lib/auth";
import bcrypt from "bcrypt";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const user = await findUserByEmail(credentials.email);
        if (!user) throw new Error("No user found");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");
        return user;
      },
    }),
  ],
  callbacks: {
  async jwt({ token, user, trigger, session }) {
    // On login
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.name = user.name;
      token.email = user.email;
      token.image = user.image; // <- include image if available
    }

    // On session update (like profile edit)
    if (trigger === "update" && session) {
      token.name = session.name;
      token.image = session.image;
    }

    return token;
  },

  async session({ session, token }) {
    session.user = token;
    return session;
  },
},
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "devsecret",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
