import { Link } from 'react-router-dom';

function EmptyState({ title, description, action, actionLabel, actionHref, onAction }) {
  const resolvedAction = action ?? (
    actionLabel
      ? {
          label: actionLabel,
          href: actionHref,
          onClick: onAction,
        }
      : null
  );
  const hasAction = Boolean(resolvedAction?.label && (resolvedAction.href || resolvedAction.onClick));

  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{description}</p>
      {hasAction ? (
        <div className="empty-state-actions">
          {resolvedAction.href ? (
            <Link className="button button-primary" to={resolvedAction.href}>
              {resolvedAction.label}
            </Link>
          ) : (
            <button className="button button-primary" type="button" onClick={resolvedAction.onClick}>
              {resolvedAction.label}
            </button>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default EmptyState;
