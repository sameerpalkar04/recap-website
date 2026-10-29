import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ShowPage from './components/ShowPage';
import HomePage from './components/HomePage';
import ShowsPage from './components/ShowsPage';
import MyRecapsPage from './components/MyRecapsPage';
import Footer from './components/Footer';
import AuthPage from './components/AuthPage';
import AuthCallbackPage from './components/AuthCallbackPage';
import './styles.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/shows" element={<ShowsPage />} />
          <Route path="/recaps" element={<MyRecapsPage />} />
          <Route path="/show/:showName" element={<ShowPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
        <Footer />
      </main>
    </BrowserRouter>
  );
}
