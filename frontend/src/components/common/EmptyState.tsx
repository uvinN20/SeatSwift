import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

const EmptyState = ({ title, description, action, icon }: Props) => (
  <div className="sb-empty" role="status">
    {icon && <div className="sb-empty__icon" aria-hidden="true">{icon}</div>}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action && <div className="sb-empty__action">{action}</div>}
  </div>
);

export default EmptyState;
