import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@shared/schema";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  CloudUpload,
  BrainCircuit,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ActivityIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "upload":
      return (
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <CloudUpload className="h-5 w-5 text-primary" />
        </div>
      );
    case "lexintuition":
      return (
        <div className="h-10 w-10 rounded-full bg-[rgba(245,158,11,0.1)] flex items-center justify-center">
          <BrainCircuit className="h-5 w-5 text-[#f59e0b]" />
        </div>
      );
    case "lexassist":
      return (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-blue-500" />
        </div>
      );
    default:
      return (
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
          <CloudUpload className="h-5 w-5 text-primary" />
        </div>
      );
  }
};

const ActivityStatus = ({ status }: { status?: string }) => {
  if (!status) return null;
  
  switch (status) {
    case "completed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="mr-1 h-3 w-3" />
          Completed
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Processing
        </span>
      );
    case "action":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Action needed
        </span>
      );
    default:
      return null;
  }
};

const ActivityTime = ({ timestamp }: { timestamp: string }) => {
  const date = new Date(timestamp);
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });
  const fullDate = format(date, "MMM d, yyyy 'at' h:mm a");
  
  return (
    <span title={fullDate} className="text-xs text-gray-500">
      {timeAgo}
    </span>
  );
};

const RecentActivities = () => {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
      </div>
      <div className="p-6">
        {isLoading ? (
          <ul className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-4 flex">
                <div className="mr-4 flex-shrink-0">
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-200">
            {activities && activities.length > 0 ? (
              activities.map((activity) => (
                <li key={activity.id} className="py-4 flex">
                  <div className="mr-4 flex-shrink-0">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.details?.title || "Activity"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.details?.description || "No description provided"}
                    </p>
                    <div className="mt-1 flex items-center">
                      <ActivityTime timestamp={activity.timestamp} />
                      {activity.details?.status && (
                        <>
                          <span className="mx-2 text-gray-300">•</span>
                          <ActivityStatus status={activity.details.status} />
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activities</p>
            )}
          </ul>
        )}
        
        <div className="mt-5">
          <button className="inline-flex items-center justify-center text-sm font-medium text-primary hover:text-primary-600">
            View all activity
            <ArrowRight className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecentActivities;
