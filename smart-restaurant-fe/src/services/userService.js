
import api, {API_URL} from "./api";

const getAccount = async () => {
    const response = await api.get('/user/account');
    return response.data;
}

const updateAccountInfo = async (data) => {
    const response = await api.patch('/user/info', data);
    return response.data;
}

const deleteAccount = async () => {
    const response = await api.delete('/user/account');
    return response.data;
}

const changePassword = async (data) => {
    const response = await api.patch('/user/password', data);
    return response.data;
}

export const userService = {
    getAccount, 
    updateAccountInfo,
    deleteAccount,
    changePassword
};