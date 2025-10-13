import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Login } from '../components/Login';
import { PricingPage } from '../components/PricingPage';
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPricing, setShowPricing] = useState(true);

  const handleLogin = (username: string) => {
    login(username);
    // Navegar inmediatamente después del login
    navigate('/', { replace: true });
  };

  if (showPricing) {
    return (
      <PricingPage 
        onGoToLogin={() => setShowPricing(false)}
      />
    );
  }

  return <Login onLogin={handleLogin} onGoBack={() => setShowPricing(true)} />;
};

export default LandingPage;

