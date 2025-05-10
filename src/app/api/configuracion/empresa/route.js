import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { obtenerConfig, registrarConfig } from '@/lib/services/configService';
import { revalidatePath } from 'next/cache';

/**
 * GET - Obtiene la configuración específica de la empresa
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener la configuración completa
    const config = await obtenerConfig();
    
    // Extraer solo los datos relacionados con la empresa
    const empresaConfig = {
      nombreConsultorio: config.nombreConsultorio || '',
      domicilio: config.domicilio || '',
      ciudad: config.ciudad || '',
      codigoPostal: config.codigoPostal || '',
      telefono: config.telefono || '',
      telefonoAlternativo: config.telefonoAlternativo || '',
      email: config.email || '',
      web: config.web || '',
      horarioAtencion: config.horarioAtencion || '',
      descripcion: config.descripcion || '',
      logoUrl: config.logoUrl || '',
      coberturas: config.coberturas || ''
    };
    
    return NextResponse.json(empresaConfig);
  } catch (error) {
    console.error('Error al obtener configuración de empresa:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al obtener configuración de empresa',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * POST - Crea o actualiza la configuración de la empresa
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener los datos del cuerpo de la petición
    const datosEmpresa = await request.json();
    
    // Obtener la configuración completa actual para no perder otros datos
    const configActual = await obtenerConfig();
    
    // Actualizar solo los campos relacionados con la empresa
    const configActualizada = {
      ...configActual,
      nombreConsultorio: datosEmpresa.nombreConsultorio,
      domicilio: datosEmpresa.domicilio,
      ciudad: datosEmpresa.ciudad,
      codigoPostal: datosEmpresa.codigoPostal,
      telefono: datosEmpresa.telefono,
      telefonoAlternativo: datosEmpresa.telefonoAlternativo,
      email: datosEmpresa.email,
      web: datosEmpresa.web,
      horarioAtencion: datosEmpresa.horarioAtencion,
      descripcion: datosEmpresa.descripcion,
      logoUrl: datosEmpresa.logoUrl,
      coberturas: datosEmpresa.coberturas,
      envio: datosEmpresa.envio || false,
      envioEmail: datosEmpresa.envioEmail || false,
      horaEnvio: datosEmpresa.horaEnvio || '08:00',
      horaEnvioEmail: datosEmpresa.horaEnvioEmail || '08:00',
      diasEnvio: datosEmpresa.diasEnvio || '0',
      diasEnvioEmail: datosEmpresa.diasEnvioEmail || '0',
    };
    
    // Guardar la configuración actualizada
    const resultado = await registrarConfig(configActualizada);
    
    if (resultado) {
      // Revalidar la página para actualizar la cache
      revalidatePath('/configuracion/empresa');
      return NextResponse.json({ 
        ok: true, 
        message: 'Configuración de empresa guardada correctamente' 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'Error al guardar la configuración de empresa' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al guardar configuración de empresa:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al guardar configuración de empresa',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * PUT - Actualiza parcialmente la configuración de la empresa
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener los datos del cuerpo de la petición
    const datosActualizados = await request.json();
    
    // Obtener la configuración completa actual para no perder otros datos
    const configActual = await obtenerConfig();
    
    // Actualizar solo los campos proporcionados
    const configActualizada = {
      ...configActual,
      ...(datosActualizados.nombreConsultorio !== undefined && { nombreConsultorio: datosActualizados.nombreConsultorio }),
      ...(datosActualizados.domicilio !== undefined && { domicilio: datosActualizados.domicilio }),
      ...(datosActualizados.ciudad !== undefined && { ciudad: datosActualizados.ciudad }),
      ...(datosActualizados.codigoPostal !== undefined && { codigoPostal: datosActualizados.codigoPostal }),
      ...(datosActualizados.telefono !== undefined && { telefono: datosActualizados.telefono }),
      ...(datosActualizados.telefonoAlternativo !== undefined && { telefonoAlternativo: datosActualizados.telefonoAlternativo }),
      ...(datosActualizados.email !== undefined && { email: datosActualizados.email }),
      ...(datosActualizados.web !== undefined && { web: datosActualizados.web }),
      ...(datosActualizados.horarioAtencion !== undefined && { horarioAtencion: datosActualizados.horarioAtencion }),
      ...(datosActualizados.descripcion !== undefined && { descripcion: datosActualizados.descripcion }),
      ...(datosActualizados.logoUrl !== undefined && { logoUrl: datosActualizados.logoUrl }),
      ...(datosActualizados.coberturas !== undefined && { coberturas: datosActualizados.coberturas })
    };
    
    // Guardar la configuración actualizada
    const resultado = await registrarConfig(configActualizada);
    
    if (resultado) {
      // Revalidar la página para actualizar la cache
      revalidatePath('/configuracion/empresa');
      return NextResponse.json({ 
        ok: true, 
        message: 'Configuración de empresa actualizada correctamente' 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'Error al actualizar la configuración de empresa' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al actualizar configuración de empresa:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al actualizar configuración de empresa',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * PATCH - Actualiza campos específicos de la configuración de la empresa
 */
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener los datos del cuerpo de la petición
    const datosActualizados = await request.json();
    
    // Obtener la configuración completa actual para no perder otros datos
    const configActual = await obtenerConfig();
    
    // Actualizar solo los campos proporcionados (igual que en PUT)
    const configActualizada = {
      ...configActual,
      ...(datosActualizados.nombreConsultorio !== undefined && { nombreConsultorio: datosActualizados.nombreConsultorio }),
      ...(datosActualizados.domicilio !== undefined && { domicilio: datosActualizados.domicilio }),
      ...(datosActualizados.ciudad !== undefined && { ciudad: datosActualizados.ciudad }),
      ...(datosActualizados.codigoPostal !== undefined && { codigoPostal: datosActualizados.codigoPostal }),
      ...(datosActualizados.telefono !== undefined && { telefono: datosActualizados.telefono }),
      ...(datosActualizados.telefonoAlternativo !== undefined && { telefonoAlternativo: datosActualizados.telefonoAlternativo }),
      ...(datosActualizados.email !== undefined && { email: datosActualizados.email }),
      ...(datosActualizados.web !== undefined && { web: datosActualizados.web }),
      ...(datosActualizados.horarioAtencion !== undefined && { horarioAtencion: datosActualizados.horarioAtencion }),
      ...(datosActualizados.descripcion !== undefined && { descripcion: datosActualizados.descripcion }),
      ...(datosActualizados.logoUrl !== undefined && { logoUrl: datosActualizados.logoUrl }),
      ...(datosActualizados.coberturas !== undefined && { coberturas: datosActualizados.coberturas })
    };
    
    // Guardar la configuración actualizada
    const resultado = await registrarConfig(configActualizada);
    
    if (resultado) {
      // Revalidar la página para actualizar la cache
      revalidatePath('/configuracion/empresa');
      return NextResponse.json({ 
        ok: true, 
        message: 'Configuración de empresa actualizada correctamente' 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'Error al actualizar la configuración de empresa' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al actualizar configuración de empresa:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al actualizar configuración de empresa',
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * DELETE - Elimina la configuración de la empresa (restablece a valores predeterminados)
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    // Obtener la configuración completa actual para no perder otros datos
    const configActual = await obtenerConfig();
    
    // Restablecer solo los campos relacionados con la empresa a valores predeterminados
    const configActualizada = {
      ...configActual,
      nombreConsultorio: '',
      domicilio: '',
      ciudad: '',
      codigoPostal: '',
      telefono: '',
      telefonoAlternativo: '',
      email: '',
      web: '',
      horarioAtencion: '',
      descripcion: '',
      logoUrl: '',
      coberturas: ''
    };
    
    // Guardar la configuración actualizada
    const resultado = await registrarConfig(configActualizada);
    
    if (resultado) {
      // Revalidar la página para actualizar la cache
      revalidatePath('/configuracion/empresa');
      return NextResponse.json({ 
        ok: true, 
        message: 'Configuración de empresa restablecida correctamente' 
      });
    } else {
      return NextResponse.json({ 
        ok: false, 
        message: 'Error al restablecer la configuración de empresa' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al restablecer configuración de empresa:', error);
    return NextResponse.json({ 
      ok: false, 
      message: 'Error al restablecer configuración de empresa',
      error: error.message 
    }, { status: 500 });
  }
}