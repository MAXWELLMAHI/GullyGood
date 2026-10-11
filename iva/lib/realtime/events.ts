import { EventEmitter } from "events";

export type DonationClaimEvent = {
  type: "DONATION_CLAIMED" | "DONATION_AVAILABLE" | "CLAIM_EXPIRED";
  donationId: string;
  ngoId?: string;
  claimedAt?: string;
  expiresAt?: string;
  timestamp: string;
};

type EventListener = (event: DonationClaimEvent) => void;

class RealtimeDonationManager {
  private static instance: RealtimeDonationManager;
  private emitter: EventEmitter;
  private recentEvents: DonationClaimEvent[] = [];
  private maxHistory = 50;

  private constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  public static getInstance(): RealtimeDonationManager {
    if (!RealtimeDonationManager.instance) {
      RealtimeDonationManager.instance = new RealtimeDonationManager();
    }
    return RealtimeDonationManager.instance;
  }

  public broadcast(event: Omit<DonationClaimEvent, "timestamp">): DonationClaimEvent {
    const fullEvent: DonationClaimEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Store in recent buffer
    this.recentEvents.unshift(fullEvent);
    if (this.recentEvents.length > this.maxHistory) {
      this.recentEvents.pop();
    }

    // Emit in process
    this.emitter.emit("donation_event", fullEvent);
    this.emitter.emit(`donation:${fullEvent.donationId}`, fullEvent);

    return fullEvent;
  }

  public subscribe(listener: EventListener): () => void {
    this.emitter.on("donation_event", listener);
    return () => {
      this.emitter.off("donation_event", listener);
    };
  }

  public subscribeToDonation(donationId: string, listener: EventListener): () => void {
    const eventName = `donation:${donationId}`;
    this.emitter.on(eventName, listener);
    return () => {
      this.emitter.off(eventName, listener);
    };
  }

  public getRecentEvents(): DonationClaimEvent[] {
    return [...this.recentEvents];
  }
}

export const realtimeDonations = RealtimeDonationManager.getInstance();
