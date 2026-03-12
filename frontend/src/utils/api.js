import toast from 'react-hot-toast';

export const fetchApi = async (url, options = {}) => {
    const token = localStorage.getItem('accessToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(`${url}`, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            throw new Error('Session expired');
        }

        const data = response.status !== 204 ? await response.json().catch(() => ({})) : null;

        if (!response.ok) {
            const errorMsg = data.error || data.detail || `API Error: ${response.statusText}`;
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Auto toast for success on non-GET requests if not suppressed
        if (options.method && options.method !== 'GET' && !options.noToast) {
            toast.success(data.message || data.status || 'Action completed successfully');
        }

        return data;
    } catch (err) {
        if (!err.message?.includes('Session expired')) {
            console.error('API Error:', err);
        }
        throw err;
    }
};

export const downloadFile = async (url, filename = 'document.pdf') => {
    const token = localStorage.getItem('accessToken');
    const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    const loadingToast = toast.loading('Preparing download...');
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error('Failed to download file');
        
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        
        toast.success('Download started', { id: loadingToast });
    } catch (err) {
        console.error('Download error:', err);
        toast.error('Failed to download document', { id: loadingToast });
    }
};
