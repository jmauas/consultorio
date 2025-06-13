// src/components/consultorio/HorariosTab.js
import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import toast from 'react-hot-toast';
import { isColorLight } from '@/lib/utils/variosUtils';

const HorariosTab = ({ 
  config, 
  consultorios,
  selectedDoctorForAgenda, 
  setSelectedDoctorForAgenda,
  selectedConsultorioForAgenda,
  setSelectedConsultorioForAgenda,
  horarioConflictos,
  setHorarioConflictos,
  detectarConflictosHorarios,
  setConfig
}) => {
    const { theme } = useTheme();
    // Estados para la modalidad de agenda
    const [agendaMode, setAgendaMode] = useState('semanal'); // 'semanal' o 'fechas'
    const [dateAgenda, setDateAgenda] = useState({
      atencion: true,
      desde: "09:00",
      hasta: "18:00",
      corteDesde: "",
      corteHasta: ""
    });
    
  return (
    <div className=" p-6 rounded-xl shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold mb-4">Horarios de Atención</h3>
      
      <div className="mt-6">
        <h4 className="font-medium mb-3">
          {selectedDoctorForAgenda 
            ? `Agenda de: ${selectedDoctorForAgenda.nombre}`
            : "Seleccione un doctor para ver o editar su agenda"}
        </h4>
        
        {!selectedDoctorForAgenda ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {config.doctores.length === 0 ? (
              <p className="col-span-full text-center py-4 ">
                No hay doctores registrados. Por favor, cree un doctor primero.
              </p>
            ) : (
              config.doctores.map(doctor => (
                <div key={doctor.id} 
                  className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-colorsç`}
                  onClick={() => setSelectedDoctorForAgenda(doctor)}
                  style={{ 
                    backgroundColor: doctor?.color || '#CCCCCC',
                    color: isColorLight(doctor?.color || '#CCCCCC') ? '#000000' : '#FFFFFF'
                  }}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">{doctor.emoji || '👨‍⚕️'}</span>
                    <h3 className="text-lg font-medium">{doctor.nombre}</h3>
                  </div>
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Días de atención: </span>
                      {Object.entries(doctor.diasAtencion || {})
                        .filter(([_, value]) => value)
                        .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1))
                        .join(', ') || 'No configurados'}
                    </p>
                    <button className="mt-3 px-3 py-1 bg-[var(--color-primary)] text-white text-sm rounded-md hover:bg-[var(--color-primary-dark)]">
                      <i className="fas fa-calendar-alt mr-2"></i>
                      Ver / Editar Agenda
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="mt-4">
            <div className={`${theme==='dark' ? 'bg-slate-800' : 'bg-slate-100'}  border-l-4 border-[var(--color-primary)] p-4 mb-4`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium flex items-center">
                    <span className="text-xl mr-2">{selectedDoctorForAgenda.emoji || '👨‍⚕️'}</span>
                    {selectedDoctorForAgenda.nombre}
                  </h4>
                  <p className="text-sm ">Configuración de horarios semanales</p>
                </div>
                <button 
                  onClick={() => setSelectedDoctorForAgenda(null)}
                  className="px-3 py-1 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] text-sm"
                >
                  <i className="fa fa-chevron-circle-left mr-2"></i>
                  Volver a la lista
                </button>
              </div>
            </div>
            
            {/* Selector de Consultorio */}
            <div className="mb-6 p-4 rounded-lg border border-gray-200">
              <h4 className="font-bold mb-3">
                Seleccione un consultorio para configurar la agenda
              </h4>
              
              {consultorios.length === 0 ? (
                <div className={`${theme==='dark' ? 'bg-slate-800' : 'bg-slate-100'} p-4 rounded-lg border border-gray-200 text-center`}>
                  <p className=" mb-2">No hay consultorios registrados</p>
                  <p className="text-sm ">
                    Primero debe crear al menos un consultorio en la pestaña Consultorios
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {consultorios.map(consultorio => (
                    <div 
                      key={consultorio.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedConsultorioForAgenda?.id === consultorio.id                          ? theme==='dark' ? 'bg-[var(--color-primary-dark)] border-[var(--color-primary)]' : 'bg-[var(--color-secondary)] border-[var(--color-primary)]'
                          : theme==='dark' ? 'bg-slate-800 border-[var(--color-primary)]' :'bg-white border-gray-200 hover:bg-[var(--color-secondary)] hover:border-[var(--color-primary)]'
                      }`}
                      onClick={() => {
                        setSelectedConsultorioForAgenda(consultorio);
                        const conflictos = detectarConflictosHorarios(selectedDoctorForAgenda.id, consultorio.id);
                        setHorarioConflictos(conflictos);
                      }}
                    >
                      <div className="font-medium ">{consultorio.nombre}</div>
                      {consultorio.direccion && (
                        <div className="text-xs  mt-1">{consultorio.direccion}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedConsultorioForAgenda && (
            <>
              {/* Selector de Modalidad de Agenda */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200">
                <h4 className="font-bold mb-3">
                  Modalidad de Agenda
                </h4>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setAgendaMode('semanal')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      agendaMode === 'semanal'
                        ? 'bg-[var(--color-primary)] text-white'
                        : theme === 'dark' 
                          ? 'bg-slate-800 text-white hover:bg-[var(--color-primary-dark)]' 
                          : 'bg-white border border-gray-300 hover:bg-[var(--color-secondary)]'
                    }`}
                  >
                    <i className="fas fa-calendar-week mr-2"></i>
                    Agenda Semanal
                  </button>
                  <button
                    onClick={() => setAgendaMode('fechas')}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      agendaMode === 'fechas'
                        ? 'bg-[var(--color-primary)] text-white'
                        : theme === 'dark' 
                          ? 'bg-slate-800 text-white hover:bg-[var(--color-primary-dark)]' 
                          : 'bg-white border border-gray-300 hover:bg-[var(--color-secondary)]'
                    }`}
                  >
                    <i className="fas fa-calendar-day mr-2"></i>
                    Agenda por Fechas
                  </button>
                </div>
              </div>
              
              {/* Alerta de conflictos */}
              {horarioConflictos.length > 0 && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-600 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <i className="fas fa-exclamation-triangle text-red-600"></i>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Se detectaron conflictos de horarios
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc space-y-1 pl-5">
                          {horarioConflictos.map((conflicto, index) => (
                            <li key={index}>{conflicto.mensaje}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Agenda por fechas */}
              {agendaMode === 'fechas' && (
                <div className="mb-6">
                  <div className="p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="font-bold mb-3">
                      Agregar fecha de atención específica
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                          type="date"    
                          id="selectedDate"                         
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                        <input
                          type="time"
                          value={dateAgenda.desde}
                          onChange={(e) => setDateAgenda({...dateAgenda, desde: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Hora Fin</label>
                        <input
                          type="time"
                          value={dateAgenda.hasta}
                          onChange={(e) => setDateAgenda({...dateAgenda, hasta: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Corte Inicio</label>
                        <input
                          type="time"
                          value={dateAgenda.corteDesde}
                          onChange={(e) => setDateAgenda({...dateAgenda, corteDesde: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Corte Fin</label>
                        <input
                          type="time"
                          value={dateAgenda.corteHasta}
                          onChange={(e) => setDateAgenda({...dateAgenda, corteHasta: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                        />
                      </div>
                    </div>
                    <div className="mt-4 text-right">                     
                      <button 
                        onClick={() => {
                          const selectedDate = document.querySelector('#selectedDate').value;
                          if (!selectedDate) return;
                          
                          // Crear objeto Date con la fecha seleccionada
                          const f = new Date(selectedDate);
                          f.setHours(f.getHours() + 3); // Ajuste horario si es necesario
                          
                          const newDoctores = JSON.parse(JSON.stringify(config.doctores));
                          const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                          
                          if (doctorIndex !== -1) {
                            // Crear nueva entrada para esta fecha específica
                            newDoctores[doctorIndex].agenda.push({
                              dia: 99, // Código 99 para fechas específicas
                              fecha: f, // Guardar como objeto Date
                              nombre: 'fecha',
                              atencion: true,
                              desde: dateAgenda.desde,
                              hasta: dateAgenda.hasta,
                              corteDesde: dateAgenda.corteDesde,
                              corteHasta: dateAgenda.corteHasta,
                              consultorioId: selectedConsultorioForAgenda.id
                            });
                            
                            setConfig({...config, doctores: newDoctores});
                            
                            setSelectedDoctorForAgenda(newDoctores[doctorIndex]);                            
                           
                            // Mostrar mensaje de éxito
                            toast.success('Fecha agregada correctamente');
                          }
                        }}
                        
                        className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-md hover:bg-[var(--color-primary-dark)] disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-plus-circle mr-2"></i>
                        Agregar Fecha
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabla de fechas existentes */}
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className={`min-w-full ${theme==='dark' ? 'bg-slate-800' : 'bg-white'} `}>
                      <thead className="border-b">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Hora Inicio</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Hora Fin</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Corte Inicio</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Corte Fin</th>
                          <th className="py-3 px-4 text-left text-xs font-medium uppercase tracking-wider">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedDoctorForAgenda.agenda
                          .filter(a => a.dia === 99 && a.consultorioId === selectedConsultorioForAgenda.id)
                          .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                          .map((fechaAgenda, index) => (
                            <tr key={index}>                              
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-medium">
                                  {fechaAgenda.fecha ? 
                                    (fechaAgenda.fecha instanceof Date ? 
                                      fechaAgenda.fecha.toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      }) : 
                                      new Date(fechaAgenda.fecha).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      })
                                    ) : '-'
                                  }
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">{fechaAgenda.desde}</td>
                              <td className="py-3 px-4 whitespace-nowrap">{fechaAgenda.hasta}</td>
                              <td className="py-3 px-4 whitespace-nowrap">{fechaAgenda.corteDesde || '-'}</td>
                              <td className="py-3 px-4 whitespace-nowrap">{fechaAgenda.corteHasta || '-'}</td>                              
                              <td className="py-3 px-4 whitespace-nowrap">
                                <button 
                                  onClick={() => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      // Encontrar el índice exacto de esta fecha específica
                                      const agendaItemIndex = selectedDoctorForAgenda.agenda.findIndex(a => 
                                        a === fechaAgenda // Comparar por referencia directa
                                      );
                                      
                                      if (agendaItemIndex !== -1) {
                                        // Eliminar esta fecha específica del doctor seleccionado
                                        const updatedAgenda = [...selectedDoctorForAgenda.agenda];
                                        updatedAgenda.splice(agendaItemIndex, 1);
                                        
                                        // Actualizar doctor en config
                                        newDoctores[doctorIndex].agenda = newDoctores[doctorIndex].agenda.filter(
                                          a => a.dia !== 99 || a.consultorioId !== selectedConsultorioForAgenda.id || 
                                               (a.fecha && fechaAgenda.fecha && 
                                                a.fecha.toString() !== fechaAgenda.fecha.toString())
                                        );
                                        
                                        setConfig({...config, doctores: newDoctores});
                                        
                                        // Actualizar doctor seleccionado
                                        setSelectedDoctorForAgenda({
                                          ...selectedDoctorForAgenda,
                                          agenda: updatedAgenda
                                        });
                                        
                                        // Mostrar mensaje de éxito
                                        toast.success('Fecha eliminada correctamente');
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        {selectedDoctorForAgenda.agenda.filter(a => a.dia === 99 && a.consultorioId === selectedConsultorioForAgenda.id).length === 0 && (
                          <tr>
                            <td colSpan="6" className="py-4 text-center text-sm">
                              No hay fechas específicas configuradas
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Agenda semanal */}
              {agendaMode === 'semanal' && (
                <>
                  {/* Desktop view - Table format */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-md">
                    <table className={`min-w-full ${theme==='dark' ? 'bg-slate-800' : 'bg-white'} `}>
                      <thead className="border">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Día
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Atiende
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Hora Inicio
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Hora Fin
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Corte Inicio
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-medium  uppercase tracking-wider">
                            Corte Fin
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'feriado'].map((dia, index) => {
                          // Filter agenda items for the selected doctor and consultorio
                          const diaNum = index < 7 ? index : 9; // Use code 9 for "feriado"
                          const diaAgenda = selectedDoctorForAgenda.agenda.find(a => 
                            a.dia === diaNum && 
                            a.consultorioId === selectedConsultorioForAgenda.id
                          ) || {
                            atencion: false,
                            desde: "09:00",
                            hasta: "18:00",
                            corteDesde: "",
                            corteHasta: ""
                          };
                          
                          return (
                            <tr key={dia}>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-bold capitalize">{dia}</div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={diaAgenda.atencion}
                                  onChange={() => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      // Find agenda entry for this day and consultorio
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        // Update existing entry
                                        newDoctores[doctorIndex].agenda[agendaIndex].atencion = !diaAgenda.atencion;
                                      } else {
                                        // Create new entry for this consultorio
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: "18:00",
                                          corteDesde: "",
                                          corteHasta: "",
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                      }
                                      
                                      // Update diasAtencion for UI
                                      newDoctores[doctorIndex].diasAtencion = {
                                        ...newDoctores[doctorIndex].diasAtencion,
                                        [dia]: !diaAgenda.atencion
                                      };
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                                />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={diaAgenda.desde}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].desde = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: e.target.value,
                                          hasta: "18:00",
                                          corteDesde: "",
                                          corteHasta: "",
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={diaAgenda.hasta}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].hasta = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: e.target.value,
                                          corteDesde: "",
                                          corteHasta: "",
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={diaAgenda.corteDesde}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].corteDesde = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: "18:00",
                                          corteDesde: e.target.value,
                                          corteHasta: "",
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={diaAgenda.corteHasta}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].corteHasta = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: "18:00",
                                          corteDesde: "",
                                          corteHasta: e.target.value,
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view - Card format */}
                  <div className="md:hidden space-y-4">
                    {['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'feriado'].map((dia, index) => {
                      // Filter agenda items for the selected doctor and consultorio
                      const diaNum = index < 7 ? index : 9; // Use code 9 for "feriado"
                      const diaAgenda = selectedDoctorForAgenda.agenda.find(a => 
                        a.dia === diaNum && 
                        a.consultorioId === selectedConsultorioForAgenda.id
                      ) || {
                        atencion: false,
                        desde: "09:00",
                        hasta: "18:00",
                        corteDesde: "",
                        corteHasta: ""
                      };

                      return (
                        <div 
                          key={dia} 
                          className={`border rounded-lg p-4 ${
                            diaAgenda.atencion 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-base font-medium capitalize text-gray-900">{dia}</h4>
                            <div className="flex items-center">
                              <span className="text-xs  mr-2">Activo</span>
                              <input
                                type="checkbox"
                                checked={diaAgenda.atencion}
                                onChange={() => {
                                  const newDoctores = [...config.doctores];
                                  const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                  
                                  if (doctorIndex !== -1) {
                                    const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                      a.dia === diaNum && 
                                      a.consultorioId === selectedConsultorioForAgenda.id
                                    );
                                    
                                    if (agendaIndex !== -1) {
                                      newDoctores[doctorIndex].agenda[agendaIndex].atencion = !diaAgenda.atencion;
                                    } else {
                                      newDoctores[doctorIndex].agenda.push({
                                        dia: diaNum,
                                        nombre: dia,
                                        atencion: true,
                                        desde: "09:00",
                                        hasta: "18:00",
                                        corteDesde: "",
                                        corteHasta: "",
                                        consultorioId: selectedConsultorioForAgenda.id
                                      });
                                    }
                                    
                                    newDoctores[doctorIndex].diasAtencion = {
                                      ...newDoctores[doctorIndex].diasAtencion,
                                      [dia]: !diaAgenda.atencion
                                    };
                                    
                                    setConfig({...config, doctores: newDoctores});
                                    setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                  }
                                }}
                                className="h-4 w-4 text-[var(--color-primary)] focus:ring-[var(--color-primary)] border-gray-300 rounded"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium  mb-1">
                                Hora Inicio
                              </label>
                              <input
                                type="time"
                                value={diaAgenda.desde}
                                onChange={(e) => {
                                  const newDoctores = [...config.doctores];
                                  const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                  
                                  if (doctorIndex !== -1) {
                                    const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                      a.dia === diaNum && 
                                      a.consultorioId === selectedConsultorioForAgenda.id
                                    );
                                    
                                    if (agendaIndex !== -1) {
                                      newDoctores[doctorIndex].agenda[agendaIndex].desde = e.target.value;
                                    } else {
                                      newDoctores[doctorIndex].agenda.push({
                                        dia: diaNum,
                                        nombre: dia,
                                        atencion: true,
                                        desde: e.target.value,
                                        hasta: "18:00",
                                        corteDesde: "",
                                        corteHasta: "",
                                        consultorioId: selectedConsultorioForAgenda.id
                                      });
                                      
                                      newDoctores[doctorIndex].diasAtencion = {
                                        ...newDoctores[doctorIndex].diasAtencion,
                                        [dia]: true
                                      };
                                    }
                                    
                                    setConfig({...config, doctores: newDoctores});
                                    setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                  }
                                }}
                                disabled={!diaAgenda.atencion}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium  mb-1">
                                Hora Fin
                              </label>
                              <input
                                type="time"
                                value={diaAgenda.hasta}
                                onChange={(e) => {
                                  const newDoctores = [...config.doctores];
                                  const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                  
                                  if (doctorIndex !== -1) {
                                    const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                      a.dia === diaNum && 
                                      a.consultorioId === selectedConsultorioForAgenda.id
                                    );
                                    
                                    if (agendaIndex !== -1) {
                                      newDoctores[doctorIndex].agenda[agendaIndex].hasta = e.target.value;
                                    } else {
                                      newDoctores[doctorIndex].agenda.push({
                                        dia: diaNum,
                                        nombre: dia,
                                        atencion: true,
                                        desde: "09:00",
                                        hasta: e.target.value,
                                        corteDesde: "",
                                        corteHasta: "",
                                        consultorioId: selectedConsultorioForAgenda.id
                                      });
                                      
                                      newDoctores[doctorIndex].diasAtencion = {
                                        ...newDoctores[doctorIndex].diasAtencion,
                                        [dia]: true
                                      };
                                    }
                                    
                                    setConfig({...config, doctores: newDoctores});
                                    setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                  }
                                }}
                                disabled={!diaAgenda.atencion}
                                className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                              />
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className="block text-xs font-medium  mb-1">
                              Horario de Corte (Pausa/Almuerzo)
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <input
                                  type="time"
                                  value={diaAgenda.corteDesde}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].corteDesde = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: "18:00",
                                          corteDesde: e.target.value,
                                          corteHasta: "",
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                  placeholder="Desde"
                                />
                              </div>
                              <div>
                                <input
                                  type="time"
                                  value={diaAgenda.corteHasta}
                                  onChange={(e) => {
                                    const newDoctores = [...config.doctores];
                                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                                    
                                    if (doctorIndex !== -1) {
                                      const agendaIndex = newDoctores[doctorIndex].agenda.findIndex(a => 
                                        a.dia === diaNum && 
                                        a.consultorioId === selectedConsultorioForAgenda.id
                                      );
                                      
                                      if (agendaIndex !== -1) {
                                        newDoctores[doctorIndex].agenda[agendaIndex].corteHasta = e.target.value;
                                      } else {
                                        newDoctores[doctorIndex].agenda.push({
                                          dia: diaNum,
                                          nombre: dia,
                                          atencion: true,
                                          desde: "09:00",
                                          hasta: "18:00",
                                          corteDesde: "",
                                          corteHasta: e.target.value,
                                          consultorioId: selectedConsultorioForAgenda.id
                                        });
                                        
                                        newDoctores[doctorIndex].diasAtencion = {
                                          ...newDoctores[doctorIndex].diasAtencion,
                                          [dia]: true
                                        };
                                      }
                                      
                                      setConfig({...config, doctores: newDoctores});
                                      setSelectedDoctorForAgenda(newDoctores[doctorIndex]);
                                    }
                                  }}
                                  disabled={!diaAgenda.atencion}
                                  className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400"
                                  placeholder="Hasta"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
                {/* Botón para guardar agenda */}
              <div className="mt-6 flex justify-end">                <button
                  onClick={() => {
                    // Crear copia profunda del array de doctores
                    let newDoctores = JSON.parse(JSON.stringify(config.doctores));
                    const doctorIndex = newDoctores.findIndex(d => d.id === selectedDoctorForAgenda.id);
                    
                    if (doctorIndex !== -1) {
                      const agenda = [...newDoctores[doctorIndex].agenda];
                      newDoctores[doctorIndex].agenda = []

                      // Si es agenda semanal, mantener comportamiento actual
                      if (agendaMode === 'semanal') {
                        ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'feriado'].forEach((dia, index) => {
                          const diaNum = index < 7 ? index : 9;
                          
                          // Recuperar entrada de UI si existe
                          const diaAgenda = agenda.find(a => 
                            a.dia === diaNum && 
                            a.consultorioId === selectedConsultorioForAgenda.id
                          );
                          
                          // Guardar todos los días, tanto activos como inactivos
                          if (diaAgenda) {
                            newDoctores[doctorIndex].agenda.push({
                              ...diaAgenda,
                              fecha: null // Asegurar que el campo fecha esté vacío
                            });
                          }
                        });
                      }
                      // Para agenda por fechas, usar las fechas originales guardadas
                      else if (agendaMode === 'fechas') {
                        const diaAgenda = agenda.filter(a => a.dia === 99);                   
                        // Agregar fechas a la agenda desde las guardadas temporalmente
                        if (diaAgenda.length > 0) {
                          newDoctores[doctorIndex].agenda = diaAgenda;
                        }
                      } 
                      console.log('Doctor:', newDoctores[doctorIndex]);
                      console.log('Doctores:', newDoctores);

                      // Actualizar el estado con las nuevas configuraciones
                      setConfig({...config, doctores: newDoctores});
                      
                      // Actualizar el doctor seleccionado con los datos del arreglo original 
                      // para mantener los objetos Date intactos
                      const doctorActualizado = {
                        ...selectedDoctorForAgenda,
                        agenda: [
                          ...selectedDoctorForAgenda.agenda.filter(a => a.consultorioId !== selectedConsultorioForAgenda.id),
                          ...newDoctores[doctorIndex].agenda.filter(a => a.consultorioId === selectedConsultorioForAgenda.id)
                        ]
                      };                      
                      setSelectedDoctorForAgenda(doctorActualizado);
                      // Mostrar mensaje de éxito
                      toast.success('Agenda guardada correctamente');
                    }
                  }}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white font-medium rounded-md hover:bg-[var(--color-primary-dark)]"
                >
                  <i className="fas fa-save mr-2"></i>
                  Guardar Agenda
                </button>
              </div>
            </>
            )}
            
            {selectedConsultorioForAgenda && (
            <div className="mt-4 text-sm ">
              <p className="flex items-center">
                <i className="fas fa-info-circle text-[var(--color-primary)] mr-2"></i>
                El horario de corte representa un período de pausa (por ejemplo, para almuerzo) donde no se atenderán pacientes.
              </p>
            </div>
            )}
            
            {!selectedConsultorioForAgenda && consultorios.length > 0 && (
              <div className="p-8 text-center border border-dashed border-gray-300 rounded-lg">
                <p className="text-lg  mb-2">Seleccione un consultorio para ver y configurar los horarios</p>
                <p className="text-sm ">La agenda se mostrará después de seleccionar un consultorio</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HorariosTab;
