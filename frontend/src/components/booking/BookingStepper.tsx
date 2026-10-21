const BOOKING_STEPS = ["Select bus", "Select seats", "Passengers", "Payment", "Confirmation"] as const;

/** `current` is the 0-based index of the active step; earlier steps are shown as done. */
const BookingStepper = ({ current }: { current: number }) => (
  <ol className="sb-steps" aria-label="Booking progress">
    {BOOKING_STEPS.map((label, i) => {
      const state = i < current ? "is-done" : i === current ? "is-current" : "";
      return (
        <li key={label} className={state} aria-current={i === current ? "step" : undefined}>
          <span className="sb-steps__dot">{i < current ? "✓" : i + 1}</span>
          <span className="sb-steps__label">{label}</span>
        </li>
      );
    })}
  </ol>
);

export default BookingStepper;
