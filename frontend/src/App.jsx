// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Outlet } from 'react-router-dom';
import styles from './App.module.css';
import { Helmet } from 'react-helmet-async';
import NotFound from './pages/NotFound';
import HomePage from './pages/HomePage';
import TemplateList from './pages/TemplateList';
import TemplateDetail from './pages/TemplateDetail';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import PreInformationForm from './pages/PreInformationForm';
import Header from './components/Header';
import Footer from './components/Footer';
import HostedForm from './components/HostedForm';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import UserTemplateEdit from './pages/UserTemplateEdit';
import { ProjectsManager } from './pages/ProjectsManager';
import { DashboardLayout } from './components/DashboardLayout';
import SettingsPage from './pages/SettingsPage';
import { CommandPalette } from './components/CommandPalette';
import CookieBanner from './components/CookieBanner';

const MainLayout = () => {
    return (
        <div className={styles.appContainer}>
            <Header />
            <main className={styles.appMain}>
                <Outlet />
            </main>
            <Footer />
            <CookieBanner />
        </div>
    );
};

function App() {
    const isStaging = window.location.hostname.includes('staging') || window.location.hostname.includes('vercel.app');

    return (
        <AuthProvider>
            <>
                {isStaging && (
                    <Helmet>
                        <meta name="robots" content="noindex, nofollow" />
                    </Helmet>
                )}
                <Router>
                    <CommandPalette />
                    <Routes>
                        <Route path="/f/:slug" element={<HostedForm />} />

                        <Route element={<MainLayout />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/giris-yap" element={<Login />} />
                            <Route path="/kayit-ol" element={<Register />} />
                            <Route path="/sablonlar" element={<TemplateList />} />
                            <Route path="/sablonlar/detay/:slug" element={<TemplateDetail />} />
                            <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
                            <Route path="/kullanim-sartlari" element={<TermsOfService />} />
                            <Route path="/hakkimizda" element={<AboutUs />} />
                            <Route path="/on-bilgilendirme-formu" element={<PreInformationForm />} />
                            <Route path="/iletisim" element={<ContactUs />} />
                            <Route path="/iletisim/:status" element={<ContactUs />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="/panel" element={<Dashboard />} />
                                <Route path="/panel/projects" element={<ProjectsManager />} />
                                <Route path="/panel/settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="/panel/duzenle/:id" element={<UserTemplateEdit />} />
                        </Route>
                    </Routes>
                </Router>
            </>
        </AuthProvider>
    );
}

export default App;