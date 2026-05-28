import { Link, Navigate, Route, Routes } from 'react-router-dom';
import GaragePage from './pages/GaragePage';
import WinnersPage from './pages/WinnersPage';

function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">Async Race</p>
        <nav className="app-nav">
          <Link to="/garage">Garage</Link>
          <Link to="/winners">Winners</Link>
        </nav>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/garage" replace />} />
          <Route path="/garage" element={<GaragePage />} />
          <Route path="/winners" element={<WinnersPage />} />
        </Routes>
      </main>
      <footer className="app-footer">Built for RS School Async Race</footer>
    </div>
  );
}

export default App;
