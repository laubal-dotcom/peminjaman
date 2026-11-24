"use client";

export default function SidebarToggle() {
  return (
    <button
      className="btn btn-outline-secondary d-lg-none"
      onClick={() => document.getElementById("sidebar")?.classList.toggle("show")}
    >
      <i className="bi bi-list"></i>
    </button>
  );
}
