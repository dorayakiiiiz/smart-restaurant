import api, { API_URL } from "./api";

const getTables = async () => {
    const response = await api.get('/tables');
    return response.data;
}

const createTable = async (data) => {
    const response = await api.post('/tables', data);
    return response.data;
}

const updateTable = async (id, data) => {
    const response = await api.put(`/tables/${id}`, data);
    return response.data;
}

const deleteTable = async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
}

const toggleActiveTable = async (id) => {
    const response = await api.patch(`/tables/${id}/toggle-active`);
    return response.data;
}

const regenerateQR = async (id) => {
    const response = await api.post(`/tables/${id}/regenerate`);
    return response.data;
}

// Helper download file chung
const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
};

const downloadPDF = async (id, tableName) => {
    const response = await api.get(`/tables/${id}/download-pdf`, { responseType: 'blob' });
    downloadFile(response.data, `QR_${tableName}.pdf`);
}

const downloadPNG = async (id, tableName) => {
    const response = await api.get(`/tables/${id}/download-png`, { responseType: 'blob' });
    downloadFile(response.data, `QR_${tableName}.png`);
}

const downloadBatchZIP = async () => {
    const response = await api.get(`/tables/batch/download-zip`, { responseType: 'blob' });
    downloadFile(response.data, `All_QRs.zip`);
}

const downloadBatchPDF = async () => {
    const response = await api.get(`/tables/batch/download-pdf`, { responseType: 'blob' });
    downloadFile(response.data, `All_Tables.pdf`);
}

export const tableService = {
    getTables,
    createTable,
    updateTable,
    deleteTable,
    toggleActiveTable,
    regenerateQR,
    downloadPDF,
    downloadPNG,
    downloadBatchZIP,
    downloadBatchPDF
};