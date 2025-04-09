import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  documentCount: number;
  href: string;
  color: "primary" | "secondary" | "accent";
}

const ServiceCard = ({
  title,
  description,
  icon: Icon,
  documentCount,
  href,
  color = "primary",
}: ServiceCardProps) => {
  const colorClasses = {
    primary: {
      border: "bg-primary",
      iconBg: "bg-primary-50",
      iconColor: "text-primary",
      buttonColor: "text-primary hover:text-primary-600",
    },
    secondary: {
      border: "bg-[hsl(179,48%,32%)]",
      iconBg: "bg-[hsla(179,48%,32%,0.1)]",
      iconColor: "text-[hsl(179,48%,32%)]",
      buttonColor: "text-[hsl(179,48%,32%)] hover:text-[hsl(179,48%,40%)]",
    },
    accent: {
      border: "bg-[#f59e0b]",
      iconBg: "bg-[rgba(245,158,11,0.1)]",
      iconColor: "text-[#f59e0b]",
      buttonColor: "text-[#f59e0b] hover:text-[#f8a93c]",
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className={cn("h-2", colorClasses[color].border)}></div>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center mr-3", colorClasses[color].iconBg, colorClasses[color].iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{documentCount} document{documentCount !== 1 ? 's' : ''}</span>
          <Link href={href}>
            <a className={cn("inline-flex items-center text-sm font-medium", colorClasses[color].buttonColor)}>
              Access service
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
