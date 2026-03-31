export default function Card({ title, children, style }) {
  return (
    <div
      className="card"
      style={{ marginBottom: 20, ...style }}
    >
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}