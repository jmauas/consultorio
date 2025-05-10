import { NextResponse } from 'next/server';
import { 
  obtenerCuentasWhatsapp, 
  obtenerCuentaWhatsapp,
  crearCuentaWhatsapp, 
  actualizarCuentaWhatsapp, 
  eliminarCuentaWhatsapp 
} from '@/lib/services/configService';

// GET /api/configuracion/whatsapp
export async function GET(request) {
  try {
    // Obtener el ID de la cuenta de la URL si existe
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Si se proporciona un ID, obtener una cuenta específica
      const cuenta = await obtenerCuentaWhatsapp(id);
      
      if (!cuenta) {
        return NextResponse.json(
          { error: 'Cuenta de WhatsApp no encontrada' }, 
          { status: 404 }
        );
      }
      
      return NextResponse.json(cuenta);
    } else {
      // Si no hay ID, obtener todas las cuentas
      const cuentas = await obtenerCuentasWhatsapp();
      return NextResponse.json(cuentas);
    }
  } catch (error) {
    console.error('Error al procesar la solicitud GET:', error);
    return NextResponse.json(
      { error: 'Error al obtener cuentas de WhatsApp' }, 
      { status: 500 }
    );
  }
}

// POST /api/configuracion/whatsapp
export async function POST(request) {
  try {
    const datos = await request.json();
    
    // Validar que los datos requeridos estén presentes
    if (!datos.nombre || !datos.url || !datos.token) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (nombre, url, token)' }, 
        { status: 400 }
      );
    }
    
    // Crear la nueva cuenta
    const nuevaCuenta = await crearCuentaWhatsapp(datos);
    
    if (!nuevaCuenta) {
      return NextResponse.json(
        { error: 'Error al crear la cuenta de WhatsApp' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(nuevaCuenta, { status: 201 });
  } catch (error) {
    console.error('Error al procesar la solicitud POST:', error);
    return NextResponse.json(
      { error: 'Error al crear cuenta de WhatsApp' }, 
      { status: 500 }
    );
  }
}

// PUT /api/configuracion/whatsapp
export async function PUT(request) {
  try {
    const datos = await request.json();
    
    // Validar que los datos requeridos estén presentes
    if (!datos.id || !datos.nombre || !datos.url || !datos.token) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (id, nombre, url, token)' }, 
        { status: 400 }
      );
    }
    
    // Verificar que la cuenta exista
    const cuentaExistente = await obtenerCuentaWhatsapp(datos.id);
    
    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta de WhatsApp no encontrada' }, 
        { status: 404 }
      );
    }
    
    // Actualizar la cuenta
    const cuentaActualizada = await actualizarCuentaWhatsapp(datos.id, datos);
    
    if (!cuentaActualizada) {
      return NextResponse.json(
        { error: 'Error al actualizar la cuenta de WhatsApp' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json(cuentaActualizada);
  } catch (error) {
    console.error('Error al procesar la solicitud PUT:', error);
    return NextResponse.json(
      { error: 'Error al actualizar cuenta de WhatsApp' }, 
      { status: 500 }
    );
  }
}

// DELETE /api/configuracion/whatsapp
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere un ID para eliminar una cuenta de WhatsApp' }, 
        { status: 400 }
      );
    }
    
    // Verificar que la cuenta exista
    const cuentaExistente = await obtenerCuentaWhatsapp(id);
    
    if (!cuentaExistente) {
      return NextResponse.json(
        { error: 'Cuenta de WhatsApp no encontrada' }, 
        { status: 404 }
      );
    }
    
    // Eliminar la cuenta
    const resultado = await eliminarCuentaWhatsapp(id);
    
    if (!resultado) {
      return NextResponse.json(
        { error: 'Error al eliminar la cuenta de WhatsApp' }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al procesar la solicitud DELETE:', error);
    return NextResponse.json(
      { error: 'Error al eliminar cuenta de WhatsApp' }, 
      { status: 500 }
    );
  }
}