import axios from "axios";


const API = axios.create({

    baseURL:
        "http://localhost:5000/api"

});


// =====================================================
// ADD JWT TOKEN
// =====================================================

API.interceptors.request.use(

    (config) => {

        const token =
            localStorage.getItem(
                "token"
            );


        if (token) {

            config.headers.Authorization =
                `Bearer ${token}`;

        }


        // IMPORTANT:
        // Do NOT force application/json
        // when uploading FormData.

        if (
            config.data instanceof FormData
        ) {

            delete config.headers[
                "Content-Type"
            ];

        }
        else {

            config.headers[
                "Content-Type"
            ] =
                "application/json";

        }


        return config;

    },

    (error) => {

        return Promise.reject(
            error
        );

    }

);


// =====================================================
// HANDLE UNAUTHORIZED
// =====================================================

API.interceptors.response.use(

    (response) => {

        return response;

    },

    (error) => {

        if (
            error.response?.status === 401
        ) {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

        }


        return Promise.reject(
            error
        );

    }

);


export default API;