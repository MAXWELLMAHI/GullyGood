"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  LoaderCircle,
  MessageCircleMore,
  Phone,
  SendHorizonal,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { sendChatMessageAction, getChatMessagesAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ChatEntry } from "@/lib/view-models";
import type { AppRole } from "@/lib/roles";
import type { Database } from "@/types/database";

type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];

type ListingChatPanelProps = {
  listingId: string;
  currentUserRole: Extract<AppRole, "donor" | "ngo">;
  participantName: string | null;
  participantPhone: string | null;
  shareableOwnPhone: string | null;
  canShareOwnPhone: boolean;
  chatEnabled: boolean;
  previewMode: boolean;
  initialMessages: ChatEntry[];
};

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

function sanitizePhoneNumber(phone: string | null | undefined) {
  return (phone ?? "").replace(/[^\d+]/g, "");
}

function mapChatMessageRow(
  row: ChatMessageRow,
  currentUserRole: Extract<AppRole, "donor" | "ngo">,
  participantName: string | null,
): ChatEntry {
  return {
    id: row.id,
    senderRole: row.sender_role as Extract<AppRole, "donor" | "ngo">,
    senderName:
      row.sender_role === "donor"
        ? participantName && currentUserRole === "ngo"
          ? participantName
          : "Donor"
        : participantName && currentUserRole === "donor"
          ? participantName
          : "NGO team",
    message: row.message,
    sharedPhone: row.shared_phone,
    createdAt: row.created_at,
  };
}

export function ListingChatPanel({
  listingId,
  currentUserRole,
  participantName,
  participantPhone,
  shareableOwnPhone,
  canShareOwnPhone,
  chatEnabled,
  previewMode,
  initialMessages,
}: ListingChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [includePhone, setIncludePhone] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewMode || !chatEnabled) {
      return;
    }

    try {
      const client = getSupabaseBrowserClient();
      if (!client) {
        return;
      }

      const channel = client
        .channel(`listing-chat:${listingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `listing_id=eq.${listingId}`,
          },
          (payload) => {
            const nextMessage = mapChatMessageRow(
              payload.new as ChatMessageRow,
              currentUserRole,
              participantName,
            );

            setMessages((current) => {
              if (current.some((message) => message.id === nextMessage.id)) {
                return current;
              }

              return [...current, nextMessage].sort(
                (left, right) =>
                  new Date(left.createdAt).getTime() -
                  new Date(right.createdAt).getTime(),
              );
            });
          },
        )
        .subscribe();

      return () => {
        try {
          void client.removeChannel(channel);
        } catch {
          // ignore
        }
      };
    } catch {
      // Supabase realtime channel error; safe fallback
    }
  }, [chatEnabled, currentUserRole, listingId, participantName, previewMode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = draft.trim();
    if (!message || previewMode || !chatEnabled) {
      return;
    }

    setIsSending(true);
    setError(null);

    const optimisticId = `opt-${Date.now()}`;
    const ownSharedPhone =
      includePhone && canShareOwnPhone ? shareableOwnPhone?.trim() || null : null;
    const optimisticMessage: ChatEntry = {
      id: optimisticId,
      senderRole: currentUserRole,
      senderName:
        currentUserRole === "donor" ? "You (Donor)" : "You (NGO Team)",
      message,
      sharedPhone: ownSharedPhone,
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft("");
    setIncludePhone(false);

    try {
      await sendChatMessageAction({
        listingId,
        message,
        sharedPhone: ownSharedPhone,
        senderRole: currentUserRole,
        senderName:
          currentUserRole === "donor" ? "Donor" : "NGO Coordinator",
      });

      if (listingId.startsWith("mock-")) {
        window.setTimeout(() => {
          const autoReplyRole = currentUserRole === "donor" ? "ngo" : "donor";
          const autoReplyName =
            participantName ||
            (autoReplyRole === "donor" ? "Asha Mehta" : "Sahaara Community Trust");
          const autoReplyText =
            currentUserRole === "donor"
              ? "Got it! Our volunteer team is en route during your pickup window. Thank you so much!"
              : "Thank you for the update! The items are packed and ready at the gate.";

          const replyEntry: ChatEntry = {
            id: `reply-${Date.now()}`,
            senderRole: autoReplyRole,
            senderName: autoReplyName,
            message: autoReplyText,
            sharedPhone: participantPhone || null,
            createdAt: new Date().toISOString(),
          };

          setMessages((current) => {
            if (current.some((m) => m.id === replyEntry.id)) return current;
            return [...current, replyEntry];
          });
        }, 1800);
      }
    } catch (err) {
      console.warn("Chat notice:", err);
    } finally {
      setIsSending(false);
    }
  }

  const contactNumber = sanitizePhoneNumber(participantPhone);
  const whatsappHref = contactNumber
    ? `https://wa.me/${contactNumber.replace(/^\+/, "")}`
    : null;

  return (
    <Card className="overflow-hidden p-0 border border-[#E5E7EB]">
      {/* Header */}
      <div className="border-b border-[#E5E7EB] bg-gradient-to-r from-[#14251C] to-[#1C3A2D] p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22C55E] text-white shadow-sm">
              <MessageCircleMore className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-white">
                  {chatEnabled ? "Pickup Coordination Chat" : "Chat unlocks after Claim"}
                </h3>
              </div>
              <p className="text-[11px] text-white/75">
                {chatEnabled ? `Connecting with ${participantName ?? "matched NGO"}` : "Address & chat open when locked"}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-[#22C55E] backdrop-blur-xs">
            <Sparkles className="h-3 w-3" />
            Live
          </span>
        </div>

        {/* Quick Contact buttons if phone shared */}
        {chatEnabled && participantPhone ? (
          <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <a
              href={`tel:${contactNumber}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/25"
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E] px-3 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#17A34A]"
              >
                WhatsApp
              </a>
            )}
            <span className="ml-auto text-[11px] text-white/60">
              {participantPhone}
            </span>
          </div>
        ) : null}
      </div>

      {/* Messages Thread */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="max-h-[340px] space-y-3 overflow-y-auto pr-1">
          {messages.length > 0 ? (
            messages.map((msg) => {
              const isOwn = msg.senderRole === currentUserRole;
              return (
                <div
                  key={msg.id}
                  className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-bold text-[#6B7280]">
                    <span>{isOwn ? "You" : msg.senderName}</span>
                    <span>·</span>
                    <span>{timeFormatter.format(new Date(msg.createdAt))}</span>
                  </div>

                  <div
                    className={cn(
                      "max-w-[85%] rounded-[20px] px-4 py-2.5 text-sm shadow-xs",
                      isOwn
                        ? "rounded-tr-xs bg-[#22C55E] text-white font-medium"
                        : "rounded-tl-xs border border-[#E5E7EB] bg-[#FCFCFA] text-[#111111]"
                    )}
                  >
                    <p className="leading-relaxed">{msg.message}</p>
                    {msg.sharedPhone && (
                      <div className={cn(
                        "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        isOwn ? "bg-white/20 text-white" : "bg-[#FFFBEB] text-[#8A6300]"
                      )}>
                        <ShieldCheck className="h-3 w-3" />
                        Phone: {msg.sharedPhone}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-[#E5E7EB] bg-[#FCFCFA] p-6 text-center text-xs text-[#9CA3AF]">
              {chatEnabled
                ? "No messages yet. Send a note about gate access or pickup timing."
                : "Chat will activate as soon as an NGO locks this donation."}
            </div>
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-[#E5E7EB]">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!chatEnabled || isSending}
            placeholder={chatEnabled ? "Type pickup coordination notes..." : "Chat unlocked upon claim."}
            className="min-h-18"
          />

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            {canShareOwnPhone && chatEnabled ? (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#6B7280] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhone}
                  onChange={(e) => setIncludePhone(e.target.checked)}
                  className="rounded border-[#E5E7EB] text-[#22C55E] focus:ring-[#22C55E]"
                />
                <span>Share my phone number</span>
              </label>
            ) : <span />}

            <Button
              type="submit"
              disabled={!chatEnabled || isSending || !draft.trim()}
              className="font-display"
            >
              {isSending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send</span>
                  <SendHorizonal className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}

