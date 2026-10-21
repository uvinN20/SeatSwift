import api from "./api";
import type { ApiEnvelope } from "../types/payment";

export interface RouteItem {
  routeId: number;
  source: string;
  destination: string;
}

export interface ScheduleItem {
  scheduleId: number;
  routeId: number;
  busId: number;
  travelDate: string;
  departureTime: string;
  price: number | null;
}

/** A bookable trip as returned by /schedules/search (real data only). */
export interface TripResult {
  scheduleId: number;
  routeId: number;
  source: string;
  destination: string;
  busId: number;
  travelDate: string;
  departureTime: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
}

export interface SeatItem {
  seatId: number;
  busId: number;
  seatNumber: string;
  booked: boolean;
}

export const getRoutes = () => api.get<ApiEnvelope<RouteItem[]>>("/routes");

export const getSchedules = () =>
  api.get<ApiEnvelope<ScheduleItem[]>>("/schedules/all");

export const searchTrips = (source: string, destination: string, date: string) =>
  api.get<ApiEnvelope<TripResult[]>>("/schedules/search", {
    params: { source, destination, date },
  });

export const createSchedule = (data: {
  routeId: number;
  busId: number;
  travelDate: string;
  departureTime: string;
  price: number;
}) => api.post<ApiEnvelope<null>>("/schedules/add", data);

export const getScheduleSeats = (scheduleId: number) =>
  api.get<ApiEnvelope<SeatItem[]>>(`/seats/schedule/${scheduleId}`);

export const createBooking = (data: {
  scheduleId: number;
  seatId: number;
  passengerName: string;
  phoneNumber: string;
}) => api.post<ApiEnvelope<string>>("/bookings", data);

export interface RegisterPayload {
  passengerName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export const registerPassenger = (data: RegisterPayload) =>
  api.post<ApiEnvelope<null>>("/passengers/register", data);

export const getAdminSchedules = () => api.get<ApiEnvelope<ScheduleItem[]>>("/admin/schedules");
