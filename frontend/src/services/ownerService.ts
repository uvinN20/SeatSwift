import api from "./api";
import type { SeatItem } from "./bookingService";

export interface OwnerAccount {
  ownerId: number; username: string; fullName: string; phoneNumber: string; active: boolean; busIds: number[];
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"; reviewedBy: number | null; reviewedAt: string | null; reviewNote: string | null;
  verificationDetails: string | null;
}
export interface OwnerInput {
  username: string; fullName: string; phoneNumber: string; password: string; active: boolean; busIds: number[];
}
export interface FleetBus {
  busId: number; routeId: number; source: string; destination: string; totalSeats: number;
  ownerId: number | null; ownerName: string | null;
}
export interface OwnerTrip {
  scheduleId: number; busId: number; source: string; destination: string; travelDate: string;
  departureTime: string; price: number; totalSeats: number; bookedSeats: number; confirmedSeats: number; confirmedValue: number;
}
export interface OwnerReservation {
  bookingId: number; bookingReference: string | null; seatNumber: string; passengerName: string;
  phoneNumber: string; bookingStatus: string; amount: number;
}
export interface OwnerTripDetail { trip: OwnerTrip; seats: SeatItem[]; reservations: OwnerReservation[] }
type Envelope<T> = { data: T };
export const getOwners = () => api.get<Envelope<OwnerAccount[]>>("/admin/owners");
export const reviewOwner = (id: number, decision: "APPROVED" | "REJECTED", reason: string, identityVerified: boolean) =>
  api.post(`/admin/owners/${id}/approval`, { decision, reason, identityVerified });
export const requestOwnerAccount = (data: { username: string; fullName: string; phoneNumber: string; password: string; verificationDetails: string }) =>
  api.post("/owner-requests", data);
export const getFleetAssignments = () => api.get<Envelope<FleetBus[]>>("/admin/owners/buses");
export const saveOwner = (id: number | undefined, data: OwnerInput) => id
  ? api.put(`/admin/owners/${id}`, data) : api.post("/admin/owners", data);
export const getOwnerFleet = () => api.get<Envelope<FleetBus[]>>("/owner/buses");
export const getOwnerTrips = (date: string) => api.get<Envelope<OwnerTrip[]>>("/owner/schedules", { params: { date } });
export const getOwnerTrip = (id: number) => api.get<Envelope<OwnerTripDetail>>(`/owner/schedules/${id}`);
export const createOwnerTrip = (data: { busId: number; travelDate: string; departureTime: string; price: number }) => api.post("/owner/schedules", data);
export const updateOwnerTrip = (id: number, data: { busId: number; travelDate: string; departureTime: string; price: number }) => api.put(`/owner/schedules/${id}`, data);
export const deleteOwnerTrip = (id: number) => api.delete(`/owner/schedules/${id}`);
