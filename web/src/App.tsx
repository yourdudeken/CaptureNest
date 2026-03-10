import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Camera from './pages/Camera';
import Library from './pages/Library';
import Search from './pages/Search';
import Settings from './pages/Settings';
import MediaDetail from './pages/MediaDetail';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/camera"      element={<Camera />} />
        <Route path="/library"     element={<Library />} />
        <Route path="/library/:id" element={<MediaDetail />} />
        <Route path="/search"      element={<Search />} />
        <Route path="/settings"    element={<Settings />} />
      </Route>
    </Routes>
  );
}
