import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">EVA Foundation 2.0</h1>
        <p className="app-subtitle">Enterprise AI Platform Administration</p>
      </header>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
