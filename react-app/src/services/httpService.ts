import axios from "axios";

axios.interceptors.response.use(null, (error) => {
    if (
        !(
            error.response &&
            error.response.status >= 400 &&
            error.response.status < 500
        )
    ) {
        console.log("Logging the error", error);
        alert("An unexpected error occurred.");
    }
    return Promise.reject(error);
});

export default {
    get: axios.get,
    post: axios.post,
    put: axios.put,
    delete: axios.delete,
};
