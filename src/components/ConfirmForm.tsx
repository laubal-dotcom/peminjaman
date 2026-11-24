"use client";

export default function ConfirmForm({
  action,
  message,
  label,
  icon,
  className = "btn-outline-danger",
}: {
  action: () => Promise<void>;
  message: string;
  label: string;
  icon?: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      className="d-inline"
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button type="submit" className={`btn btn-sm ${className}`}>
        {icon && <i className={`bi ${icon}`}></i>} {label}
      </button>
    </form>
  );
}
