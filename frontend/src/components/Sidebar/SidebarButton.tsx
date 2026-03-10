import { NavLink } from "react-router-dom";

interface SidebarButtonProps {
  icon: string;
  alt: string;
  to: string;
  label: string;
}

export default function SidebarButton({ icon, alt, to, label }: SidebarButtonProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        group relative flex items-center justify-center w-[120px] h-[80px] rounded-[10px]
        shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] cursor-pointer no-underline shrink-0
        transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-[0px_6px_8px_0px_rgba(0,0,0,0.3)]
        ${isActive ? "bg-gold" : "bg-white"}
      `}
    >
      {({ isActive }) => (
        <>
          <img
            src={icon}
            alt={alt}
            className={`max-h-[50px] max-w-[60px] object-contain ${
              isActive ? "[filter:brightness(0)_invert(1)]" : ""
            }`}
          />
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-black/80 px-3 py-1.5 font-inter text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
