// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

//pnpm packages

//in house modules/packages
import { corsair, getTenant } from "@repo/corsair"

//current working directory files


export interface EventSummary {
    id: string;
    summary: string;
    description: string;
    location: string;
    startDateTime: string;
    endDateTime: string;
    isAllDay: boolean;
    status: string;
    organizer: string;
    attendeeCount: number;
    hangoutLink: string;
}

export interface EventDetail {
    id: string;
    summary: string;
    description: string;
    location: string;
    startDateTime: string;
    endDateTime: string;
    isAllDay: boolean;
    status: string;
    organizer: string;
    organizerEmail: string;
    creator: string;
    creatorEmail: string;
    attendees: Array<{
        email: string;
        displayName: string;
        responseStatus: string;
        self: boolean;
    }>;
    hangoutLink: string;
    htmlLink: string;
    recurrence: string[];
    colorId: string;
    visibility: string;
    created: string;
    updated: string;
}

export interface CalendarStats {
    totalEvents: number;
    todayCount: number;
    thisWeekCount: number;
    upcomingCount: number;
}

export interface ConnectionStatusResult {
    connected: boolean;
    signInUrl?: string;
}

type GCalConnectionState = "connected" | "not_connected" | "missing_credentials"

class CalendarService {
    //================================= private methods ====================================

    private async fetchEvents(
        userId: string,
        timeMin: string,
        timeMax: string,
        maxResults: number
    ): Promise<any[]> {
        try {
            const tenant = await getTenant(userId)
            const listRes = await tenant.googlecalendar.api.events.getMany({
                timeMin,
                timeMax,
                maxResults,
                singleEvents: true,
                orderBy: "startTime",
            }) as any

            return listRes.items || []
        } catch (error) {
            throw new Error(
                `fetchEvents failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async fetchEventById(userId: string, eventId: string): Promise<any> {
        try {
            const tenant = await getTenant(userId)
            return await tenant.googlecalendar.api.events.get({ id: eventId }) as any
        } catch (error) {
            throw new Error(
                `fetchEventById failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async getCalendarConnectionState(userId: string): Promise<GCalConnectionState> {
        try {
            const status = await corsair.manage.connectionStatus.get({ tenantId: userId })
            return (status as any).googlecalendar as GCalConnectionState
        } catch (error) {
            throw new Error(
                `getCalendarConnectionState failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private getEventDateTime(event: any): { start: string; end: string; isAllDay: boolean } {
        const startObj = event.start ?? {}
        const endObj = event.end ?? {}

        // All-day events use `date`, timed events use `dateTime`
        const isAllDay = !!(startObj.date && !startObj.dateTime)

        return {
            start: startObj.dateTime ?? startObj.date ?? "",
            end: endObj.dateTime ?? endObj.date ?? "",
            isAllDay,
        }
    }

    private mapToEventSummary(event: any): EventSummary {
        const { start, end, isAllDay } = this.getEventDateTime(event)

        return {
            id: event.id ?? "",
            summary: event.summary ?? "(No title)",
            description: event.description ?? "",
            location: event.location ?? "",
            startDateTime: start,
            endDateTime: end,
            isAllDay,
            status: event.status ?? "confirmed",
            organizer: event.organizer?.displayName ?? event.organizer?.email ?? "",
            attendeeCount: event.attendees?.length ?? 0,
            hangoutLink: event.hangoutLink ?? "",
        }
    }

    private mapToEventDetail(event: any): EventDetail {
        const { start, end, isAllDay } = this.getEventDateTime(event)

        return {
            id: event.id ?? "",
            summary: event.summary ?? "(No title)",
            description: event.description ?? "",
            location: event.location ?? "",
            startDateTime: start,
            endDateTime: end,
            isAllDay,
            status: event.status ?? "confirmed",
            organizer: event.organizer?.displayName ?? "",
            organizerEmail: event.organizer?.email ?? "",
            creator: event.creator?.displayName ?? "",
            creatorEmail: event.creator?.email ?? "",
            attendees: (event.attendees ?? []).map((a: any) => ({
                email: a.email ?? "",
                displayName: a.displayName ?? "",
                responseStatus: a.responseStatus ?? "needsAction",
                self: a.self ?? false,
            })),
            hangoutLink: event.hangoutLink ?? "",
            htmlLink: event.htmlLink ?? "",
            recurrence: event.recurrence ?? [],
            colorId: event.colorId ?? "",
            visibility: event.visibility ?? "default",
            created: event.created ?? "",
            updated: event.updated ?? "",
        }
    }

    private getDefaultTimeRange(): { timeMin: string; timeMax: string } {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const timeMin = now.toISOString()

        const future = new Date(now)
        future.setDate(future.getDate() + 30)
        const timeMax = future.toISOString()

        return { timeMin, timeMax }
    }

    private computeStats(events: any[]): CalendarStats {
        const now = new Date()
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const weekEnd = new Date(todayStart)
        weekEnd.setDate(weekEnd.getDate() + 7)

        let todayCount = 0
        let thisWeekCount = 0
        let upcomingCount = 0

        for (const event of events) {
            const { start } = this.getEventDateTime(event)
            if (!start) continue

            const eventDate = new Date(start)

            if (eventDate >= todayStart && eventDate < todayEnd) todayCount++
            if (eventDate >= todayStart && eventDate < weekEnd) thisWeekCount++
            if (eventDate >= now) upcomingCount++
        }

        return {
            totalEvents: events.length,
            todayCount,
            thisWeekCount,
            upcomingCount,
        }
    }

    //================================ public methods ======================================

    public async listEvents(
        userId: string,
        timeMin?: string,
        timeMax?: string,
        maxResults: number = 50
    ): Promise<EventSummary[]> {
        try {
            const defaults = this.getDefaultTimeRange()
            const events = await this.fetchEvents(
                userId,
                timeMin ?? defaults.timeMin,
                timeMax ?? defaults.timeMax,
                maxResults
            )

            return events.map((e) => this.mapToEventSummary(e))
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async getEventById(userId: string, eventId: string): Promise<EventDetail> {
        try {
            const event = await this.fetchEventById(userId, eventId)
            return this.mapToEventDetail(event)
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async getDashboardStats(userId: string): Promise<CalendarStats> {
        try {
            const defaults = this.getDefaultTimeRange()
            const events = await this.fetchEvents(
                userId,
                defaults.timeMin,
                defaults.timeMax,
                250
            )
            return this.computeStats(events)
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async createEvent(
        userId: string,
        event: {
            summary: string;
            description?: string;
            location?: string;
            startDateTime: string;
            endDateTime: string;
            isAllDay?: boolean;
            attendees?: string[];
        }
    ): Promise<EventSummary> {
        try {
            const tenant = await getTenant(userId)

            const startObj = event.isAllDay
                ? { date: event.startDateTime.split("T")[0] }
                : { dateTime: event.startDateTime }

            const endObj = event.isAllDay
                ? { date: event.endDateTime.split("T")[0] }
                : { dateTime: event.endDateTime }

            const result = await tenant.googlecalendar.api.events.create({
                event: {
                    summary: event.summary,
                    description: event.description,
                    location: event.location,
                    start: startObj,
                    end: endObj,
                    attendees: event.attendees?.map((email) => ({ email })),
                },
            }) as any

            return this.mapToEventSummary(result)
        } catch (error) {
            throw new Error(
                `createEvent failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async updateEvent(
        userId: string,
        eventId: string,
        event: {
            summary?: string;
            description?: string;
            location?: string;
            startDateTime?: string;
            endDateTime?: string;
            isAllDay?: boolean;
        }
    ): Promise<EventSummary> {
        try {
            const tenant = await getTenant(userId)

            const updatePayload: any = {}
            if (event.summary !== undefined) updatePayload.summary = event.summary
            if (event.description !== undefined) updatePayload.description = event.description
            if (event.location !== undefined) updatePayload.location = event.location

            if (event.startDateTime) {
                updatePayload.start = event.isAllDay
                    ? { date: event.startDateTime.split("T")[0] }
                    : { dateTime: event.startDateTime }
            }
            if (event.endDateTime) {
                updatePayload.end = event.isAllDay
                    ? { date: event.endDateTime.split("T")[0] }
                    : { dateTime: event.endDateTime }
            }

            const result = await tenant.googlecalendar.api.events.update({
                id: eventId,
                event: updatePayload,
            }) as any

            return this.mapToEventSummary(result)
        } catch (error) {
            throw new Error(
                `updateEvent failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async deleteEvent(userId: string, eventId: string): Promise<{ success: boolean }> {
        try {
            const tenant = await getTenant(userId)
            await tenant.googlecalendar.api.events.delete({
                id: eventId,
            })
            return { success: true }
        } catch (error) {
            throw new Error(
                `deleteEvent failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async syncEvents(userId: string): Promise<{ success: boolean }> {
        try {
            const tenant = await getTenant(userId)
            // Trigger a fetch of upcoming events to cache them in the DB
            await tenant.googlecalendar.api.events.getMany({
                timeMin: new Date().toISOString(),
                timeMax: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                maxResults: 250,
                singleEvents: true,
            })
            return { success: true }
        } catch (error) {
            throw new Error(
                `syncEvents failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async searchEvents(
        userId: string,
        query: string,
        maxResults: number = 20
    ): Promise<EventSummary[]> {
        try {
            const tenant = await getTenant(userId)
            const defaults = this.getDefaultTimeRange()

            const listRes = await tenant.googlecalendar.api.events.getMany({
                q: query,
                timeMin: defaults.timeMin,
                timeMax: defaults.timeMax,
                maxResults,
                singleEvents: true,
                orderBy: "startTime",
            }) as any

            const events = listRes.items || []
            return events.map((e: any) => this.mapToEventSummary(e))
        } catch (error) {
            throw new Error(
                `searchEvents failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async getConnectionStatus(userId: string): Promise<ConnectionStatusResult> {
        try {
            const status = await this.getCalendarConnectionState(userId)
            if (status === "connected") return { connected: true }
            return { connected: false }
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    //end
}

export default CalendarService
