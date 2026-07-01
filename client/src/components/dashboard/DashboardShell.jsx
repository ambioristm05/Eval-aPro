import { Link } from 'react-router-dom';

function DashboardShell({ eyebrow, title, description, stats, actions, children }) {
  return (
    <section className="dashboard-shell">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="dashboard-description">{description}</p>
        </div>
      </div>

      <div className="metric-grid" aria-label="Resumen del panel">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article className="metric-card" key={stat.label}>
              <span className="metric-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Acciones principales</h2>
            <p>Modulos que se activaran en los proximos pasos.</p>
          </div>
          <div className="action-list">
            {actions.map((action) => {
              const Icon = action.icon;
              const ActionWrapper = action.href ? Link : 'article';
              const wrapperProps = action.href ? { to: action.href } : {};

              return (
                <ActionWrapper className="action-item" key={action.title} {...wrapperProps}>
                  <span className="action-icon">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3>{action.title}</h3>
                    <p>{action.description}</p>
                  </div>
                </ActionWrapper>
              );
            })}
          </div>
        </section>

        {children}
      </div>
    </section>
  );
}

export default DashboardShell;
