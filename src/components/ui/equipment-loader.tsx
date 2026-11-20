type EquipmentLoaderProps = {
  message: string;
  title?: string;
  className?: string;
};

export function EquipmentLoader({
  message,
  title,
  className = "",
}: EquipmentLoaderProps) {
  return (
    <div
      aria-live="polite"
      className={`equipment-loader-status ${className}`}
      role="status"
    >
      <div aria-hidden="true" className="equipment-loader-animation">
        <div className="equipment-loader">
          {Array.from({ length: 9 }, (_, index) => (
            <div className="equipment-loader-text" key={index}>
              <span>Loading</span>
            </div>
          ))}
          <div className="equipment-loader-line" />
        </div>
      </div>
      {title ? <p className="equipment-loader-title">{title}</p> : null}
      <p className="equipment-loader-message">{message}</p>
    </div>
  );
}
