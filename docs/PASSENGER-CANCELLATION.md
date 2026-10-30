SeatSwift passenger cancellation update

1. Stop the running frontend and backend with Ctrl+C.
2. Back up your project folder.
3. Copy the backend and frontend folders from this archive into your existing SeatSwift project folder. Replace the matching files.
4. No database migration is needed for the current Java 25 edition: it already supports CANCELLED and a generated active_seat_id.
5. In backend, run: mvn test
6. Restart the backend with your existing environment settings and run-backend.cmd.
7. Restart the frontend using npm run dev in frontend.

Passengers: Sign in > My bookings > Upcoming > Cancel booking > Confirm.
Cancellation is allowed before departure in Asia/Colombo time. Only the authenticated passenger can cancel their own booking. Repeated cancellation is safe. The record is marked CANCELLED, its seat is released for this schedule, and history is retained. Previously submitted payment records remain for review. No automatic refund is performed.

Verification: frontend npm run build passed. Four backend database tests are included but could not be executed in the authoring environment, which lacks Java 25 and Maven. Run mvn test locally.

Manual check: Book a future departure, cancel it, open the Cancelled tab, refresh the page and verify the record remains cancelled. Open the same departure from another passenger account and confirm that the released seat can be booked. Attempting to cancel another passenger's booking must return 404; cancellation at or after departure must return 409.
