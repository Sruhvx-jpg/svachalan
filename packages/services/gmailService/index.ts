// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

//pnpm packges
import { generateOAuthUrl } from "corsair/oauth"
import type { TypedEntity } from "corsair/orm"
import type { GmailSchema } from "@corsair-dev/gmail"

//in house modules/packages
import { corsair, getTenant } from "@repo/corsair"
import { listEmailsInputModel, listEmailsInputModelType } from "./model"

//current working directory files

type GmailMessageSchema = (typeof GmailSchema)["entities"]["messages"]
type EmailMessage = TypedEntity<GmailMessageSchema>
type GmailConnectionState = "connected" | "not_connected" | "missing_credentials"

export interface DashboardStats {
    totalEmails: number;
    unreadCount: number;
    spamCount: number;
    todayCount: number;
    monthlyStats: Array<{ label: string; count: number }>;
}

export interface EmailSummary {
    id: string;
    subject: string;
    from: string;
    date: string;
    snippet: string;
    isRead: boolean;
    isSpam: boolean;
}

export interface EmailDetail {
    id: string;
    subject: string;
    from: string;
    to: string;
    date: string;
    snippet: string;
    body: string;
    isRead: boolean;
    isSpam: boolean;
}

export interface ConnectEmailResult {
    url: string;
    state: string;
}

export interface ConnectionStatusResult {
    connected: boolean;
    signInUrl?: string;
}

class EmailService {
    //================================= private methodds ====================================
    private async fetchMails(userId: string, limit: number, offset: number): Promise<EmailMessage[]> {
        try {
            const tenant = await getTenant(userId)

            const dbMsgs = await tenant.gmail.db.messages.list({ limit: 100 })

            const liveMsgs = await Promise.all(
                dbMsgs.map(async (msg) => {
                    try {
                        const liveData = await tenant.gmail.api.messages.get({ id: msg.entity_id });
                        return { ...msg, data: liveData } as EmailMessage;
                    } catch (err) {
                        return msg;
                    }
                })
            );

            liveMsgs.sort((a, b) => {
                const dateA = a.data?.internalDate ? Number(a.data.internalDate) : a.created_at.getTime();
                const dateB = b.data?.internalDate ? Number(b.data.internalDate) : b.created_at.getTime();
                return dateB - dateA;
            });

            return liveMsgs.slice(offset, offset + limit);
        } catch (error) {
            throw new Error(
                `fetchMessages failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async fetchAllMails(userId: string): Promise<EmailMessage[]> {
        try {
            const tenant = await getTenant(userId)
            const dbMsgs = await tenant.gmail.db.messages.list({ limit: 100 })

            const liveMsgs = await Promise.all(
                dbMsgs.map(async (msg) => {
                    try {
                        const liveData = await tenant.gmail.api.messages.get({ id: msg.entity_id });
                        return { ...msg, data: liveData } as EmailMessage;
                    } catch (err) {
                        return msg;
                    }
                })
            );
            return liveMsgs;
        } catch (error) {
            throw new Error(
                `fetchMessages failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async getGmailConnectionState(userId: string): Promise<GmailConnectionState> {
        try {
            const status = await corsair.manage.connectionStatus.get({ tenantId: userId })
            return await status.gmail as GmailConnectionState
        } catch (error) {
            throw new Error(
                `getGmailConnectionState failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async generateConnectUrl(userId: string): Promise<ConnectEmailResult> {
        try {
            const redirectUri = `${process.env.API_BASE_URL ?? "http://localhost:4000"}/trpc/email.oauthCallback`
            return await generateOAuthUrl(corsair, "gmail", { tenantId: userId, redirectUri })
        } catch (error) {
            throw new Error(
                `generateConnectUrl failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async triggerGmailSync(userId: string): Promise<void> {
        try {
            const tenant = await getTenant(userId)
            const listRes = await tenant.gmail.api.messages.list({ maxResults: 100 }) as any;
            const messages = listRes.messages || [];

            await Promise.all(
                messages.map((msg: any) =>
                    msg.id ? tenant.gmail.api.messages.get({ id: msg.id }) : Promise.resolve()
                )
            );
        } catch (error) {
            throw new Error(
                `triggerGmailSync failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private mapToEmailSummary(msg: EmailMessage): EmailSummary {

        const labels = msg.data?.labelIds ?? [];
        const headers = msg.data?.payload?.headers ?? [];

        const getHeader = (name: string) =>
            headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

        return {
            id: msg.entity_id,
            subject: getHeader("subject") ?? "(no subject)",
            from: getHeader("from") ?? "",
            date: msg.data?.internalDate ? new Date(Number(msg.data.internalDate)).toISOString() : msg.created_at.toISOString(),
            snippet: msg.data?.snippet ?? "",
            isRead: !labels.includes("UNREAD"),
            isSpam: labels.includes("SPAM"),
        }
    }

    private computeStats(mails: EmailMessage[]): DashboardStats {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        let unreadCount = 0
        let spamCount = 0
        let todayCount = 0

        const monthlyStats: Array<{ label: string; count: number }> = [];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthMap = new Map<string, number>();

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthMap.set(key, monthlyStats.length);
            monthlyStats.push({ label, count: 0 });
        }

        for (const msg of mails) {
            const labels = msg.data?.labelIds ?? []

            if (labels.includes("UNREAD")) unreadCount++
            if (labels.includes("SPAM")) spamCount++

            const dateStr = msg.data?.internalDate

            if (dateStr && new Date(Number(dateStr)) >= today) todayCount++

            if (dateStr) {
                const mailDate = new Date(Number(dateStr));
                const key = `${mailDate.getFullYear()}-${mailDate.getMonth()}`;
                if (monthMap.has(key)) {
                    const idx = monthMap.get(key)!;
                    monthlyStats[idx].count++;
                }
            } else {
                const key = `${msg.created_at.getFullYear()}-${msg.created_at.getMonth()}`;
                if (monthMap.has(key)) {
                    const idx = monthMap.get(key)!;
                    monthlyStats[idx].count++;
                }
            }
        }

        return {
            totalEmails: mails.length,
            unreadCount,
            spamCount,
            todayCount,
            monthlyStats,
        }
    }
    //================================ public methods ======================================
    public async connectEmail(userId: string): Promise<ConnectEmailResult> {
        try {
            return await this.generateConnectUrl(userId)
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async listEmails(payload: listEmailsInputModelType): Promise<EmailSummary[]> {
        try {
            const { userId, limit, offset } = await listEmailsInputModel.parseAsync(payload)

            const mails = await this.fetchMails(userId, limit, offset)

            return mails.map((msg) => this.mapToEmailSummary(msg))
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async getDashboardStats(userId: string): Promise<DashboardStats> {
        try {
            const mails = await this.fetchAllMails(userId)

            return this.computeStats(mails)
        } catch (error) {
            throw new Error(`${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    public async SyncEmails(userId: string): Promise<{ success: boolean }> {
        try {
            await this.triggerGmailSync(userId)
            return { success: true }
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    public async GetConnectionStatus(userId: string): Promise<ConnectionStatusResult> {
        try {
            const status = await this.getGmailConnectionState(userId)

            if (status === "connected") return { connected: true }

            const { url } = await this.generateConnectUrl(userId)
            return { connected: false, signInUrl: url }
        } catch (error) {
            throw new Error(
                `${error instanceof Error ? error.message : String(error)}`
            );
        }
    }



    public async getEmailById(userId: string, emailId: string): Promise<EmailDetail> {
        try {
            const tenant = await getTenant(userId)
            const liveData = await tenant.gmail.api.messages.get({ id: emailId }) as any

            const headers = liveData?.payload?.headers ?? []
            const getHeader = (name: string) =>
                headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value

            const body = this.extractBody(liveData?.payload)

            const labelIds = liveData?.labelIds ?? []
            const isRead = !labelIds.includes("UNREAD")

            if (!isRead) {
                try {
                    await tenant.gmail.api.messages.modify({
                        id: emailId,
                        removeLabelIds: ["UNREAD"],
                    })
                } catch (modifyError) {
                    console.error("Failed to mark email as read:", modifyError)
                }
            }

            return {
                id: emailId,
                subject: getHeader("subject") ?? "(no subject)",
                from: getHeader("from") ?? "",
                to: getHeader("to") ?? "",
                date: liveData?.internalDate
                    ? new Date(Number(liveData.internalDate)).toISOString()
                    : new Date().toISOString(),
                snippet: liveData?.snippet ?? "",
                body,
                isRead: true,
                isSpam: labelIds.includes("SPAM"),
            }
        } catch (error) {
            throw new Error(
                `getEmailById failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private extractBody(payload: any): string {
        if (!payload) return ""

        // Direct body on the payload
        if (payload.body?.data) {
            return this.decodeBase64(payload.body.data)
        }

        // Recursively search through parts – prefer text/html, fall back to text/plain
        if (payload.parts && Array.isArray(payload.parts)) {
            let htmlBody = ""
            let textBody = ""

            for (const part of payload.parts) {
                if (part.mimeType === "text/html" && part.body?.data) {
                    htmlBody = this.decodeBase64(part.body.data)
                } else if (part.mimeType === "text/plain" && part.body?.data) {
                    textBody = this.decodeBase64(part.body.data)
                } else if (part.parts) {
                    // Nested multipart
                    const nested = this.extractBody(part)
                    if (nested) htmlBody = htmlBody || nested
                }
            }

            return htmlBody || textBody
        }

        return ""
    }

    private decodeBase64(data: string): string {
        try {
            // Gmail uses URL-safe base64
            const normalized = data.replace(/-/g, "+").replace(/_/g, "/")
            return Buffer.from(normalized, "base64").toString("utf-8")
        } catch {
            return data
        }
    }

    public async searchEmails(userId: string, query: string, maxResults: number = 20): Promise<EmailSummary[]> {
        try {
            const tenant = await getTenant(userId)

            // Use the Gmail API's `q` parameter for search (supports Gmail search syntax)
            const listRes = await tenant.gmail.api.messages.list({ q: query, maxResults }) as any
            const messages = listRes.messages || []

            // Hydrate each result with full message data
            const hydrated: EmailMessage[] = await Promise.all(
                messages.map(async (msg: any) => {
                    if (!msg.id) return null
                    try {
                        const liveData = await tenant.gmail.api.messages.get({ id: msg.id })
                        return {
                            entity_id: msg.id,
                            data: liveData,
                            created_at: new Date(),
                        } as unknown as EmailMessage
                    } catch {
                        return null
                    }
                })
            )

            return hydrated
                .filter((msg): msg is EmailMessage => msg !== null)
                .sort((a, b) => {
                    const dateA = a.data?.internalDate ? Number(a.data.internalDate) : a.created_at.getTime();
                    const dateB = b.data?.internalDate ? Number(b.data.internalDate) : b.created_at.getTime();
                    return dateB - dateA;
                })
                .map((msg) => this.mapToEmailSummary(msg))
        } catch (error) {
            throw new Error(
                `searchEmails failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    //end
}

export default EmailService
