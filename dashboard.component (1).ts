/**
 * dashboard.component.ts
 *
 * This file contains Angular components for a dashboard displaying account information
 * and rule statistics. It includes a dropdown for account selection, an account header,
 * and a rules log with visual statistics.
 */

import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  ElementRef,
  OnChanges,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

/* ── Models ──────────────────────────────────────────────── */

/**
 * Represents an account in the system with various attributes for identification and categorization.
 */
export interface Account {
  id: string; // Unique identifier for the account
  name: string; // Display name of the account
  correlationId: string; // Correlation ID for tracking
  assetClass: string; // Type of asset class (e.g., equity, fixed income)
  accountType: string; // Type of account
  platform: string; // Platform where the account exists
  entity: string; // Entity owning the account
  reconciliationPlatform: string; // Platform used for reconciliation
}

/**
 * Statistics for rules associated with an account, showing counts at different stages.
 */
export interface RuleStats {
  total: number; // Total number of rules
  generated: number; // Number of generated rules
  testing: number; // Number of rules in testing phase
  outdated: number; // Number of outdated rules
  submitted: number; // Number of submitted rules
  approved: number | null; // Number of approved rules (null if not applicable)
  rejected: number | null; // Number of rejected rules (null if not applicable)
  inProduction: number | null; // Number of rules in production (null if not applicable)
  productionRules: number | null; // Number of production rules (null if not applicable)
}

/**
 * AccountDropdownComponent - A searchable dropdown for selecting accounts.
 * Displays account ID and name, allows filtering by search input.
 * Emits the selected account when changed.
 */
@Component({
  selector: "app-account-dropdown",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .dd-wrapper {
        position: relative;
        display: inline-block;
      }
      .dd-trigger {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: none;
        border: none;
        border-radius: 4px;
        padding: 2px 5px;
        cursor: pointer;
        font-family: inherit;
      }
      .dd-trigger:hover {
        background: #f8fafc;
      }
      .dd-id {
        font-size: 12px;
        font-weight: 700;
        color: #6366f1;
        font-family: monospace;
      }
      .dd-name {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dd-chevron {
        font-size: 9px;
        color: #94a3b8;
        margin-left: 1px;
      }
      .dd-panel {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        z-index: 999;
        background: #fff;
        border: 1.5px solid #e2e8f0;
        border-radius: 10px;
        box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);
        width: 340px;
        animation: fadeDown 0.15s ease;
      }
      @keyframes fadeDown {
        from {
          opacity: 0;
          transform: translateY(-5px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .dd-search {
        display: flex;
        align-items: center;
        gap: 7px;
        padding: 9px 12px;
        border-bottom: 1px solid #f1f5f9;
        background: #fafafa;
        border-radius: 10px 10px 0 0;
      }
      .dd-search-icon {
        font-size: 13px;
        color: #94a3b8;
      }
      .dd-search input {
        border: none;
        outline: none;
        font-size: 13px;
        color: #1e293b;
        flex: 1;
        background: none;
        font-family: inherit;
      }
      .dd-clear {
        border: none;
        background: none;
        cursor: pointer;
        font-size: 12px;
        color: #94a3b8;
        padding: 0;
      }
      .dd-list {
        max-height: 200px;
        overflow-y: auto;
      }
      .dd-empty {
        padding: 16px;
        font-size: 13px;
        color: #94a3b8;
        text-align: center;
      }
      .dd-item {
        padding: 10px 14px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: #fff;
        border-left: 3px solid transparent;
        border-bottom: 1px solid #f8fafc;
        transition: background 0.1s;
      }
      .dd-item:hover {
        background: #f8fafc;
      }
      .dd-item.active {
        background: #eef2ff;
        border-left-color: #6366f1;
      }
      .dd-item-id {
        font-size: 12px;
        font-weight: 700;
        color: #6366f1;
        font-family: monospace;
      }
      .dd-item-name {
        font-size: 11px;
        color: #64748b;
      }
    `,
  ],
  template: `
    <div class="dd-wrapper">
      <button class="dd-trigger" (click)="toggle()">
        <span class="dd-id">{{ current.id }}</span>
        <span class="dd-name">{{ current.name }}</span>
        <span class="dd-chevron">▾</span>
      </button>
      <div class="dd-panel" *ngIf="open">
        <div class="dd-search">
          <span class="dd-search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search accounts…"
            [(ngModel)]="query"
            autofocus
          />
          <button class="dd-clear" *ngIf="query" (click)="query = ''">✕</button>
        </div>
        <div class="dd-list">
          <div class="dd-empty" *ngIf="filtered.length === 0">
            No accounts found
          </div>
          <div
            class="dd-item"
            *ngFor="let a of filtered"
            [class.active]="a.id === current.id"
            (click)="select(a)"
          >
            <span class="dd-item-id">{{ a.id }}</span>
            <span class="dd-item-name">{{ a.name }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AccountDropdownComponent {
  @Input() accounts: Account[] = []; // List of available accounts to choose from
  @Input() current!: Account; // Currently selected account
  @Output() accountSelected = new EventEmitter<Account>(); // Emits when a new account is selected

  open = false; // Whether the dropdown panel is open
  query = ""; // Current search query for filtering accounts

  constructor(private el: ElementRef) {}

  /**
   * Closes the dropdown when clicking outside the component.
   */
  @HostListener("document:mousedown", ["$event"])
  onOutsideClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) this.open = false;
  }

  /**
   * Returns the list of accounts filtered by the search query.
   */
  get filtered(): Account[] {
    const q = this.query.toLowerCase();
    return this.accounts.filter(
      (a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q),
    );
  }

  /**
   * Toggles the dropdown open/closed state and clears the search query.
   */
  toggle() {
    this.open = !this.open;
    this.query = "";
  }

  /**
   * Selects an account, emits it, and closes the dropdown.
   */
  select(account: Account) {
    this.accountSelected.emit(account);
    this.open = false;
    this.query = "";
  }
}

/**
 * AccountHeaderComponent - Displays header information for the selected account.
 * Shows account name, status badge, and key account attributes in a structured layout.
 */
@Component({
  selector: "app-account-header",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .header {
        background: #fff;
        border-bottom: 1px solid #f1f5f9;
        padding: 20px 28px 18px;
      }
      .title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .account-name {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
        margin: 0;
      }
      .badge {
        font-size: 12px;
        font-weight: 500;
        padding: 3px 12px;
        border-radius: 99px;
        background: #f1f5f9;
        color: #64748b;
        border: 1px solid #e2e8f0;
      }
      .fields-row {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        row-gap: 5px;
      }
      .field {
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
        white-space: nowrap;
      }
      .field-label {
        font-size: 12px;
        color: #94a3b8;
        font-weight: 400;
      }
      .field-value {
        font-size: 13px;
        color: #0f172a;
        font-weight: 700;
        font-family: monospace;
        margin-left: 2px;
      }
      .dot {
        color: #e2e8f0;
        margin: 0 10px;
        font-size: 14px;
      }
    `,
  ],
  template: `
    <div class="header" #headerEl>
      <div class="title-row">
        <h1 class="account-name">{{ account.name }}</h1>
        <span class="badge">Active</span>
      </div>
      <div class="fields-row">
        <ng-container *ngFor="let f of fields; let last = last">
          <span class="field">
            <span class="field-label">{{ f.label }}:</span>
            <span class="field-value">{{ f.value }}</span>
          </span>
          <span class="dot" *ngIf="!last">·</span>
        </ng-container>
      </div>
    </div>
  `,
})
export class AccountHeaderComponent implements OnChanges, AfterViewInit {
  @Input() account!: Account; // The account whose information to display
  @ViewChild("headerEl") headerEl!: ElementRef; // Reference to the header element

  fields: { label: string; value: string }[] = []; // Array of field labels and values to display

  constructor(private zone: NgZone) {}

  /**
   * Updates the fields array when the account input changes.
   */
  ngOnChanges(changes: SimpleChanges) {
    this.fields = [
      { label: "ID", value: this.account.correlationId },
      { label: "Class", value: this.account.assetClass },
      { label: "Type", value: this.account.accountType },
      { label: "Platform", value: this.account.reconciliationPlatform },
      { label: "Entity", value: this.account.entity },
    ];
    // Skip first change — AfterViewInit handles that
  }

  ngAfterViewInit() {}
}

/**
 * RulesLogComponent - Displays rule statistics with a visual bar chart and legend.
 * Shows the distribution of rules across different stages (generated, testing, etc.)
 * and includes approved/rejected counts in a pill format.
 */
@Component({
  selector: "app-rules-log",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .card {
        background: #fff;
        border: 1px solid #f1f5f9;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      }
      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .title {
        font-size: 15px;
        font-weight: 700;
        color: #0f172a;
      }
      .total-badge {
        font-size: 12px;
        font-weight: 600;
        color: #94a3b8;
        background: #f8fafc;
        padding: 2px 9px;
        border-radius: 99px;
        border: 1px solid #f1f5f9;
      }
      .view-all {
        font-size: 12px;
        color: #6366f1;
        font-weight: 600;
        cursor: pointer;
      }

      .bar-row {
        display: flex;
        height: 12px;
        border-radius: 6px;
        overflow: hidden;
        gap: 2px;
        margin-bottom: 4px;
      }
      .seg {
        min-width: 0;
        transform-origin: left center;
      }
      .seg-generated {
        background: #6366f1;
      }
      .seg-testing {
        background: #f59e0b;
      }
      .seg-submitted {
        background: #8b5cf6;
      }
      .seg-outdated {
        background: #ef4444;
      }
      .reviewed-wrapper {
        display: flex;
        min-width: 20px;
        overflow: hidden;
        transform-origin: left center;
      }
      .reviewed-half {
        flex: 1;
      }
      .approved-solid {
        background: #10b981;
        border-right: 1.5px solid rgba(255, 255, 255, 0.6);
      }
      .rejected-solid {
        background: #ef4444;
      }
      .approved-hatched {
        background: repeating-linear-gradient(
          45deg,
          #d1fae5,
          #d1fae5 3px,
          #a7f3d0 3px,
          #a7f3d0 6px
        );
        border-right: 1.5px solid rgba(255, 255, 255, 0.6);
      }
      .rejected-hatched {
        background: repeating-linear-gradient(
          45deg,
          #fee2e2,
          #fee2e2 3px,
          #fca5a5 3px,
          #fca5a5 6px
        );
      }

      .bracket-row {
        display: flex;
        margin-bottom: 16px;
      }
      .bracket-spacer {
        min-width: 0;
      }
      .bracket {
        min-width: 20px;
        border-left: 1px solid #cbd5e1;
        border-right: 1px solid #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
        height: 5px;
        border-radius: 0 0 3px 3px;
        position: relative;
        display: flex;
        justify-content: center;
      }
      .bracket-label {
        font-size: 8px;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.08em;
        position: absolute;
        bottom: -9px;
        background: #fff;
        padding: 0 3px;
        white-space: nowrap;
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 14px;
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      .legend-item.dim {
        opacity: 0.4;
      }
      .legend-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        flex-shrink: 0;
      }
      .legend-label {
        font-size: 12px;
        color: #64748b;
      }
      .legend-value {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
      }
      .legend-pct {
        font-size: 11px;
        color: #94a3b8;
      }

      .pill {
        display: flex;
        align-items: center;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 6px;
        overflow: hidden;
      }
      .pill-half {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 4px 10px;
      }
      .pill-divider {
        width: 1px;
        height: 20px;
        background: #f1f5f9;
      }
      .pill-dot {
        width: 8px;
        height: 8px;
        border-radius: 2px;
      }
      .pill-dot.approved {
        background: #10b981;
      }
      .pill-dot.rejected {
        background: #ef4444;
      }
      .pill-label {
        font-size: 12px;
        font-weight: 600;
      }
      .pill-label.approved {
        color: #10b981;
      }
      .pill-label.rejected {
        color: #ef4444;
      }
      .pill-value {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
      }
    `,
  ],
  template: `
    <div class="card">
      <div class="card-header">
        <div class="header-left">
          <span class="title">Rules Log</span>
          <span class="total-badge">{{ stats.total }} total</span>
        </div>
        <span class="view-all">View all →</span>
      </div>

      <div class="bar-row" #barRow>
        <div class="seg seg-generated" [style.flex]="stats.generated"></div>
        <div class="seg seg-testing" [style.flex]="stats.testing"></div>
        <div
          class="seg seg-submitted"
          [style.flex]="stats.submitted"
          *ngIf="stats.submitted > 0"
        ></div>
        <div class="reviewed-wrapper" [style.flex]="reviewedFlex">
          <div
            class="reviewed-half"
            [ngClass]="approvedHatched ? 'approved-hatched' : 'approved-solid'"
            [style.flex]="approvedFlex"
          ></div>
          <div
            class="reviewed-half"
            [ngClass]="rejectedHatched ? 'rejected-hatched' : 'rejected-solid'"
            [style.flex]="rejectedFlex"
          ></div>
        </div>
        <div class="seg seg-outdated" [style.flex]="stats.outdated"></div>
      </div>

      <div class="bracket-row" #bracketRow>
        <div class="bracket-spacer" [style.flex]="bracketLeftFlex"></div>
        <div class="bracket" [style.flex]="reviewedFlex">
          <span class="bracket-label">REVIEWED</span>
        </div>
        <div class="bracket-spacer" [style.flex]="bracketRightFlex"></div>
      </div>

      <div class="legend">
        <div
          class="legend-item"
          *ngFor="let item of legendItems; let i = index"
          [class.dim]="item.dim"
        >
          <span class="legend-dot" [style.background]="item.color"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ animatedValues[i] }}</span>
          <span
            class="legend-pct"
            *ngIf="item.value !== null && item.value! > 0"
          >
            ({{ pct(item.value!) }}%)
          </span>
        </div>
        <div class="pill">
          <div class="pill-half">
            <span class="pill-dot approved"></span>
            <span class="pill-label approved">Approved</span>
            <span class="pill-value">{{ stats.approved ?? "—" }}</span>
          </div>
          <div class="pill-divider"></div>
          <div class="pill-half">
            <span class="pill-dot rejected"></span>
            <span class="pill-label rejected">Rejected</span>
            <span class="pill-value">{{ stats.rejected ?? "—" }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RulesLogComponent implements OnChanges, AfterViewInit {
  @Input() stats!: RuleStats; // Statistics data for the rules
  @ViewChild("barRow") barRow!: ElementRef; // Reference to the bar chart container
  @ViewChild("bracketRow") bracketRow!: ElementRef; // Reference to the bracket container

  legendItems: {
    label: string;
    value: number | null;
    color: string;
    dim?: boolean;
  }[] = []; // Items for the legend with labels, values, colors, and dimming

  /** Displayed values for the legend */
  animatedValues: (string | number)[] = [];

  constructor(
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  /**
   * Updates legend items and displayed values when stats change.
   */
  ngOnChanges(changes: SimpleChanges) {
    this.legendItems = [
      { label: "Generated", value: this.stats.generated, color: "#6366f1" },
      { label: "Testing", value: this.stats.testing, color: "#f59e0b" },
      { label: "Submitted", value: this.stats.submitted, color: "#8b5cf6" },
      { label: "Outdated", value: this.stats.outdated, color: "#ef4444" },
      {
        label: "In Production",
        value: this.stats.inProduction,
        color: "#0891b2",
        dim: true,
      },
      {
        label: "Prod. Rules",
        value: this.stats.productionRules,
        color: "#4f46e5",
        dim: true,
      },
    ];

    // Set displayed values directly
    this.animatedValues = this.legendItems.map((i) =>
      i.value === null ? "—" : i.value,
    );
  }

  ngAfterViewInit() {}

  /** Total number of rules, defaulting to 1 to avoid division by zero */
  get tot(): number {
    return this.stats.total || 1;
  }

  /** Flex value for approved rules in the bar chart */
  get approvedFlex(): number {
    return Math.max(this.stats.approved ?? 0, 1);
  }

  /** Flex value for rejected rules in the bar chart */
  get rejectedFlex(): number {
    return Math.max(this.stats.rejected ?? 0, 1);
  }

  /** Total flex for reviewed rules (approved + rejected) */
  get reviewedFlex(): number {
    return Math.max((this.stats.approved ?? 0) + (this.stats.rejected ?? 0), 2);
  }

  /** Whether to show approved rules as hatched (when no approved count) */
  get approvedHatched(): boolean {
    return !this.stats.approved;
  }

  /** Whether to show rejected rules as hatched (when no rejected count) */
  get rejectedHatched(): boolean {
    return !this.stats.rejected;
  }

  /** Left spacing for the bracket in the bar chart */
  get bracketLeftFlex(): number {
    return (
      (this.stats.generated || 0) +
      (this.stats.testing || 0) +
      (this.stats.submitted || 0) +
      0.8
    );
  }

  /** Right spacing for the bracket in the bar chart */
  get bracketRightFlex(): number {
    return (this.stats.outdated || 0) + 0.3;
  }

  /** Calculates percentage of a value relative to total */
  pct(value: number): number {
    return Math.round((value / this.tot) * 100);
  }
}

/**
 * DashboardComponent - Root component that orchestrates the dashboard layout.
 * Includes breadcrumb navigation, account selection dropdown, account header,
 * and rules statistics display.
 */
@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    AccountDropdownComponent,
    AccountHeaderComponent,
    RulesLogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
      :host {
        display: block;
        font-family: "Inter", "Segoe UI", sans-serif;
      }
      .page {
        background: #f8fafc;
        min-height: 100vh;
      }
      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 5px;
        background: #fff;
        border-bottom: 1px solid #f1f5f9;
        padding: 10px 28px;
      }
      .crumb {
        font-size: 12px;
        color: #94a3b8;
        cursor: pointer;
      }
      .crumb:hover {
        color: #6366f1;
      }
      .sep {
        font-size: 12px;
        color: #e2e8f0;
      }
      .content {
        padding: 20px 28px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .placeholder {
        background: #fff;
        border: 1.5px dashed #e2e8f0;
        border-radius: 12px;
        padding: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 280px;
      }
      .placeholder-text {
        font-size: 13px;
        font-weight: 600;
        color: #94a3b8;
      }
    `,
  ],
  template: `
    <div class="page">
      <nav class="breadcrumb">
        <span class="crumb">Dashboard</span>
        <span class="sep">/</span>
        <span class="crumb">Accounts</span>
        <span class="sep">/</span>
        <app-account-dropdown
          [accounts]="accounts"
          [current]="currentAccount"
          (accountSelected)="onAccountSelected($event)"
        />
      </nav>

      <app-account-header [account]="currentAccount" />

      <div class="content">
        <app-rules-log [stats]="stats" />
        <div class="placeholder">
          <span class="placeholder-text"
            >Content placeholder — table goes here</span
          >
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  /** Sample list of accounts for demonstration */
  accounts: Account[] = [
    {
      id: "HUF-00204500125",
      name: "UNICREDIT BK HUNGARY-PAR",
      correlationId: "100004001",
      assetClass: "Asset Services",
      accountType: "MOT",
      platform: "TLM",
      entity: "HBEU",
      reconciliationPlatform: "TLM",
    },
    {
      id: "EUR-00103200088",
      name: "DEUTSCHE BANK FRANKFURT",
      correlationId: "100004002",
      assetClass: "Fixed Income",
      accountType: "NOS",
      platform: "TLM",
      entity: "HBDE",
      reconciliationPlatform: "TLM",
    },
    {
      id: "GBP-00501100042",
      name: "BARCLAYS LONDON CLEARING",
      correlationId: "100004003",
      assetClass: "Equities",
      accountType: "MOT",
      platform: "SWIFT",
      entity: "HBGB",
      reconciliationPlatform: "SWIFT",
    },
    {
      id: "USD-00781200031",
      name: "JP MORGAN NEW YORK",
      correlationId: "100004004",
      assetClass: "Derivatives",
      accountType: "NOS",
      platform: "TLM",
      entity: "HBUS",
      reconciliationPlatform: "TLM",
    },
  ];

  /** Currently selected account, defaults to first in list */
  currentAccount: Account = this.accounts[0];

  /** Sample statistics data for demonstration */
  stats: RuleStats = {
    total: 56,
    generated: 34,
    testing: 21,
    outdated: 1,
    submitted: 0,
    approved: null,
    rejected: null,
    inProduction: null,
    productionRules: null,
  };

  /**
   * Handles account selection from the dropdown.
   * Updates the current account and triggers change detection.
   */
  onAccountSelected(account: Account) {
    this.currentAccount = { ...account };
  }
}
