import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import GlobalSpotlight from './components/CardEffects.jsx';
import './styles.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppProvider() {
  const content = (
    <AuthProvider>
      <GlobalSpotlight glowColor="132, 0, 255" spotlightRadius={320} />
      <App />
    </AuthProvider>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: '#fee2e2',
          color: '#991b1b',
          fontFamily: 'monospace',
          height: '100vh',
          boxSizing: 'border-box',
          overflow: 'auto'
        }}>
          <h1>Something went wrong in the UI</h1>
          <p style={{ fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider />
    </ErrorBoundary>
  </React.StrictMode>
);


