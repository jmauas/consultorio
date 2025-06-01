import { CldUploadWidget } from 'next-cloudinary';
import { FaFileUpload } from 'react-icons/fa';
import { useSession } from "next-auth/react";


export default function UploadClouddinary({ onImgUpload, texto}) {
    const { data } = useSession();

    const uploadHandler = async (result, { widget }) => {
        if (result.event === 'success') {            
            let {original_filename, format, secure_url, public_id } = result.info;
            if (!original_filename) original_filename = secure_url.substring(secure_url.lastIndexOf('/')+1);
            if (!format) format = secure_url.substring(secure_url.lastIndexOf('.')+1);
            onImgUpload(secure_url);
        }       
    }

    return (
        <label className={`border-1 rounded-xl flex flex-col items-center justify-center gap-2 shadow-xl p-3`}>
            <FaFileUpload size={'2em'} />
            {/* https://upload-widget.cloudinary.com/2.19.33/global/text.json */}
            <CldUploadWidget 
                uploadPreset="imgClara"
                onSuccess={uploadHandler}
                options={{
                   sources: ['local', 'camera', 'google_drive', 'url', 'dropbox', 'instagram', 'one_drive'],
                    multiple: false, // Cambiado a false para subir solo una imagen a la vez
                    folder: 'imgs',
                    language: 'es',
                    showPoweredBy: false,
                    // Restricciones para solo permitir imágenes
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
                    resourceType: 'image',
                    maxFileSize: 10000000, // 10MB máximo
                    maxImageFileSize: 10000000, // 10MB máximo para imágenes
                    accept: 'image/*',
                    text: {
                        es: {
                            OR: 'O',
                            menu: {
                                files: 'Subir desde tu dispositivo'
                            },
                            local: {
                                browse: 'Buscar',
                                dd_title_multi: 'Arrastrá los Archivos Acá.',
                                drop_title_multiple: 'Soltá los Archivos Acá.',                                       
                            },
                            "camera": {
                                "capture": "Capturar",
                                "cancel": "Cancelar",
                                "take_pic": "Tamar Foto y Subirla",
                                "explanation": "Asegurate que tu Cámara está conectada y que tu explorador permita acceder a la Cámara. Cuando estás listo, hacé click para capturar y subir.",
                                "camera_error": "Error al Acceder a la Cámara.",
                                "retry": "Reintentar Acceso a la Cámara",
                                "file_name": "Camera_{{time}}"
                            },
                            "dropbox": {
                                "no_auth_title": "Subir Archivos desde Dropbox.",
                                "no_auth_action": "Conectar a Dropbox",
                                "no_photos": "Sin Fotos",
                                "no_files": "Sin Archivos",
                                "root_crumb": "Root",
                                "list_headers": {
                                    "select": "Seleccionar",
                                    "name": "Nombre",
                                    "modified": "Modificado"
                                },
                                "menu": {
                                    "browse": "Explorar",
                                    "recent": "Reciente"
                                },
                                "authenticating": "Autenticando..."
                            },
                            "google_drive": {
                                "no_auth_title": "Subir Archivos desde Google Drive.",
                                "no_auth_action": "Conectar a Google Drive",
                                "search": {
                                    "placeholder": "Buscando...",
                                    "reset": "Reset Buscar"
                                },
                                "grid": {
                                    "folders": "Carpetas",
                                    "files": "Archivos",
                                    "empty_folder": "Carpeta Vacía",
                                },
                                "recent": "Reciente",
                                "starred": "Favoritos",
                                "my_drive": "Mi Unidad",
                                "shared_drive": "Unidades Compartidas",
                                "search_results": "Resultados de la Búsqueda",
                                "shared_with_me": "Compartido Conmigo",
                                "name": "Nombre",
                                "modifiedTime": "Modificado",
                                "modifiedByMeTime": "Modificado por Mí",
                                "viewedByMeTime": "Visto por Mí",
                                "notifications": {
                                    "retrieve_failed": "Error al Recuperar Archivos subidos a Google Drive.",
                                }
                            },                               
                        }
                    }
                }}
            >
                {({ open }) => {
                    return (
                    <button 
                        onClick={() => open()}
                        className='flex flex-wrap items-center py-2'
                    >
                        {texto}
                    </button>
                    );
                }}
            </CldUploadWidget>    
        </label>          
    )
}