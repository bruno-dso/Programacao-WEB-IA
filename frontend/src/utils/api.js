import axios from 'axios';

export const API_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL : API_URL
});

export function urlImagem(nomeArquivo) {
    return nomeArquivo ? `${API_URL}/uploads/${nomeArquivo}` : null;
}

export default api;
