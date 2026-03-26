const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const authProvider = { 
    login: async ({ username, password }) => {
        const request = new Request(`${API_URL}/admin/login`, {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            headers: new Headers({ 'Content-Type': 'application/json' }),
        });
        try {
            const response = await fetch(request);
            if (response.status < 200 || response.status >= 300) {
                let errorMsg = 'Giriş başarısız oldu. Sunucu hatası.';
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody.message || `Giriş başarısız: ${response.statusText}`;
                } catch (e) {
                    errorMsg = `Giriş başarısız: ${response.statusText}`;
                }
                throw new Error(errorMsg);
            }
            const auth = await response.json();
            if (!auth.token) {
                throw new Error('Giriş yanıtında token bulunamadı.');
            }
            localStorage.setItem('admin_token', auth.token);
            return Promise.resolve();
        } catch (error) {
            console.error("Login error details:", error);
            throw new Error(error.message || 'Giriş sırasında bir sorun oluştu.');
        }
    },

    logout: () => {
        localStorage.removeItem('admin_token');
        return Promise.resolve();
    },

    checkError: ({ status }) => {
        if (status === 401 || status === 403) {
            localStorage.removeItem('admin_token');
            return Promise.reject({ message: false });
        }
        return Promise.resolve();
    },

    checkAuth: () => {
        return localStorage.getItem('admin_token')
            ? Promise.resolve()
            : Promise.reject({ redirectTo: '/login' });
    },

    getPermissions: () => {
        return localStorage.getItem('admin_token') ? Promise.resolve('admin') : Promise.reject();
    },

    getIdentity: () => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            return Promise.resolve({ id: 'admin', fullName: 'Admin' });
        }
        return Promise.reject(new Error('Kullanıcı kimliği alınamadı.'));
    }
};

export default authProvider;