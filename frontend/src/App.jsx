// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Outlet } from 'react-router-dom';
import CookieConsent from "react-cookie-consent";
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
import UserTemplateCreate from './pages/UserTemplateCreate';
import UserTemplateEdit from './pages/UserTemplateEdit';
import UserFillTemplate from './pages/UserFillTemplate';
import { ProjectsManager } from './pages/ProjectsManager';
import { ProjectDetail } from './pages/ProjectDetail';
import { FocusEditor } from './pages/FocusEditor';
import { DashboardLayout } from './components/DashboardLayout';
import SettingsPage from './pages/SettingsPage';
import { CommandPalette } from './components/CommandPalette';

const MainLayout = () => {
    return (
        <div className={styles.appContainer}>
            <Header />
            <main className={styles.appMain}>
                <Outlet />
            </main>
            <Footer />
            <CookieConsent
                location="bottom"
                buttonText="Kabul Et"
                declineButtonText="Reddet"
                cookieName="belgeHizliCookieConsent"
                style={{ background: "var(--gray-900)", color: "var(--gray-100)", fontSize: "0.9rem", padding: "10px 20px", alignItems: "center" }}
                buttonStyle={{ background: "var(--primary-color)", color: "white", fontSize: "0.9rem", fontWeight: "600", borderRadius: "var(--radius-md)", padding: "10px 20px", margin: "0 10px 0 0" }}
                declineButtonStyle={{ background: "transparent", color: "var(--gray-300)", border: "1px solid var(--gray-600)", fontSize: "0.9rem", borderRadius: "var(--radius-md)", padding: "9px 20px" }}
                expires={150}
                enableDeclineButton
            >
                Bu web sitesi, kullanıcı deneyimini geliştirmek ve site trafiğini analiz etmek için çerezleri kullanır. Daha fazla bilgi için{" "}
                <Link to="/gizlilik-politikasi" style={{ color: "var(--gray-300)", textDecoration: "underline" }}>
                    Gizlilik Politikamızı
                </Link>{" "}
                okuyun.
            </CookieConsent>
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
                                <Route path="/panel/projects/:id" element={<ProjectDetail />} />
                                <Route path="/panel/settings" element={<SettingsPage />} />
                            </Route>

                            <Route path="/panel/editor/:id" element={<FocusEditor />} />
                            <Route path="/panel/yeni-form" element={<UserTemplateCreate />} />
                            <Route path="/panel/duzenle/:id" element={<UserTemplateEdit />} />
                            <Route path="/panel/doldur/:id" element={<UserFillTemplate />} />
                        </Route>

                    </Routes>

                </Router>
            </>
        </AuthProvider>
    );
}

export default App;