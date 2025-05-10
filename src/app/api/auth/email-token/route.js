import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generarToken } from "@/lib/utils/tokenUtils";
import { enviarMailRecuperarPass } from "@/lib/services/sender/resendService";

// Almacenar el token en la base de datos
export async function POST(request) {
  try {
    const { email } = await request.json();

    // Validar que los campos requeridos estén presentes
    if (!email) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const token = generarToken(50); 

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const now = new Date();

    try {
      // First delete any existing tokens for this email
      await prisma.emailToken.deleteMany({
        where: { email }
      }).then(result => {
        if (result.count > 0) {
          console.log(`[${now.toISOString()}] Deleted ${result.count} existing tokens for email:`, email);
        }
      });
      
      // Then create a new token
      const result = await prisma.emailToken.create({
        data: {
          email,
          token,
          expires: expiresAt,
          createdAt: now,
          updatedAt: now
        },
      });

      const mail = await enviarMailRecuperarPass(email, token);
      if (!mail) {
        console.error(`[${now.toISOString()}] Error sending email to:`, email);
        return NextResponse.json(
          { error: "Error al enviar el correo electrónico" },
          { status: 500 }
        );
      }      
           
      return NextResponse.json({ 
        success: true,
        tokenStored: result,
        createdAt: now.toISOString()
      });
    } catch (dbError) {
      console.error(`[${now.toISOString()}] DATABASE ERROR WHEN STORING TOKEN:`, dbError);
      return NextResponse.json(
        { error: "Error al guardar el token en la base de datos", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al guardar el token:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// Verificar la validez de un token
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");
    const source = searchParams.get("source") || 'unknown';
    const now = new Date();

    console.log(`[${now.toISOString()}] TOKEN VALIDATION REQUEST [${source}]:`, { 
      email, 
      tokenProvided: !!token,
      requestFrom: source
    });

    // Validar que los parámetros requeridos estén presentes
    if (!email || !token) {
      console.error(`[${now.toISOString()}] MISSING PARAMS [${source}]:`, { email, tokenProvided: !!token });
      return NextResponse.json(
        { error: "Parámetros incompletos" },
        { status: 400 }
      );
    }

    // Verificar si existe un usuario activo con este email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`[${now.toISOString()}] USER NOT FOUND [${source}]:`, { email });
      return NextResponse.json(
        { valid: false, error: "No existe un usuario registrado con este email" },
        { status: 401 }
      );
    }

    try {
           
      // Buscar el token en la base de datos sin importar mayúsculas/minúsculas
      const storedTokens = await prisma.emailToken.findMany({
        where: {
          email: {
            equals: email,
            mode: 'insensitive',
          },
          token: token
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
      let storedToken = null;
      // Si hay más de uno, mantener solo el más reciente
      if (storedTokens.length > 0) {
        storedToken = storedTokens[0];
      }

      // Verificar si el token existe
      if (!storedToken) {
        console.log(`[${now.toISOString()}] NO TOKEN FOUND [${source}]:`, { email });
        return NextResponse.json(
          { valid: false, error: "No se encontró un token asociado a este email" },
          { status: 401 }
        );
      }

      // Verificar si el token ha expirado
      if (now > storedToken.expires) {
        console.log(`[${now.toISOString()}] TOKEN EXPIRED [${source}]:`, { 
          expiresAt: storedToken.expires.toISOString(), 
          now: now.toISOString() 
        });
        return NextResponse.json(
          { valid: false, error: "Token expirado" },
          { status: 401 }
        );
      }

      // Para validaciones iniciales (no desde callback), no eliminar el token
      if (source !== 'callback') {
        console.log(`[${now.toISOString()}] TOKEN VALID [${source}], NOT DELETING:`, { email });
        return NextResponse.json({ 
          valid: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            name: user.name 
          }
        });
      }

      // Token válido y proviene de callback, eliminarlo para que no se pueda usar de nuevo
      console.log(`[${now.toISOString()}] TOKEN VALID [${source}], DELETING:`, { email });
      // await prisma.emailToken.delete({
      //   email: {
      //     equals: email,
      //     mode: 'insensitive',
      //   },
      // });

      return NextResponse.json({ 
        valid: true, 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        }
      });
    } catch (dbError) {
      console.error(`[${now.toISOString()}] DATABASE ERROR [${source}]:`, dbError);
      return NextResponse.json(
        { error: "Error al verificar el token en la base de datos", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}