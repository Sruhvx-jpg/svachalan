// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

//pnpm packges
import { generateOAuthUrl } from "corsair/oauth"
import type { TypedEntity } from "corsair/orm"
import type { GmailSchema } from "@corsair-dev/gmail"

//in house modules/packages
import { corsair, ensureCorsairSetup, getTenant } from "@repo/corsair"
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
            const tenant = getTenant(userId)
            return await tenant.gmail.db.messages.search({ limit, offset })
        } catch (error) {
            throw new Error(
                `fetchMessages failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async fetchAllMails(userId: string): Promise<EmailMessage[]> {
        try {
            const tenant = getTenant(userId)
            return await tenant.gmail.db.messages.search({ limit: 500 })
        } catch (error) {
            throw new Error(
                `fetchMessages failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async getGmailConnectionState(userId: string): Promise<GmailConnectionState> {
        try {
            await ensureCorsairSetup()
            const status = await corsair.manage.connectionStatus.get({ tenantId: userId })
            return status.gmail as GmailConnectionState
        } catch (error) {
            throw new Error(
                `getGmailConnectionState failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private async generateConnectUrl(userId: string): Promise<ConnectEmailResult> {
        try {
            await ensureCorsairSetup()
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
            const tenant = getTenant(userId)
            await tenant.gmail.api.messages.list({ maxResults: 100 })
        } catch (error) {
            throw new Error(
                `triggerGmailSync failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    private mapToEmailSummary(msg: EmailMessage): EmailSummary {
        const labels = msg.data?.labelIds ?? []

        return {
            id: msg.entity_id,
            subject: msg.data?.subject ?? "(no subject)",
            from: msg.data?.from ?? "",
            date: msg.data?.internalDate ?? msg.created_at.toISOString(),
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

        for (const msg of mails) {
            const labels = msg.data?.labelIds ?? []

            if (labels.includes("UNREAD")) unreadCount++
            if (labels.includes("SPAM")) spamCount++

            const dateStr = msg.data?.internalDate

            if (dateStr && new Date(dateStr) >= today) todayCount++
        }

        return { totalEmails: mails.length, unreadCount, spamCount, todayCount }
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



    //end
}

export default EmailService
