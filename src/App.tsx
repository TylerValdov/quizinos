import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SetsProvider } from './context/SetsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import SetEditor from './pages/SetEditor';
import SetDetail from './pages/SetDetail';
import Flashcards from './pages/Flashcards';
import Learn from './pages/Learn';

export default function App() {
  return (
    <SetsProvider>
      <HashRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/sets/new" element={<SetEditor mode="create" />} />
            <Route path="/sets/:id" element={<SetDetail />} />
            <Route path="/sets/:id/edit" element={<SetEditor mode="edit" />} />
            <Route path="/sets/:id/flashcards" element={<Flashcards />} />
            <Route path="/sets/:id/learn" element={<Learn />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </SetsProvider>
  );
}
