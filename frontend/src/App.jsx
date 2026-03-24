// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import CookieConsent from "react-cookie-consent";
import styles from './App.module.css';
import { Helmet } from 'react-helmet-async'; 
import NotFound from './components/NotFound';
import HomePage from './components/HomePage';
import TemplateList from './components/TemplateList';
import TemplateDetail from './components/TemplateDetail';
import AboutUs from './components/AboutUs';
import ContactUs from './components/ContactUs';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import DeliveryReturn from './components/DeliveryReturn';
import PreInformationForm from './components/PreInformationForm'; 
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingSupport from './components/FloatingSupport';

function App() {
    return (
        <Router>
            <Helmet> 
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </Helmet> 

            <div className={styles.appContainer}>
                
                <Header />

                <main className={styles.appMain}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/sablonlar" element={<TemplateList />} />
                        <Route path="/sablonlar/detay/:slug" element={<TemplateDetail />} />
                        <Route path="/gizlilik-politikasi" element={<PrivacyPolicy />} />
                        <Route path="/kullanim-sartlari" element={<TermsOfService />} />
                        <Route path="/teslimat-iade" element={<DeliveryReturn />} />
                        <Route path="/hakkimizda" element={<AboutUs />} />
                        <Route path="/on-bilgilendirme-formu" element={<PreInformationForm />} />
                        <Route path="/iletisim">
                            <Route path=":status" element={<ContactUs />} />
                            <Route path="" element={<ContactUs />} />
                        </Route>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

                <Footer />
                <FloatingSupport />
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
                    <Link to="/gizlilik-politikasi" style={{ color: "var(--accent)", textDecoration: "underline" }}>
                        Gizlilik Politikamızı
                    </Link>{" "}
                    okuyun.
                </CookieConsent>
            </div>
        </Router>
    );
}

export default App;