import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const getUserProfile = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/profile`, { withCredentials: true });
        return response.data;
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
};