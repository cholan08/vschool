import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // We simply redirect to dashboard.
    // If the user isn't logged in, ProtectedRoute on /dashboard will catch it and redirect to /login.
    navigate('/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="loading-screen">
      <div className="spinner spinner-lg"></div>
      <p>Redirecting to dashboard...</p>
    </div>
  );
};

export default Home;
