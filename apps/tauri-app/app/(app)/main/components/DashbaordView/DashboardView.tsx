import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../src/components/ui/select";

import { GmailView } from "./gmail-view";
import { CalendarView } from "./calender-view";

export function DashboardView() {
  const [feature, setFeature] = useState("gmail");

  return (
    <div className="w-full h-full">
      <div className="mb-8 flex justify-end">
        <Select value={feature} onValueChange={setFeature}>
          <SelectTrigger className="w-45">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="calendar">Calendar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <main className="h-full">
        {feature === "gmail" ? <GmailView /> : <CalendarView />}
      </main>
    </div>
  );
}