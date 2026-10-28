# SeatSwift Five Minute Demonstration Script

Keep the camera on for the full recording as required by the submission guide. Start with the webcam visible, then share the application with the webcam in a corner. Use the local development database and synthetic accounts. Do not show passwords, payment credentials or real passenger details.

## Prepare before recording

1. Follow `START-HERE.md` and confirm MySQL, the backend and frontend are running.
2. Sign in once as an approved demo bus owner and confirm that the owner has an assigned bus.
3. Keep a future date and a departure at least one hour away ready. Use a newly added unbooked departure for the edit and delete steps.
4. Have a synthetic passenger account ready. If demonstrating payment upload, prepare a clearly fictional sample slip and do not present it as a real bank transaction.
5. Close unrelated browser tabs and hide terminals that contain environment variables.

## Timed presentation

### 0:00–0:25 Project and purpose

“Hello, my name is [name], index number [index]. This is SeatSwift, a bus seat booking application. It helps passengers search departures and choose seats. Administrators manage booking and payment review, and approved bus owners manage only their assigned buses.”

Show the home page briefly and identify the passenger, administrator and owner roles.

### 0:25–1:20 Passenger search and seat selection

Open route search, choose a Sri Lankan route and a future travel date, then show departure times and seat availability. Open one departure and point out the seat map. Select an available seat and explain that occupied seats cannot be selected.

If you continue to submit a booking, use the synthetic passenger account and a prepared fictional slip. Explain that the slip enters administrator review; do not claim that the system confirms a bank transfer.

### 1:20–2:05 Administrator review and owner approval

Open the administrator workspace. Show the payment review list or explain that the administrator reviews the uploaded slip and that each decision is recorded. Then show the bus owner approval screen: a request begins pending, the administrator records a verification note, assigns the bus and approves access after checking original documents outside the application.

Use a synthetic account and do not display real identity documents. If no suitable pending request is available, use the pre-approved owner account for the owner section and describe the approval rule without changing account state during the recording.

### 2:05–3:20 Owner schedule CRUD

Sign in as the approved owner. Show the assigned fleet and departure board. Add a future departure for an assigned bus with a positive fare. Open the new row and show the seat layout and booking manifest. Edit the fare or time, save the change and point out the updated row. Delete the same unbooked test departure after confirming the prompt.

Explain that the API checks ownership and validates dates, fares and duplicate times on the server.

### 3:20–4:05 Booking history protection

Show a departure that has bookings. Point out that edit and delete are disabled because changing it could make existing tickets inaccurate. Explain that the backend also rejects these operations, including when the only booking history is cancelled.

### 4:05–4:40 Verification and setup

Show the GitHub Actions run summary. Mention that it runs Java 25 backend verification plus frontend lint, build and browser tests. Point to `START-HERE.md` for database and local run commands.

### 4:40–4:55 Close

“SeatSwift combines passenger booking, administrator review and approved owner operations. It checks booking rules on the server and preserves departures that already have booking history. Thank you.”

## Recording checks

Keep the video under five minutes. Keep the camera visible, speak clearly, use the real running application, and avoid cutting between unrelated screens. Replace the name and index placeholders before recording. Upload the video where the course requires it and submit the correct GitHub link through the specified submission sheet.
