// Script para limpiar el storage de autenticación y resetear el estado
// Ejecutar en la consola del navegador para debugging

function clearAuthStorage() {
  console.log('🧹 Limpiando storage de autenticación...');
  
  // Limpiar todas las claves relacionadas con Supabase
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('supabase') || key.includes('sb-')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log(`🗑️ Eliminando: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Limpiar sessionStorage también
  sessionStorage.clear();
  
  console.log('✅ Storage limpiado. Recargando página...');
  window.location.reload();
}

// Función para verificar el estado actual del storage
function checkAuthStorage() {
  console.log('🔍 Estado actual del storage:');
  console.log('localStorage keys:', Object.keys(localStorage));
  console.log('sessionStorage keys:', Object.keys(sessionStorage));
  
  // Buscar específicamente claves de Supabase
  const supabaseKeys = Object.keys(localStorage).filter(key => 
    key.includes('supabase') || key.includes('sb-')
  );
  
  console.log('🔑 Claves de Supabase encontradas:', supabaseKeys);
  
  supabaseKeys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`${key}:`, value ? 'Presente' : 'No encontrado');
  });
}

// Exportar funciones para uso en consola
window.clearAuthStorage = clearAuthStorage;
window.checkAuthStorage = checkAuthStorage;

console.log('🛠️ Utilidades de debugging cargadas:');
console.log('- clearAuthStorage() - Limpia el storage y recarga');
console.log('- checkAuthStorage() - Verifica el estado del storage');