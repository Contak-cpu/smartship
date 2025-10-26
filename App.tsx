import React from 'react';
import { BrowserRouter as Router, useRoutes } from 'react-router-dom';
import { routes } from './routes/routes';
import { PageTransition } from './components/common/PageTransition';

// Componente que renderiza las rutas
const AppRoutes = () => {
  const element = useRoutes(routes);
  return element;
};

const App: React.FC = () => {
  return (
    <Router>
      <PageTransition duration={1200} showLoader={true}>
        <AppRoutes />
      </PageTransition>
    </Router>
  );
};

export default App;
