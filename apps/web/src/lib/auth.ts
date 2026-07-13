import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.password) return null;

      const isValid = await compare(credentials.password, user.password);
      if (!isValid) return null;

      if (!user.emailVerified) {
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        emailVerified: user.emailVerified,
      };
    },
  }),
];

// Add Google provider only when credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const { default: GoogleProvider } = require("next-auth/providers/google");
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google OAuth — create/verify user on first sign-in
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({ where: { email: user.email } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              emailVerified: new Date(),
              role: "CUSTOMER",
            },
          });
        } else if (!existing.emailVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // On initial sign-in, enrich token from the database
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, role: true, emailVerified: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.emailVerified = !!dbUser.emailVerified;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET,
};
