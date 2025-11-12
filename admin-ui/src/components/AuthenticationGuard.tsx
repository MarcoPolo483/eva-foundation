import React from 'react';

export const AuthenticationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // In a real implementation, check authentication state
  const isAuthenticated = true; // Mock for demo
  
  if (!isAuthenticated) {
    return (
      <div className="loading">
        Please sign in to access the EVA Foundation Admin Dashboard
      </div>
    );
  }

  return <>{children}</>;
};
