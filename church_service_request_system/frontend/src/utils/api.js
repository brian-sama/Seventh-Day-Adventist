export const fetchApi = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Token ${token}` } : {}),
        ...options.headers,
    };

    // Remove Content-Type if body is FormData (browser will set it with boundary)
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`http://localhost:8080${url}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    if (response.status !== 204) {
        return response.json();
    }
    return null;
};
