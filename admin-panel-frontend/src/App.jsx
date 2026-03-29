// admin-panel-frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Route } from 'react-router-dom';
import { 
    Admin, Resource, ListGuesser, ShowGuesser, Edit, 
    Layout, Menu, MenuItemLink, CustomRoutes, 
    Title, Loading, Error, defaultTheme
} from 'react-admin';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import jsonServerProvider from 'ra-data-json-server';
import authProvider from './authProvider';
import ChangePasswordPage from './pages/ChangePasswordPage'; 

import VpnKeyIcon from '@mui/icons-material/VpnKey'; 
import LabelIcon from '@mui/icons-material/Label'; 
import ReceiptIcon from '@mui/icons-material/Receipt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; 
import PolicyIcon from '@mui/icons-material/Policy'; 

import { PendingInvoiceList } from './components/pendingInvoices/PendingInvoiceList';
import { TransactionList } from './components/transactions/TransactionList';
import { TransactionShow } from './components/transactions/TransactionShow';
import { InvoiceList } from './components/invoices/InvoiceList';
import { InvoiceShow } from './components/invoices/InvoiceShow';
import { InvoiceEdit } from './components/invoices/InvoiceEdit';
import { ConsentLogList } from './components/consentlogs/ConsentLogList';
import { ConsentLogShow } from './components/consentlogs/ConsentLogShow';

import LegalManager from './pages/LegalManager'; 

import { Card, CardContent, Typography, Grid, Paper, Box } from '@mui/material'; 
import axios from 'axios'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const ADMIN_DATA_API_URL = `${API_BASE_URL}/admin-data`;
const dataProvider = jsonServerProvider(ADMIN_DATA_API_URL);

const belgeHizliTheme = createTheme({
    ...defaultTheme,
    palette: {
        mode: 'light',
        primary: {
            main: '#2563eb', 
            dark: '#1d4ed8', 
            light: '#eff6ff', 
        },
        secondary: {
            main: '#64748b', 
        },
        background: {
            default: '#f8fafc', 
            paper: '#ffffff',
        },
        text: {
            primary: '#1e293b', 
            secondary: '#475569', 
        },
    },
    typography: {
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', 
                    borderRadius: '8px',
                    fontWeight: 600,
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    border: '1px solid #e2e8f0',
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                elevation1: {
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
                }
            }
        }
    }
});

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_BASE_URL}/admin-data/dashboard-stats`);
                setStats(response.data);
            } catch (err) {
                setError(err.response?.data?.message || "İstatistikler yüklenirken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Loading />;
    if (error) return <Error title="Hata" message={error} />;
    if (!stats) return <Typography>İstatistik verisi bulunamadı.</Typography>;

    const statCardStyle = {
        padding: '24px',
        textAlign: 'center',
        minHeight: '140px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        transition: 'transform 0.2s',
        '&:hover': {
            transform: 'translateY(-4px)'
        }
    };

    return (
        <Box sx={{ margin: 3 }}>
            <Title title="Admin Paneli - Genel Bakış" />
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }} gutterBottom>
                    Sistem Özeti
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Belge Hızlı operasyonlarının güncel durumu aşağıdadır:
                </Typography>
            </Box>
            
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{...statCardStyle, backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}> 
                        <Typography variant="subtitle2" sx={{ color: '#1e40af', fontWeight: 600, textTransform: 'uppercase' }}>Toplam İşlem</Typography>
                        <Typography variant="h3" sx={{ color: '#1d4ed8', fontWeight: 800, mt: 1 }}>{stats.totalTransactions}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{...statCardStyle, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}> 
                        <Typography variant="subtitle2" sx={{ color: '#166534', fontWeight: 600, textTransform: 'uppercase' }}>Bugünkü İşlemler</Typography>
                        <Typography variant="h3" sx={{ color: '#15803d', fontWeight: 800, mt: 1 }}>{stats.todayTransactions}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{...statCardStyle, backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}> 
                        <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 600, textTransform: 'uppercase' }}>Toplam Fatura</Typography>
                        <Typography variant="h3" sx={{ color: '#334155', fontWeight: 800, mt: 1 }}>{stats.totalInvoices}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{...statCardStyle, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}> 
                        <Typography variant="subtitle2" sx={{ color: '#991b1b', fontWeight: 600, textTransform: 'uppercase' }}>Bekleyen Fatura</Typography>
                        <Typography variant="h3" sx={{ color: '#b91c1c', fontWeight: 800, mt: 1 }}>{stats.pendingInvoices}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{...statCardStyle, backgroundColor: '#f5f3ff', borderColor: '#e9d5ff' }}> 
                        <Typography variant="subtitle2" sx={{ color: '#6b21a8', fontWeight: 600, textTransform: 'uppercase' }}>Toplam Onay Logu</Typography>
                        <Typography variant="h3" sx={{ color: '#7e22ce', fontWeight: 800, mt: 1 }}>{stats.totalConsentLogs}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

const MyMenu = () => (
    <Menu>
        <Menu.DashboardItem />
        <MenuItemLink to="/transactions-pending-invoice" primaryText="Faturalanacaklar" leftIcon={<AssignmentIndIcon />} />
        <MenuItemLink to="/transactions" primaryText="İşlemler (Transactions)" leftIcon={<LabelIcon />} />
        <MenuItemLink to="/invoices" primaryText="Faturalar (Invoices)" leftIcon={<ReceiptIcon />} />
        <MenuItemLink to="/consent-logs" primaryText="Onay Logları (Consent)" leftIcon={<VerifiedUserIcon />} />
        <MenuItemLink to="/legal-manager" primaryText="Hukuki Metinler" leftIcon={<PolicyIcon />} />
        <MenuItemLink to="/change-password" primaryText="Şifre Değiştir" leftIcon={<VpnKeyIcon />} />
    </Menu>
);

const MyLayout = (props) => <Layout {...props} menu={MyMenu} />;

function App() {
  return (
    <Admin
        theme={belgeHizliTheme} 
        dataProvider={dataProvider}
        authProvider={authProvider}
        dashboard={Dashboard}
        layout={MyLayout} 
    >
        <Resource name="transactions-pending-invoice" options={{ label: 'Faturalanacaklar' }} list={PendingInvoiceList} />
        <Resource name="transactions" options={{ label: 'İşlemler' }} list={TransactionList} show={TransactionShow} />
        <Resource name="invoices" options={{ label: 'Faturalar' }} list={InvoiceList} show={InvoiceShow} edit={InvoiceEdit} />
        <Resource name="consent-logs" options={{ label: 'Onay Logları' }} list={ConsentLogList} show={ConsentLogShow} />
        
        <CustomRoutes> 
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/legal-manager" element={<LegalManager />} />
        </CustomRoutes>
    </Admin>
  );
}

export default App;