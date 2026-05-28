import { Link, Navigate, Route, Routes } from 'react-router-dom';
import GaragePage from './pages/GaragePage';
import WinnersPage from './pages/WinnersPage';

function App(): JSX.Element {
  return (
    <div style={{ margin: '0 auto', maxWidth: 960, padding: 16 }}>
      <nav style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/garage">Garage</Link>
        <Link to="/winners">Winners</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/garage" replace />} />
        <Route path="/garage" element={<GaragePage />} />
        <Route path="/winners" element={<WinnersPage />} />
      </Routes>
    </div>
  );
}

export default App;
