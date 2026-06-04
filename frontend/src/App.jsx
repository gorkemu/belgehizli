// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import styles from './App.module.css';
import { Helmet } from 'react-helmet-async';
import { LanguageWrapper } from './components/LanguageWrapper';
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
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UserTemplateEdit from './pages/UserTemplateEdit';
import { ProjectsManager } from './pages/ProjectsManager';
import SettingsPage from './pages/SettingsPage';
import ForgotPassword from './pages/ForgotPassword';
import SetPassword from './pages/SetPassword';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { CommandPalette } from './components/CommandPalette';
import CookieBanner from './components/CookieBanner';
import ScrollToTop from './components/ScrollToTop';

const GlobalLayout = () => {
    return (
        <>
            <CommandPalette />
            <Outlet />
        </>
    );
};

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

const ProtectedDashboardLayout = () => {
    return (
        <div style={{ height: '100vh', width: '100%', overflow: 'hidden' }}>
            <Header />
            <DashboardLayout />
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
                    <ScrollToTop />
                    <Routes>
                        <Route path="/" element={<Navigate to="/tr" replace />} />
                        
                        <Route path="/f/:slug" element={<HostedForm />} />

                        <Route path="/:lang" element={<LanguageWrapper />}>
                            
                            <Route element={<GlobalLayout />}>
                                
                                <Route element={<MainLayout />}>
                                    <Route index element={<HomePage />} />
                                    
                                    <Route path="giris-yap" element={<Login />} />
                                    <Route path="login" element={<Login />} />
                                    
                                    <Route path="kayit-ol" element={<Register />} />
                                    <Route path="register" element={<Register />} />

                                    <Route path="sifremi-unuttum" element={<ForgotPassword />} />
                                    <Route path="forgot-password" element={<ForgotPassword />} />

                                    <Route path="sifre-belirle" element={<SetPassword />} />
                                    <Route path="set-password" element={<SetPassword />} />
                                    
                                    <Route path="sablonlar" element={<TemplateList />} />
                                    <Route path="templates" element={<TemplateList />} />
                                    
                                    <Route path="sablonlar/detay/:slug" element={<TemplateDetail />} />
                                    <Route path="templates/detail/:slug" element={<TemplateDetail />} />
                                    
                                    <Route path="hakkimizda" element={<AboutUs />} />
                                    <Route path="about-us" element={<AboutUs />} />

                                    <Route path="iletisim" element={<ContactUs />} />
                                    <Route path="contact-us" element={<ContactUs />} />
                                    <Route path="iletisim/:status" element={<ContactUs />} />
                                    <Route path="contact-us/:status" element={<ContactUs />} />
                                    
                                    <Route path="gizlilik-politikasi" element={<PrivacyPolicy />} />
                                    <Route path="privacy-policy" element={<PrivacyPolicy />} />
                                    
                                    <Route path="kullanim-sartlari" element={<TermsOfService />} />
                                    <Route path="terms-of-service" element={<TermsOfService />} />
                                    
                                    <Route path="on-bilgilendirme-formu" element={<PreInformationForm />} />
                                    <Route path="pre-information-form" element={<PreInformationForm />} />
                                    
                                    <Route path="*" element={<NotFound />} />
                                </Route>

                                <Route element={<ProtectedRoute />}>
                                    <Route element={<ProtectedDashboardLayout />}>
                                        <Route path="panel" element={<Dashboard />} />
                                        <Route path="dashboard" element={<Dashboard />} />
                                        
                                        <Route path="panel/projects" element={<ProjectsManager />} />
                                        <Route path="dashboard/projects" element={<ProjectsManager />} />
                                        
                                        <Route path="panel/settings" element={<SettingsPage />} />
                                        <Route path="dashboard/settings" element={<SettingsPage />} />
                                    </Route>

                                    <Route path="panel/duzenle/:id" element={<UserTemplateEdit />} />
                                    <Route path="dashboard/edit/:id" element={<UserTemplateEdit />} />
                                </Route>

                            </Route> 

                        </Route>
                    </Routes>
                </Router>
            </>
        </AuthProvider>
    );
}

export default App;