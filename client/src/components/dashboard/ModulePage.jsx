function ModulePage({ eyebrow, title, description, icon: Icon, primaryItems, statusItems }) {
  return (
    <section className="module-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <Icon size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="dashboard-description">{description}</p>
        </div>
      </div>

      <div className="module-page-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Funciones disponibles</h2>
            <p>Información y acciones principales de esta sección.</p>
          </div>
          <div className="feature-list">
            {primaryItems.map((item) => (
              <article className="feature-item" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>Estado</h2>
            <p>Resumen operativo de esta sección.</p>
          </div>
          <div className="progress-list">
            {statusItems.map((item) => (
              <div key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default ModulePage;
