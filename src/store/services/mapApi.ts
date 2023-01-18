// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Route, RouteData } from '../../types';
import { toast } from 'react-toastify';




// Define a service using a base URL and expected endpoints
export const mapApi = createApi({
    reducerPath: 'mapApi',
    baseQuery: fetchBaseQuery({ baseUrl: 'https://janti.ru:5381/Main/' }),
    endpoints: (builder) => ({
        getRoutes: builder.query<Route[], void>({
            query: () => `GetRoutes`,

        }),
        getRouteById: builder.query<RouteData[], number>({
            query: (id) => `GetRouteData?id=${id}`,
            transformErrorResponse: error => {
                const err2 = error as unknown as {
                    status: string;
                    originalStatus: number;
                    data: string;
                    error: string;
                };
                toast.error(err2.data, {
                    position: 'bottom-right',
                    autoClose: 5000,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "dark",

                });
                //alert(err2.data);
                return err2
            }

        }),
    }),
})

export const { useGetRoutesQuery, useLazyGetRouteByIdQuery } = mapApi