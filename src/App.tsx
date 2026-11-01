import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { useSession } from './lib/session';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Experiences from './pages/Experiences';
import ExperienceDetail from './pages/ExperienceDetail';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Settings from './pages/Settings';

export default function App() {
  const { loggedIn, demo } = useSession();
  const canView = loggedIn || demo;
  return <Routes>
    <Route path="/login" element={canView ? <Navigate to="/dashboard" replace/> : <Auth/>}/>
    <Route element={canView ? <Layout/> : <Navigate to="/login" replace/>}>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/experiences" element={<Experiences/>}/>
      <Route path="/experiences/:id" element={<ExperienceDetail/>}/>
      <Route path="/applications" element={<Applications/>}/>
      <Route path="/applications/:id" element={<ApplicationDetail/>}/>
      <Route path="/settings" element={<Settings/>}/>
    </Route>
    <Route path="*" element={<Navigate to={canView ? '/dashboard' : '/login'} replace/>}/>
  </Routes>;
}
