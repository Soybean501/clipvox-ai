import { MongoDBAdapter } from '@auth/mongodb-adapter';
import bcrypt from 'bcryptjs';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import connectDB from './db';
import clientPromise from './mongodb';
import User from '@/models/User';

export const authConfig: NextAuthConfig = {
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: 'jwt' },
  pages: { signIn: '/signin' },
  providers: [
    Credentials({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        await connectDB();
        const email = credentials.email.toLowerCase();
        const user = await User.findOne({ email });
        if (!user) {
          return null;
        }

        const passwordValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!passwordValid) {
          return null;
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? user.email
        };
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user && user.id) {
        token.sub = user.id;
      }
      return token;
    }
  }
};

export const authOptions = authConfig;
export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);
