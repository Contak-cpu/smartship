import { useState } from 'react';
import { Login } from '../components/Login';
import { PricingPage } from '../components/PricingPage';
import { BasicPlanPage } from '../components/BasicPlanPage';
import { ProPlanPage } from '../components/ProPlanPage';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { login } = useAuth();
  const [showPricing, setShowPricing] = useState(true);
  const [showBasicPlan, setShowBasicPlan] = useState(false);
  const [showProPlan, setShowProPlan] = useState(false);

  if (showProPlan) {
    return <ProPlanPage onGoBack={() => setShowProPlan(false)} />;
  }

  if (showBasicPlan) {
    return <BasicPlanPage onGoBack={() => setShowBasicPlan(false)} />;
  }

  if (showPricing) {
    return (
      <PricingPage 
        onGoToLogin={() => setShowPricing(false)} 
        onShowBasicPlan={() => setShowBasicPlan(true)}
        onShowProPlan={() => setShowProPlan(true)}
      />
    );
  }

  return <Login onLogin={(username, level) => login(username, level)} onGoBack={() => setShowPricing(true)} />;
};

export default LandingPage;

