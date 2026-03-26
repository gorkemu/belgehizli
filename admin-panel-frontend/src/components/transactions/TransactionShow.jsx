// admin-panel-frontend/src/components/transactions/TransactionShow.jsx
import * as React from "react";
import {
    Show,
    SimpleShowLayout,
    TextField,
    DateField,
    NumberField,
    ReferenceField,
    FunctionField,
    ChipField,
    useNotify,
    useRefresh,
    useRecordContext,
    Button,
    Link 
} from "react-admin";
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom'; 
import EditIcon from '@mui/icons-material/Edit'; 
import ListIcon from '@mui/icons-material/List';   

const JsonDataField = ({ source, record = {} }) => {
    if (!record || typeof record[source] === 'undefined') {
        return null;
    }
    let data = record[source];
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return <pre>{data}</pre>;
        }
    }
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

const ResendEmailButton = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [loading, setLoading] = React.useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

    const handleClick = async () => {
        if (!record || !record.id) {
            notify('Transaction ID bulunamadı.', { type: 'error' });
            return;
        }
        if (!record.userEmail || record.userEmail === 'unknown@example.com') {
            notify('Bu işlem için geçerli bir kullanıcı e-postası bulunmuyor, e-posta gönderilemez.', { type: 'warning' });
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/document/resend-email/${record.id}`);
            notify('E-posta tekrar gönderme isteği başarıyla iletildi.', { type: 'success' });
        } catch (error) {
            console.error("Error resending email:", error);
            const message = error.response?.data?.message || 'E-posta tekrar gönderilirken bir hata oluştu.';
            notify(message, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!record || !record.userEmail || record.userEmail === 'unknown@example.com') {
        return null;
    }

    return (
        <Button
            label="E-postayı Tekrar Gönder"
            onClick={handleClick}
            disabled={loading}
            variant="contained"
            color="secondary"
            sx={{ marginTop: 2, marginBottom: 1 }}
        />
    );
};

export const TransactionShow = (props) => {
    return (
        <Show {...props} >
            <SimpleShowLayout>
                <ResendEmailButton />

                <TextField source="id" label="Transaction ID" />
                <TextField source="userEmail" label="Kullanıcı E-postası" />
                <TextField source="templateName" label="Şablon Adı" />
                <TextField source="templateId" label="Şablon ID (Referans Değil)" />

                <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
                <TextField source="currency" label="Para Birimi" />
                <ChipField source="status" label="Durum" />
                <TextField source="paymentGatewayRef" label="Ödeme Ref." emptyText="-" />
                
                <ReferenceField label="Fatura ID" source="invoiceId" reference="invoices" link="show" allowEmpty>
                    <TextField source="id" />
                </ReferenceField>
                
                <FunctionField label="Fatura Aksiyonları" render={record => 
                    record && record.invoiceId ? (
                        <Button
                            component={RouterLink}
                            to={`/invoices/${record.invoiceId}/edit`}
                            label="Faturayı Düzenle"
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            sx={{ marginTop: '0px', marginLeft: '1em' }}
                        >
                            <EditIcon sx={{ marginRight: '0.5em' }} /> Faturayı Düzenle
                        </Button>
                    ) : (
                        <span>Fatura oluşturulmamış.</span>
                    )
                } />

                <FunctionField label="Onay Logları" render={record =>
                    record && record.id ? (
                        <Button
                            component={Link}
                            to={{
                                pathname: '/consent-logs',
                                search: `filter=${JSON.stringify({ transactionId: record.id })}&displayedFilters=${JSON.stringify({ transactionId: true })}`,
                            }}
                            label="Bu İşleme Ait Onay Loglarını Gör"
                            variant="outlined"
                            size="small"
                            startIcon={<ListIcon />}
                        >
                             <ListIcon sx={{ marginRight: '0.5em' }} /> Onay Logları
                        </Button>
                    ) : null
                }/>
                
                <DateField source="createdAt" label="Oluşturulma Tarihi" showTime />
                <DateField source="updatedAt" label="Güncellenme Tarihi" showTime />
                
                <FunctionField label="Form Verileri" render={record => <JsonDataField source="formDataSnapshot" record={record} />} />
                <FunctionField 
                    label="Fatura Bilgileri" 
                    render={record => record.billingInfoSnapshot ? <JsonDataField source="billingInfoSnapshot" record={record} /> : "Girilmemiş"} 
                />
                <TextField source="errorMessage" label="Hata Mesajı" emptyText="-" />
            </SimpleShowLayout>
        </Show>
    );
};