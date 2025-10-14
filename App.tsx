import React from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { routes } from './routes/routes';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';

// Componente que renderiza las rutas
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

const App: React.FC = () => {
  return (
    <SupabaseAuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </SupabaseAuthProvider>
  );
};

export default App;
