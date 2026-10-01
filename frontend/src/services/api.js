const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "/api";

async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("token");
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData
            ? {}
            : {
                  "Content-Type": "application/json",
              }),
        ...(options.headers || {}),
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        if (response.ok) {
            throw new Error("Server mengembalikan respons yang tidak valid.");
        }
        data = {};
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
                data.error ||
                "Terjadi kesalahan pada server."
        );
    }

    return data;
}

export const api = {
    get(endpoint) {
        return apiRequest(endpoint, {
            method: "GET",
        });
    },

    post(endpoint, body) {
        return apiRequest(endpoint, {
            method: "POST",
            body:
                body instanceof FormData
                    ? body
                    : JSON.stringify(body),
        });
    },

    patch(endpoint, body) {
        return apiRequest(endpoint, {
            method: "PATCH",
            body: JSON.stringify(body),
        });
    },

    delete(endpoint) {
        return apiRequest(endpoint, {
            method: "DELETE",
        });
    },
};
