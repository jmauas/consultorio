import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { PERFILES_USUARIO } from "@/lib/services/users/userService";

// Configuración de NextAuth
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // podés descomentar estos proveedores si deseas utilizarlos
    /* GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }), */
    
    // Proveedor de email para iniciar sesión con enlace mágico
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      maxAge: 24 * 60 * 60, // Duración del enlace mágico en segundos (24 horas por defecto)
    }),    
    // Proveedor de credenciales para login con email/password
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "usuario@ejemplo.com" },
        password: { label: "Password", type: "password" },
        emailToken: { label: "Email Token", type: "text" }, // Para autenticación por token de email
        userId: { label: "User ID", type: "text" }, // Para identificar el usuario cuando viene de validación por email
      },
      async authorize(credentials) {
        // Si viene un token de email validado (autenticación desde la página complete-signin)
        if (credentials?.emailToken && credentials?.email && credentials?.userId) {
          try {            
            // Verificar que el usuario existe con ese ID y email
            const user = await prisma.user.findFirst({
              where: { 
                id: credentials.userId,
                email: {
                  equals: credentials.email,
                  mode: 'insensitive'
                }
              },
              include: {
                doctores: true,
              }
            });
            
            if (!user) {
              console.log("No se encontró usuario con ID y email proporcionados");
              return null;
            }
            
            // Verificar que el usuario esté habilitado
            if (user.enabled === false) {
              console.log("Usuario está deshabilitado");
              return null;
            }
            
            // En este caso, ya validamos el token en el endpoint anterior, así que solo devolvemos el usuario
            console.log("Autenticación exitosa mediante token de email");
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              enabled: user.enabled,
              perfil: PERFILES_USUARIO.find(p => p.id === user.perfil), 
            };
          } catch (error) {
            console.error("Error en autenticación con token:", error);
            return null;
          }
        }
        
        // Autenticación normal con email y password
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        try {          // Buscar usuario por email (case insensitive)
          const user = await prisma.user.findFirst({
            where: { 
              email: {
                equals: credentials.email,
                mode: 'insensitive'
              }
            },
              include: {
                doctores: true,
              }
          });
          
          // Si no se encuentra el usuario o no tiene contraseña
          if (!user || !user.password) {
            return null;
          }
          
          // Verificar si el usuario está habilitado
          if (user.enabled === false) {
            return null;
          }
          
          // Comparar la contraseña proporcionada con la almacenada
          const passwordMatches = await bcrypt.compare(
            credentials.password,
            user.password
          );
          
          // Si la contraseña no coincide
          if (!passwordMatches) {
            return null;
          }
          // Usuario autenticado correctamente - retornar datos sin incluir la contraseña
         return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            enabled: user.enabled,
            perfil: PERFILES_USUARIO.find(p => p.id === user.perfil),
            doctores: user.doctores,
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    // signOut: '/auth/signout',
    // error: '/auth/error',
    // verifyRequest: '/auth/verify-request',
    // newUser: '/auth/new-user'
  },
  callbacks: {
    async session({ session, token }) {
      // Enviar propiedades del token a la sesión del cliente
      session.user.id = token.id;
      session.user.enabled = token.enabled;
      session.user.perfil = token.perfil;
      session.user.doctores = token.doctores;
      return session;
    },
    async jwt({ token, user }) {
      // Persistir datos del usuario en el token JWT
      if (user) {
        token.id = user.id;
        token.enabled = user.enabled;
        token.perfil = user.perfil;
        token.doctores = user.doctores;
      }
      return token;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };