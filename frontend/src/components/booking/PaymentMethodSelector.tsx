import { SITE } from "../../config/site";

/** Only what the backend supports is selectable. Card payment is shown disabled and clearly labelled. */
const PaymentMethodSelector = () => {
  const { bankName, accountName, accountNumber, branch } = SITE.bank;
  const configured = !!(bankName || accountName || accountNumber);

  return (
    <div className="sb-stack">
      <div className="sb-method" role="radio" aria-checked="true" tabIndex={0}>
        <div>
          <strong>Bank transfer</strong>
          <p className="sb-muted">Transfer the total, then upload your payment slip below.</p>
        </div>
      </div>
      <div className="sb-method sb-method--disabled" role="radio" aria-checked="false" aria-disabled="true">
        <div>
          <strong>Card payment</strong> <span className="sb-tag">Not available yet</span>
        </div>
      </div>

      {configured ? (
        <dl className="sb-bank" aria-label="Bank account details">
          {bankName && <div><dt>Bank</dt><dd>{bankName}</dd></div>}
          {branch && <div><dt>Branch</dt><dd>{branch}</dd></div>}
          {accountName && <div><dt>Account name</dt><dd>{accountName}</dd></div>}
          {accountNumber && <div><dt>Account number</dt><dd>{accountNumber}</dd></div>}
        </dl>
      ) : (
        <p className="sb-muted">
          Bank account details have not been configured on this site. Please contact the operator for the
          account to transfer to before uploading your slip.
        </p>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
