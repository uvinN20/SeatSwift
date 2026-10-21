import api from "./api";
import type { Role } from "../utils/auth";

export const sharedLogin = (data: { username: string; password: string }) =>
  api.post<{ data: { token: string; role: Role } }>("/auth/login", data);

export const adminLogin = (data: {
  username: string;
  password: string;
}) => api.post("/admin/login", data);

export const passengerLogin = (data: {
  
  username: string;
  password: string;
}) =>
  api.post("/passengers/login", {
    
    email: data.username,
    password: data.password,
  });
