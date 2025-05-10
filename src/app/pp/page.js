'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="bg-[#f1dddd] bg-gradient-to-br from-white to-[#f2f2f2] min-h-screen font-['Trebuchet_MS',_'Lucida_Sans_Unicode',_'Lucida_Grande',_'Lucida_Sans',_Arial,_sans-serif] pt-16">
      {/* Botón Volver fijo en la parte superior */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md py-2 px-4 z-10">
        <div className="max-w-[700px] mx-auto">
          <Link href="/" className="inline-block px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors text-lg">
            ← Volver
          </Link>
        </div>
      </div>
      
      <div id="configForm" className="max-w-[700px] mx-auto my-0 p-5 bg-white rounded-[10px] shadow-[0_10px_50px_rgba(0,0,0,0.1)]">
        <div className="m-10 p-10">
          <h2 className="mb-14 text-2xl font-bold">Política de Privacidad</h2>
          <p>Esta Política de Privacidad describe cómo se recopila, utiliza y comparte tu información personal cuando visitas o utilizas nuestra app.</p>
          <p className="py-4">
            <strong>QUÉ INFORMACIÓN PERSONAL RECOPILAMOS</strong>
          </p>
          <p>Cuando visitas el Sitio, recopilamos automáticamente cierta información sobre tu dispositivo, incluida información sobre tu navegador web, dirección IP, zona horaria y algunas de las cookies que están instaladas en tu dispositivo.</p>
          <p>
            Además, a medida que navegas por el Sitio, recopilamos información sobre las páginas web individuales o los productos que ves, qué sitios web o términos de búsqueda te remiten al Sitio, e información sobre cómo interactúas con el Sitio.        
          </p>
          <p>Recopilamos información del dispositivo utilizando las siguientes tecnologías:</p>
          <ul>
            <li>
              <p>
                <strong>Cookies</strong>
                : son archivos de datos que se colocan en tu dispositivo o computadora y con frecuencia incluyen un identificador único anónimo.
              </p>
            </li>
            <li>
              <p>
                <strong>Archivos de registro</strong>
                : rastrean las acciones que ocurren en el Sitio y recopilan datos, incluida tu dirección IP, el tipo de navegador, el proveedor de servicios de Internet, las páginas de referencia/salida y las marcas de fecha y hora.
              </p>
            </li>
          </ul>
          <p>
            Además, cuando te registras, recopilamos cierta información tuya, como tu nombre, dirección, dirección de email y el número de teléfono.
          </p>
          <p>
            Asimismo, y a los efectos de poder contar con toda la información necesaria que requierimos para llevar a cabo el trabajo, guardamos el nombre del paciente (no el apellido), su edad y sexo, como asi tambien los archivos y fotos que nos suban. Todo ello se utiliza con el único y objetivo de poder realizar el trabajo encargado de forma correcta.
          </p>   
          <p className="py-4">
            <strong>CÓMO USAMOS TU INFORMACIÓN PERSONAL</strong>
          </p>
          <p>Utilizamos la Información de la Órden de Trabajo que recopilamos para cumplir con los pedidos realizados a través del Sitio (incluido el procesamiento de tu información, la organización del envío y el envío de facturas y/o confirmaciones de pedidos).</p>
          <p>Además, usamos esta Información del Pedido para: comunicarnos contigo, examinar nuestros pedidos para detectar posibles problemas.</p>
          <p>Utilizamos la Información del Dispositivo que recopilamos para ayudarnos a detectar posibles riesgos y fraudes (en particular, tu dirección IP) y, en general, para mejorar y optimizar nuestro sitio.</p>
          <p className="py-4">
            <strong>COMPARTIENDO TU INFORMACIÓN PERSONAL</strong>
          </p>
          <p>No compartimos tu Información Personal con terceros.</p>
          <p>
            Empleamos Google Analytics para ayudarnos a comprender cómo nuestros clientes usan nuestra app. <a href="https://www.google.com/intl/en/policies/privacy/" rel="nofollow" target="_blank">Cómo usa Google tu Información Personal.</a>.
          </p>
          <p>Finalmente, también podemos compartir tu Información Personal para cumplir con las leyes y regulaciones aplicables, para responder a una citación, una orden de registro u otras solicitudes legales de información que recibimos, o para proteger nuestros derechos.</p>    
          <p className="py-4">
            <strong>TUS DERECHOS</strong>
          </p>
          <p>Tenés derecho a acceder a la información personal que tenemos sobre ti y a solicitar que tu información personal se corrija, actualice o elimine. Si deseas ejercer este derecho, por favor contáctanos.</p>
          <p className="py-4">
            <strong>RETENCIÓN DE DATOS</strong>
          </p>
          <p>Cuando realices un pedido a través del Sitio, mantendremos tu Información de Pedido para nuestros registros a menos que y hasta que nos solicites eliminar esta información.</p>
          <p className="py-4">
            <strong>MENORES</strong>
          </p>
          <p>El Sitio no está destinado a personas menores de edad.</p>
          <p className="py-4">
            <strong>CAMBIOS</strong>
          </p>
          <p>
            Podemos actualizar esta política de privacidad de vez en cuando para reflejar, por ejemplo, cambios en nuestras prácticas o por otras razones operativas, legales o reglamentarias.
          </p>
          <p className="py-4">
            Si tiene preguntas y/o necesitas más información, no dudes en ponerte en contacto con nosotros 
          </p>
          <div className="p-6 flex flex-col gap-4 items-center text-lg">
            {/* Uncomment this when you have a WhatsApp component */}
            {/* <Wa /> */}
          </div>
        </div>
      </div>
    </div>
  );
}