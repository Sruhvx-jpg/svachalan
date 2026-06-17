// ++++++++++++++++++++++++ CODE OF CONDUCT ++++++++++++++++++++++++++
//1. Use private function to wrap drizzle db select and  insert an also corsair
//2. use try catch block everywhere, in catch block throw a error mentioning which private function it originated
//3. imports should first start with pnpm package -> in house modules/packages -> current working directory files

//pnpm packages
import type { StreamTextResult } from "ai"
import * as crypto from "crypto";

//in house modules/packages
import { chat, streamChat, corsair, ensureCorsairSetup } from "@repo/corsair/src/corsair"
import { db, eq, desc, and, inArray } from "@repo/database";
import { chatSessions, chatMessages } from "@repo/database/schema";

interface PendingReview {
    action: "send" | "draft";
    to: string;
    subject: string;
    body: string;
    code: string;
}

const pendingReviews = new Map<string, PendingReview>();

class GmailDotAIService {
    //======================================== private methods ========================================

    private async saveMessage(
        sessionId: string,
        role: "user" | "ai",
        content: string | null,
        needsConfirmation = false,
        confirmationDetails: any = null
    ) {
        try {
            const id = crypto.randomUUID();
            await db.insert(chatMessages).values({
                id,
                sessionId,
                role,
                content,
                needsConfirmation,
                confirmationDetails,
                isConfirmed: false,
                isDeclined: false,
            });
            // Update session's updatedAt timestamp
            await db.update(chatSessions)
                .set({ updatedAt: new Date() })
                .where(eq(chatSessions.id, sessionId));
            return id;
        } catch (error) {
            throw new Error(`saveMessage failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private async updateLastPendingMessage(
        userId: string,
        updates: { isConfirmed?: boolean; isDeclined?: boolean; content?: string }
    ) {
        try {
            // Find all sessions for this user
            const sessions = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.userId, userId));
            if (sessions.length === 0) return;

            // Find the latest message that needs confirmation in these sessions
            const messages = await db.select()
                .from(chatMessages)
                .where(
                    and(
                        inArray(chatMessages.sessionId, sessions.map(s => s.id)),
                        eq(chatMessages.needsConfirmation, true),
                        eq(chatMessages.isConfirmed, false),
                        eq(chatMessages.isDeclined, false)
                    )
                )
                .orderBy(desc(chatMessages.createdAt))
                .limit(1);

            if (messages.length > 0) {
                const msg = messages[0];
                await db.update(chatMessages)
                    .set({
                        ...updates,
                    })
                    .where(eq(chatMessages.id, msg.id));
            }
        } catch (error) {
            throw new Error(`updateLastPendingMessage failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    //======================================== public methods ==========================================

    public async getSessions(userId: string) {
        try {
            return await db.select()
                .from(chatSessions)
                .where(eq(chatSessions.userId, userId))
                .orderBy(desc(chatSessions.updatedAt));
        } catch (error) {
            throw new Error(`getSessions failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async getMessages(sessionId: string) {
        try {
            return await db.select()
                .from(chatMessages)
                .where(eq(chatMessages.sessionId, sessionId))
                .orderBy(chatMessages.createdAt);
        } catch (error) {
            throw new Error(`getMessages failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async createSession(userId: string, title: string) {
        try {
            const id = crypto.randomUUID();
            const [session] = await db.insert(chatSessions).values({
                id,
                userId,
                title,
            }).returning();
            if (!session) {
                throw new Error("Failed to create session: database returned empty result");
            }
            return session;
        } catch (error) {
            throw new Error(`createSession failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


    public async deleteSession(sessionId: string) {
        try {
            await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));
            return { success: true };
        } catch (error) {
            throw new Error(`deleteSession failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Non-streaming chat — returns the final AI response text or a confirmation request.
     */
    public async chatWithAi(message: string, userId: string, sessionId?: string): Promise<any> {
        try {
            let activeSessionId = sessionId;

            // 1. Resolve or create activeSessionId
            if (!activeSessionId) {
                // Try to get the latest session, or create one
                const [latestSession] = await db.select()
                    .from(chatSessions)
                    .where(eq(chatSessions.userId, userId))
                    .orderBy(desc(chatSessions.updatedAt))
                    .limit(1);

                if (latestSession) {
                    activeSessionId = latestSession.id;
                } else {
                    const title = message.substring(0, 30) + (message.length > 30 ? "..." : "");
                    const session = await this.createSession(userId, title);
                    activeSessionId = session.id;
                }
            }

            const pending = pendingReviews.get(userId);
            if (pending) {
                const msg = message.toLowerCase().trim();
                // Check if user confirms via text message
                if (msg.match(/^(ok|yes|send|send it|send email|go ahead|approve|confirm|y)$/i) || msg.includes("send") || msg.includes("ok")) {
                    try {
                        await this.executeApprovedScript(pending.code, userId);
                        pendingReviews.delete(userId);

                        const responseText = pending.action === "send" ? "✓ Email sent successfully!" : "✓ Draft created successfully!";
                        
                        // Save user message and confirmation response to database
                        await this.saveMessage(activeSessionId, "user", message);
                        await this.saveMessage(activeSessionId, "ai", responseText);

                        return {
                            response: responseText,
                            isConfirmed: true,
                            sessionId: activeSessionId
                        };
                    } catch (err: any) {
                        return {
                            response: `Failed to execute: ${err.message}`,
                            sessionId: activeSessionId
                        };
                    }
                }

                // Check if user cancels/declines via text message
                if (msg.match(/^(no|cancel|discard|dont|dont send|n)$/i) || msg.includes("cancel") || msg.includes("discard")) {
                    pendingReviews.delete(userId);
                    const responseText = "✕ Intercepted action discarded.";

                    await this.saveMessage(activeSessionId, "user", message);
                    await this.saveMessage(activeSessionId, "ai", responseText);

                    // Update the last pending message status
                    await this.updateLastPendingMessage(userId, { isDeclined: true, content: responseText });

                    return {
                        response: responseText,
                        isDeclined: true,
                        sessionId: activeSessionId
                    };
                }
            }

            // Save user message to database
            await this.saveMessage(activeSessionId, "user", message);

            // 2. Fetch history and map to CoreMessage[] format
            const dbHistory = await this.getMessages(activeSessionId);
            const mappedHistory = dbHistory
                .filter(m => m.content && !m.needsConfirmation) // omit confirmation cards from LLM prompt
                .map(m => ({
                    role: m.role === "user" ? ("user" as const) : ("assistant" as const),
                    content: m.content || "",
                }));

            // 3. Otherwise let AI handle it. If we have a pending review, inject its context into the prompt
            if (pending) {
                const pendingContext = `[CONTEXT: There is currently a pending email draft under review:\n- To: ${pending.to}\n- Subject: ${pending.subject}\n- Body: ${pending.body}\n- Action: ${pending.action}\n\nIf the user is asking to modify this draft, update the script and call the run_script tool again. If they are confirming, call run_script to send it. If they are cancelling, acknowledge it.]`;
                
                // Add context as a system or developer instruction by injecting it into the last user message
                if (mappedHistory.length > 0) {
                    mappedHistory[mappedHistory.length - 1].content = pendingContext + "\n\n" + mappedHistory[mappedHistory.length - 1].content;
                }
            }

            const text = await chat(mappedHistory, userId);

            // Save AI message to database
            await this.saveMessage(activeSessionId, "ai", text);

            return {
                response: text,
                sessionId: activeSessionId
            };
        } catch (error) {
            const errMessage = error instanceof Error ? error.message : String(error);
            if (errMessage.includes("ConfirmationRequiredError:")) {
                const jsonStr = errMessage.substring(errMessage.indexOf("ConfirmationRequiredError:") + "ConfirmationRequiredError:".length).trim();
                try {
                    const parsed = JSON.parse(jsonStr);
                    pendingReviews.set(userId, {
                        action: parsed.action,
                        to: parsed.to,
                        subject: parsed.subject,
                        body: parsed.body,
                        code: parsed.code
                    });

                    // Save AI pending confirmation message to database
                    if (sessionId) {
                        await this.saveMessage(sessionId, "ai", null, true, parsed);
                    } else {
                        // find latest session
                        const [latestSession] = await db.select()
                            .from(chatSessions)
                            .where(eq(chatSessions.userId, userId))
                            .orderBy(desc(chatSessions.updatedAt))
                            .limit(1);
                        if (latestSession) {
                            await this.saveMessage(latestSession.id, "ai", null, true, parsed);
                        }
                    }

                    return {
                        needsConfirmation: true,
                        confirmationDetails: parsed,
                        sessionId: sessionId
                    };
                } catch {
                    // Ignore and let standard error throw
                }
            }
            throw new Error(
                `chatWithAi failed: ${errMessage}`
            );
        }
    }

    /**
     * Retrieves the current pending review for the user.
     */
    public getPendingReview(userId: string): PendingReview | null {
        return pendingReviews.get(userId) || null;
    }

    /**
     * Updates the pending draft details and regenerates the execution code snippet.
     */
    public updatePendingReview(userId: string, updates: Partial<PendingReview>): void {
        const existing = pendingReviews.get(userId);
        if (existing) {
            const updated = { ...existing, ...updates };
            const toStr = JSON.stringify(updated.to);
            const subjectStr = JSON.stringify(updated.subject);
            const bodyStr = JSON.stringify(updated.body);
            
            let newCode = "";
            if (updated.action === "send") {
                newCode = `const to = ${toStr};
const subject = ${subjectStr};
const body = ${bodyStr};
const mime = \`To: \${to}\\r\\nSubject: \${subject}\\r\\nContent-Type: text/plain; charset="UTF-8"\\r\\n\\r\\n\${body}\`;
const base64url = Buffer.from(mime).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
return await corsair.gmail.api.messages.send({ raw: base64url });`;
            } else {
                newCode = `const to = ${toStr};
const subject = ${subjectStr};
const body = ${bodyStr};
const mime = \`To: \${to}\\r\\nSubject: \${subject}\\r\\nContent-Type: text/plain; charset="UTF-8"\\r\\n\\r\\n\${body}\`;
const base64url = Buffer.from(mime).toString("base64").replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
return await corsair.gmail.api.drafts.create({ draft: { message: { raw: base64url } } });`;
            }
            updated.code = newCode;
            pendingReviews.set(userId, updated);
        }
    }

    /**
     * Clears the user's pending review.
     */
    public clearPendingReview(userId: string): void {
        pendingReviews.delete(userId);
    }

    public async executeApprovedScript(code: string | undefined, userId: string): Promise<string> {
        try {
            await ensureCorsairSetup();
            let codeToExecute = code;
            if (!codeToExecute) {
                const pending = pendingReviews.get(userId);
                if (!pending) {
                    throw new Error("No pending script found to execute.");
                }
                codeToExecute = pending.code;
            }
            pendingReviews.delete(userId);
            const tenant = corsair.withTenant(userId);
            const fn = new Function(
                "corsair",
                `return (async () => { ${codeToExecute} })()`
            );
            const result = await fn(tenant);

            // Update the last pending message status in database to confirmed
            const action = codeToExecute.includes("messages.send") ? "send" : "draft";
            const responseText = action === "send" ? "✓ Email sent successfully!" : "✓ Draft created successfully!";
            await this.updateLastPendingMessage(userId, { isConfirmed: true, content: responseText });

            return JSON.stringify(result ?? null, null, 2);
        } catch (error) {
            throw new Error(
                `executeApprovedScript failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    /**
     * Streaming chat — returns the streamText result for piping to SSE.
     */
    public streamChatWithAi(message: string, userId: string): StreamTextResult<any, any> {
        try {
            return streamChat(message, userId)
        } catch (error) {
            throw new Error(
                `streamChatWithAi failed: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
    //end
}

export default GmailDotAIService