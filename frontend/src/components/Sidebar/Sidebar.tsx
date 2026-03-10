import SidebarButton from "./SidebarButton";
import alpineLogo from "../../assets/alpine-logo.png";
import calendarIcon from "../../assets/icons/calendar.svg";
import utensilsIcon from "../../assets/icons/utensils.svg";
import basketIcon from "../../assets/icons/basket.svg";
import kitchenIcon from "../../assets/icons/kitchen.svg";
import bookIcon from "../../assets/icons/book.svg";

const navItems = [
  { icon: calendarIcon, alt: "Calendar", to: "/", label: "Calendar View" },
  { icon: utensilsIcon, alt: "Meals", to: "/meals", label: "Meal Plan View" },
  { icon: basketIcon, alt: "Shopping", to: "/shopping", label: "Purchasing View" },
  { icon: kitchenIcon, alt: "Kitchen", to: "/kitchen", label: "Kitchen Prep View" },
  { icon: bookIcon, alt: "Recipes", to: "/recipes", label: "Menu Catalog View" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[256px] bg-sidebar border-r border-border flex flex-col items-center">
      <div className="shrink-0 mt-[20px] mb-[10px]">
        <img src={alpineLogo} alt="Alpine Logo" className="w-[150px] h-[130px] object-contain" />
      </div>

      <nav className="flex flex-1 flex-col items-center justify-center gap-[16px] pb-[20px]">
        {navItems.map((item) => (
          <SidebarButton
            key={item.alt}
            icon={item.icon}
            alt={item.alt}
            to={item.to}
            label={item.label}
          />
        ))}
      </nav>
    </aside>
  );
}
