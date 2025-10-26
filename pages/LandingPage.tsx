import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '../components/Login';
import { PricingPage } from '../components/PricingPage';
import { BasicPlanPage } from '../components/BasicPlanPage';
import { IntermediatePlanPage } from '../components/IntermediatePlanPage';
import { ProPlanPage } from '../components/ProPlanPage';
import { useAuth } from '../hooks/useAuth';
import AuthDebugSimple from '../components/debug/AuthDebugSimple';

const LandingPage = () => {
  const { setUserState } = useAuth();
  const navigate = useNavigate();
  const [showPricing, setShowPricing] = useState(true);
  const [showBasicPlan, setShowBasicPlan] = useState(false);
  const [showIntermediatePlan, setShowIntermediatePlan] = useState(false);
  const [showProPlan, setShowProPlan] = useState(false);

  const handleLogin = (username: string, level: number) => {
    setUserState(username, level);
    // Redirigir inmediatamente al dashboard después del login
    navigate('/', { replace: true });
  };

  const handleRegisterSuccess = async (username: string, level: number) => {
    // El usuario ya está autenticado después del registro
    // Solo necesitamos actualizar el estado local
    setUserState(username, level);
    // Redirigir inmediatamente al dashboard después del registro
    navigate('/', { replace: true });
  };

  if (showProPlan) {
    return <ProPlanPage onGoBack={() => setShowProPlan(false)} />;
  }

  if (showIntermediatePlan) {
    return <IntermediatePlanPage onGoBack={() => setShowIntermediatePlan(false)} />;
  }

  if (showBasicPlan) {
    return <BasicPlanPage onGoBack={() => setShowBasicPlan(false)} />;
  }

  if (showPricing) {
    return (
      <PricingPage 
        onGoToLogin={() => setShowPricing(false)} 
        onShowBasicPlan={() => setShowBasicPlan(true)}
        onShowIntermediatePlan={() => setShowIntermediatePlan(true)}
        onShowProPlan={() => setShowProPlan(true)}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <div>
      <Login onLogin={handleLogin} onGoBack={() => setShowPricing(true)} />
      <div className="mt-4">
        <AuthDebugSimple />
      </div>
    </div>
  );
};

export default LandingPage;

