import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { normalizeIdentifier, verifySignInCode } from "./signin-codes";
// Run startup config check so deployment logs surface misconfigurations early
import "./config-check";

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
  /**
   * Passwordless sign-in. The account is created on first successful code,
   * so there is no separate registration step to complete — a name and phone
   * supplied here are stored, and an omitted one simply leaves the field as it
   * was rather than blanking a returning user's details.
   *
   * The email is treated as verified because the code was delivered to it and
   * came back; that round trip is the proof a verification link would give us.
   */
  CredentialsProvider({
    id: "signin-code",
    name: "Sign-in code",
    credentials: {
      email: { label: "Email", type: "email" },
      code:  { label: "Code",  type: "text"  },
      name:  { label: "Name",  type: "text"  },
      phone: { label: "Phone", type: "text"  },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.code) return null;

      const email = normalizeIdentifier(credentials.email);
      const verdict = await verifySignInCode(email, credentials.code);
      if (!verdict.ok) return null;

      const existing = await prisma.user.findUnique({ where: { email } });

      const user = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              // Only fill blanks. A returning guest who leaves the optional
              // fields empty must not have their saved details erased.
              name:  existing.name  ?? credentials.name?.trim()  ?? null,
              phone: existing.phone ?? credentials.phone?.trim() ?? null,
              emailVerified: existing.emailVerified ?? new Date(),
            },
          })
        : await prisma.user.create({
            data: {
              email,
              name:  credentials.name?.trim()  || null,
              phone: credentials.phone?.trim() || null,
              emailVerified: new Date(),
              role: "CUSTOMER",
            },
          });

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
    error: "/auth/login",
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
