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

// JSON verisini formatlı göstermek için helper component
const JsonDataField = ({ source, record = {} }) => {
    if (!record || typeof record[source] === 'undefined') {
        return null; // Veri yoksa bir şey gösterme veya "Yok" de
    }
    let data = record[source];
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return <pre>{data}</pre>; // Parse edilemezse olduğu gibi göster
        }
    }
    return <pre>{JSON.stringify(data, null, 2)}</pre>;
};

// --- E-postayı Tekrar Gönder Butonu ---
const ResendEmailButton = () => {
    const record = useRecordContext(); // Mevcut transaction kaydını alır
    const notify = useNotify();
    const refresh = useRefresh(); // Sayfayı yenilemek için
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
            // refresh(); // Opsiyonel: Transaction kaydında bir değişiklik (örn: lastEmailResentAt) olursa sayfayı yenile
        } catch (error) {
            console.error("Error resending email:", error);
            const message = error.response?.data?.message || 'E-posta tekrar gönderilirken bir hata oluştu.';
            notify(message, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!record || !record.userEmail || record.userEmail === 'unknown@example.com') {
        // E-posta yoksa butonu gösterme veya pasif yap
        return null; // Veya <Button label="E-posta Gönderilemez" disabled />;
    }

    return (
        <Button
            label="E-postayı Tekrar Gönder"
            onClick={handleClick}
            disabled={loading}
            variant="contained" // Material UI butonu için
            color="secondary"   // Farklı bir renk
            sx={{ marginTop: 2, marginBottom: 1 }} // Biraz boşluk
        />
    );
};
// --- BUTON SONU ---

export const TransactionShow = (props) => {
    // useRecordContext'i burada da alabiliriz, butonlar için props olarak geçmek yerine.
    // Ancak ResendEmailButton kendi içinde zaten alıyor, o yüzden burada tekrar almak şart değil.
    // const record = useRecordContext(); // Eğer aşağıdaki butonları ayrı component yapmayacaksak

    return (
        <Show {...props} >
            <SimpleShowLayout>
                <ResendEmailButton /> {/* E-posta Tekrar Gönder Butonu */}

                <TextField source="id" label="Transaction ID" />
                <TextField source="userEmail" label="Kullanıcı E-postası" />
                <TextField source="templateName" label="Şablon Adı" />
                <TextField source="templateId" label="Şablon ID (Referans Değil)" />

                <NumberField source="amount" label="Tutar" options={{ style: 'currency', currency: 'TRY' }} />
                <TextField source="currency" label="Para Birimi" />
                <ChipField source="status" label="Durum" />
                <TextField source="paymentGatewayRef" label="Ödeme Ref." emptyText="-" />
                
                {/* Fatura Alanı ve Linkleri */}
                <ReferenceField label="Fatura ID" source="invoiceId" reference="invoices" link="show" allowEmpty>
                    <TextField source="id" />
                </ReferenceField>
                
                {/* Faturayı Düzenle Butonu (Eğer invoiceId varsa) */}
                {/* FunctionField, record'u child component'e props olarak geçirir */}
                <FunctionField label="Fatura Aksiyonları" render={record => 
                    record && record.invoiceId ? (
                        <Button
                            component={RouterLink} // Veya React Admin'in <Link> component'i
                            to={`/invoices/${record.invoiceId}/edit`}
                            label="Faturayı Düzenle"
                            variant="outlined"
                            size="small"
                            startIcon={<EditIcon />}
                            sx={{ marginTop: '0px', marginLeft: '1em' }} // ReferenceField ile aynı hizada olması için
                        >
                            <EditIcon sx={{ marginRight: '0.5em' }} /> Faturayı Düzenle
                        </Button>
                    ) : (
                        <span>Fatura oluşturulmamış.</span>
                    )
                } />


                {/* Onay Loglarına Filtreli Link */}
                {/* FunctionField kullanarak butonu record bazlı render et */}
                <FunctionField label="Onay Logları" render={record =>
                    record && record.id ? (
                        <Button
                            component={Link} // React Admin'in Link component'i
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