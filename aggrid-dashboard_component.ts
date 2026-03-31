/**
 * dashboard.component.ts
 *
 * Full file — paste this over your existing dashboard_component.ts
 *
 * What changed vs your original:
 *  1. Added AG Grid imports (AgGridAngular, ColDef, etc.)
 *  2. Added ModuleRegistry.registerModules() call
 *  3. Added RuleRow interface
 *  4. Added RulesTableComponent (new — replaces the placeholder)
 *  5. DashboardComponent: added RulesTableComponent to imports[]
 *  6. DashboardComponent template: replaced <div class="placeholder"> with <app-rules-table />
 *
 * Prerequisites:
 *   npm install ag-grid-community ag-grid-angular
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

// ── AG Grid ────────────────────────────────────────────────────────────────────
import { AgGridAngular } from "ag-grid-angular";
import {
  ColDef,
  ModuleRegistry,
  ClientSideRowModelModule,
  ICellRendererParams,
} from "ag-grid-community";

// Register once at module level
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// ── Models ─────────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  correlationId: string;
  assetClass: string;
  accountType: string;
  platform: string;
  entity: string;
  reconciliationPlatform: string;
}

export interface RuleStats {
  total: number;
  generated: number;
  testing: number;
  outdated: number;
  submitted: number;
  approved: number | null;
  rejected: number | null;
  inProduction: number | null;
  productionRules: number | null;
}

/** A single row in the rules table */
export interface RuleRow {
  ruleId: string;
  description: string;
  status: "Generated" | "Testing" | "Submitted" | "Outdated" | "In Production";
  matchField: string;
  tolerance: string;
  confidence: number;
  updated: string;
}

// ── AccountDropdownComponent ───────────────────────────────────────────────────

@Component({
  selector: "app-account-dropdown",
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .dd-wrapper { position: relative; display: inline-block; }
    .dd-trigger { display: inline-flex; align-items: center; gap: 5px; background: none; border: none; border-radius: 4px; padding: 2px 5px; cursor: pointer; font-family: inherit; }
    .dd-trigger:hover { background: #f8fafc; }
    .dd-id { font-size: 12px; font-weight: 700; color: #6366f1; font-family: monospace; }
    .dd-name { font-size: 12px; color: #64748b; font-weight: 500; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dd-chevron { font-size: 9px; color: #94a3b8; margin-left: 1px; }
    .dd-panel { position: absolute; top: calc(100% + 6px); left: 0; z-index: 999; background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 32px rgba(99,102,241,0.1); width: 340px; animation: fadeDown 0.15s ease; }
    @keyframes fadeDown { from { opacity:0; transform:translateY(-5px); } to { opacity:1; transform:translateY(0); } }
    .dd-search { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-bottom: 1px solid #f1f5f9; background: #fafafa; border-radius: 10px 10px 0 0; }
    .dd-search-icon { font-size: 13px; color: #94a3b8; }
    .dd-search input { border: none; outline: none; font-size: 13px; color: #1e293b; flex: 1; background: none; font-family: inherit; }
    .dd-clear { border: none; background: none; cursor: pointer; font-size: 12px; color: #94a3b8; padding: 0; }
    .dd-list { max-height: 200px; overflow-y: auto; }
    .dd-empty { padding: 16px; font-size: 13px; color: #94a3b8; text-align: center; }
    .dd-item { padding: 10px 14px; cursor: pointer; display: flex; flex-direction: column; gap: 2px; background: #fff; border-left: 3px solid transparent; border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
    .dd-item:hover { background: #f8fafc; }
    .dd-item.active { background: #eef2ff; border-left-color: #6366f1; }
    .dd-item-id { font-size: 12px; font-weight: 700; color: #6366f1; font-family: monospace; }
    .dd-item-name { font-size: 11px; color: #64748b; }
  `],
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
          <input type="text" placeholder="Search accounts…" [(ngModel)]="query" autofocus />
          <button class="dd-clear" *ngIf="query" (click)="query = ''">✕</button>
        </div>
        <div class="dd-list">
          <div class="dd-empty" *ngIf="filtered.length === 0">No accounts found</div>
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
  @Input() accounts: Account[] = [];
  @Input() current!: Account;
  @Output() accountSelected = new EventEmitter<Account>();

  open = false;
  query = "";

  constructor(private el: ElementRef) {}

  @HostListener("document:mousedown", ["$event"])
  onOutsideClick(e: MouseEvent) {
    if (!this.el.nativeElement.contains(e.target)) this.open = false;
  }

  get filtered(): Account[] {
    const q = this.query.toLowerCase();
    return this.accounts.filter(
      (a) => a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
    );
  }

  toggle() { this.open = !this.open; this.query = ""; }

  select(account: Account) {
    this.accountSelected.emit(account);
    this.open = false;
    this.query = "";
  }
}

// ── AccountHeaderComponent ─────────────────────────────────────────────────────

@Component({
  selector: "app-account-header",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .header { background: #fff; border-bottom: 1px solid #f1f5f9; padding: 20px 28px 18px; }
    .title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .account-name { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; margin: 0; }
    .badge { font-size: 12px; font-weight: 500; padding: 3px 12px; border-radius: 99px; background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
    .fields-row { display: flex; flex-wrap: wrap; align-items: baseline; row-gap: 5px; }
    .field { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
    .field-label { font-size: 12px; color: #94a3b8; font-weight: 400; }
    .field-value { font-size: 13px; color: #0f172a; font-weight: 700; font-family: monospace; margin-left: 2px; }
    .dot { color: #e2e8f0; margin: 0 10px; font-size: 14px; }
  `],
  template: `
    <div class="header">
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
  @Input() account!: Account;
  @ViewChild("headerEl") headerEl!: ElementRef;

  fields: { label: string; value: string }[] = [];

  constructor(private zone: NgZone) {}

  ngOnChanges(changes: SimpleChanges) {
    this.fields = [
      { label: "ID",       value: this.account.correlationId },
      { label: "Class",    value: this.account.assetClass },
      { label: "Type",     value: this.account.accountType },
      { label: "Platform", value: this.account.reconciliationPlatform },
      { label: "Entity",   value: this.account.entity },
    ];
  }

  ngAfterViewInit() {}
}

// ── RulesLogComponent ──────────────────────────────────────────────────────────

@Component({
  selector: "app-rules-log",
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .card { background: #fff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .header-left { display: flex; align-items: center; gap: 10px; }
    .title { font-size: 15px; font-weight: 700; color: #0f172a; }
    .total-badge { font-size: 12px; font-weight: 600; color: #94a3b8; background: #f8fafc; padding: 2px 9px; border-radius: 99px; border: 1px solid #f1f5f9; }
    .view-all { font-size: 12px; color: #6366f1; font-weight: 600; cursor: pointer; }
    .bar-row { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 2px; margin-bottom: 4px; }
    .seg { min-width: 0; }
    .seg-generated { background: #6366f1; }
    .seg-testing { background: #f59e0b; }
    .seg-submitted { background: #8b5cf6; }
    .seg-outdated { background: #ef4444; }
    .reviewed-wrapper { display: flex; min-width: 20px; overflow: hidden; }
    .reviewed-half { flex: 1; }
    .approved-hatched { background: repeating-linear-gradient(45deg,#d1fae5,#d1fae5 3px,#a7f3d0 3px,#a7f3d0 6px); border-right: 1.5px solid rgba(255,255,255,0.6); }
    .rejected-hatched { background: repeating-linear-gradient(45deg,#fee2e2,#fee2e2 3px,#fca5a5 3px,#fca5a5 6px); }
    .bracket-row { display: flex; margin-bottom: 16px; }
    .bracket-spacer { min-width: 0; }
    .bracket { min-width: 20px; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; border-bottom: 1px solid #cbd5e1; height: 5px; border-radius: 0 0 3px 3px; position: relative; display: flex; justify-content: center; }
    .bracket-label { font-size: 8px; font-weight: 700; color: #94a3b8; letter-spacing: 0.08em; position: absolute; bottom: -9px; background: #fff; padding: 0 3px; white-space: nowrap; }
    .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
    .legend-item { display: flex; align-items: center; gap: 5px; }
    .legend-item.dim { opacity: 0.4; }
    .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    .legend-label { font-size: 12px; color: #64748b; }
    .legend-value { font-size: 13px; font-weight: 700; color: #0f172a; }
    .legend-pct { font-size: 11px; color: #94a3b8; }
    .pill { display: flex; align-items: center; background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 6px; overflow: hidden; }
    .pill-half { display: flex; align-items: center; gap: 5px; padding: 4px 10px; }
    .pill-divider { width: 1px; height: 20px; background: #f1f5f9; }
    .pill-dot { width: 8px; height: 8px; border-radius: 2px; }
    .pill-dot.approved { background: #10b981; }
    .pill-dot.rejected { background: #ef4444; }
    .pill-label { font-size: 12px; font-weight: 600; }
    .pill-label.approved { color: #10b981; }
    .pill-label.rejected { color: #ef4444; }
    .pill-value { font-size: 13px; font-weight: 700; color: #0f172a; }
  `],
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
        <div class="seg seg-testing"   [style.flex]="stats.testing"></div>
        <div class="seg seg-submitted" [style.flex]="stats.submitted" *ngIf="stats.submitted > 0"></div>
        <div class="reviewed-wrapper"  [style.flex]="reviewedFlex">
          <div class="reviewed-half" [ngClass]="approvedHatched ? 'approved-hatched' : 'approved-solid'" [style.flex]="approvedFlex"></div>
          <div class="reviewed-half" [ngClass]="rejectedHatched ? 'rejected-hatched' : 'rejected-solid'" [style.flex]="rejectedFlex"></div>
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
        <div class="legend-item" *ngFor="let item of legendItems; let i = index" [class.dim]="item.dim">
          <span class="legend-dot" [style.background]="item.color"></span>
          <span class="legend-label">{{ item.label }}</span>
          <span class="legend-value">{{ animatedValues[i] }}</span>
          <span class="legend-pct" *ngIf="item.value !== null && item.value! > 0">({{ pct(item.value!) }}%)</span>
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
  @Input() stats!: RuleStats;
  @ViewChild("barRow") barRow!: ElementRef;
  @ViewChild("bracketRow") bracketRow!: ElementRef;

  legendItems: { label: string; value: number | null; color: string; dim?: boolean }[] = [];
  animatedValues: (string | number)[] = [];

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    this.legendItems = [
      { label: "Generated",    value: this.stats.generated,      color: "#6366f1" },
      { label: "Testing",      value: this.stats.testing,        color: "#f59e0b" },
      { label: "Submitted",    value: this.stats.submitted,      color: "#8b5cf6" },
      { label: "Outdated",     value: this.stats.outdated,       color: "#ef4444" },
      { label: "In Production",value: this.stats.inProduction,   color: "#0891b2", dim: true },
      { label: "Prod. Rules",  value: this.stats.productionRules,color: "#4f46e5", dim: true },
    ];
    this.animatedValues = this.legendItems.map((i) => (i.value === null ? "—" : i.value));
  }

  ngAfterViewInit() {}

  get tot(): number { return this.stats.total || 1; }
  get approvedFlex(): number  { return Math.max(this.stats.approved ?? 0, 1); }
  get rejectedFlex(): number  { return Math.max(this.stats.rejected ?? 0, 1); }
  get reviewedFlex(): number  { return Math.max((this.stats.approved ?? 0) + (this.stats.rejected ?? 0), 2); }
  get approvedHatched(): boolean { return !this.stats.approved; }
  get rejectedHatched(): boolean { return !this.stats.rejected; }
  get bracketLeftFlex(): number  { return (this.stats.generated || 0) + (this.stats.testing || 0) + (this.stats.submitted || 0) + 0.8; }
  get bracketRightFlex(): number { return (this.stats.outdated || 0) + 0.3; }
  pct(value: number): number { return Math.round((value / this.tot) * 100); }
}

// ── RulesTableComponent ────────────────────────────────────────────────────────

@Component({
  selector: "app-rules-table",
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Card wrapper */
    .table-card {
      background: #fff;
      border: 1px solid #f1f5f9;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    /* Tab bar */
    .tab-bar {
      display: flex;
      align-items: flex-end;
      gap: 2px;
      padding: 12px 20px 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .tab-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 13px;
      font-weight: 600;
      color: #94a3b8;
      padding: 8px 14px;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.15s;
    }
    .tab-btn:hover { color: #6366f1; }
    .tab-btn.active { color: #6366f1; border-bottom-color: #6366f1; }
    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #eef2ff;
      color: #6366f1;
      font-size: 11px;
      font-weight: 700;
      border-radius: 99px;
      padding: 1px 7px;
    }
    .tab-count.muted { background: #f8fafc; color: #94a3b8; }

    /* Grid container */
    .grid-host { width: 100%; height: 380px; }

    /* AG Grid theme overrides */
    ::ng-deep .rules-grid.ag-theme-alpine {
      --ag-background-color: #ffffff;
      --ag-odd-row-background-color: #ffffff;
      --ag-header-background-color: #f8fafc;
      --ag-header-foreground-color: #64748b;
      --ag-foreground-color: #0f172a;
      --ag-border-color: #f1f5f9;
      --ag-row-border-color: #f1f5f9;
      --ag-row-hover-color: #fafbff;
      --ag-selected-row-background-color: #eef2ff;
      --ag-font-family: "Inter", "Segoe UI", sans-serif;
      --ag-font-size: 13px;
      --ag-header-height: 38px;
      --ag-row-height: 44px;
      --ag-cell-horizontal-padding: 16px;
      --ag-borders: none;
      --ag-header-column-separator-display: none;
    }
    ::ng-deep .rules-grid.ag-theme-alpine .ag-root-wrapper { border: none; }
    ::ng-deep .rules-grid.ag-theme-alpine .ag-row { border-bottom: 1px solid #f1f5f9; }
    ::ng-deep .rules-grid.ag-theme-alpine .ag-header-cell-text {
      font-weight: 700; font-size: 11px; letter-spacing: 0.04em; text-transform: uppercase;
    }

    /* Cell renderer styles */
    ::ng-deep .rules-grid .rule-id {
      font-family: monospace; font-size: 12px; font-weight: 700; color: #6366f1;
    }
    ::ng-deep .rules-grid .badge {
      display: inline-flex; align-items: center;
      padding: 2px 10px; border-radius: 99px;
      font-size: 11px; font-weight: 600;
    }
    ::ng-deep .rules-grid .s-Generated    { background: #eef2ff; color: #4338ca; }
    ::ng-deep .rules-grid .s-Testing      { background: #fffbeb; color: #b45309; }
    ::ng-deep .rules-grid .s-Submitted    { background: #f5f3ff; color: #6d28d9; }
    ::ng-deep .rules-grid .s-Outdated     { background: #fef2f2; color: #b91c1c; }
    ::ng-deep .rules-grid .s-InProduction { background: #ecfdf5; color: #047857; }
    ::ng-deep .rules-grid .conf-wrap {
      display: flex; align-items: center; gap: 8px; width: 100%;
    }
    ::ng-deep .rules-grid .conf-track {
      flex: 1; height: 5px; background: #f1f5f9; border-radius: 3px; overflow: hidden;
    }
    ::ng-deep .rules-grid .conf-fill { height: 100%; border-radius: 3px; }
    ::ng-deep .rules-grid .conf-lbl {
      font-size: 12px; color: #94a3b8; min-width: 28px; text-align: right;
    }
  `],
  template: `
    <div class="table-card">

      <!-- Tab bar -->
      <div class="tab-bar">
        <button
          class="tab-btn"
          [class.active]="activeTab === 'proposed'"
          (click)="activeTab = 'proposed'"
        >
          Proposed Rules
          <span class="tab-count" [class.muted]="activeTab !== 'proposed'">
            {{ proposedRows.length }}
          </span>
        </button>
        <button
          class="tab-btn"
          [class.active]="activeTab === 'rules'"
          (click)="activeTab = 'rules'"
        >
          Rules
          <span class="tab-count" [class.muted]="activeTab !== 'rules'">
            {{ rulesRows.length }}
          </span>
        </button>
      </div>

      <!-- AG Grid -->
      <div class="grid-host">
        <ag-grid-angular
          class="rules-grid ag-theme-alpine"
          style="width: 100%; height: 100%;"
          [columnDefs]="columnDefs"
          [rowData]="activeTab === 'proposed' ? proposedRows : rulesRows"
          [defaultColDef]="defaultColDef"
          [suppressCellFocus]="true"
          [animateRows]="true"
        />
      </div>

    </div>
  `,
})
export class RulesTableComponent {
  activeTab: "proposed" | "rules" = "proposed";

  /** Column definitions */
  columnDefs: ColDef[] = [
    {
      headerName: "Rule ID",
      field: "ruleId",
      width: 130,
      cellRenderer: (params: ICellRendererParams) =>
        `<span class="rule-id">${params.value}</span>`,
    },
    {
      headerName: "Description",
      field: "description",
      flex: 2,
      minWidth: 180,
    },
    {
      headerName: "Status",
      field: "status",
      width: 150,
      cellRenderer: (params: ICellRendererParams) => {
        const cls = "s-" + (params.value as string).replace(/\s+/g, "");
        return `<span class="badge ${cls}">${params.value}</span>`;
      },
    },
    {
      headerName: "Match Field",
      field: "matchField",
      width: 140,
    },
    {
      headerName: "Tolerance",
      field: "tolerance",
      width: 110,
    },
    {
      headerName: "Confidence",
      field: "confidence",
      width: 160,
      cellRenderer: (params: ICellRendererParams) => {
        const val = params.value as number;
        const color = val >= 80 ? "#6366f1" : val >= 65 ? "#f59e0b" : "#ef4444";
        return `
          <div class="conf-wrap">
            <div class="conf-track">
              <div class="conf-fill" style="width:${val}%; background:${color}"></div>
            </div>
            <span class="conf-lbl">${val}%</span>
          </div>`;
      },
    },
    {
      headerName: "Updated",
      field: "updated",
      width: 100,
      cellStyle: { color: "#94a3b8" },
    },
  ];

  defaultColDef: ColDef = {
    sortable: true,
    resizable: true,
  };

  /** Proposed Rules data — replace with your API call */
  proposedRows: RuleRow[] = [
    { ruleId: "PROP-001", description: "Net settlement amount within tolerance band",    status: "Generated",    matchField: "NET_AMOUNT",  tolerance: "±0.01",   confidence: 92, updated: "Mar 28" },
    { ruleId: "PROP-002", description: "Trade date matches across both sides",             status: "Testing",      matchField: "TRADE_DATE",  tolerance: "Exact",   confidence: 85, updated: "Mar 27" },
    { ruleId: "PROP-003", description: "ISIN code exact match for equity transactions",    status: "Generated",    matchField: "ISIN",        tolerance: "Exact",   confidence: 97, updated: "Mar 26" },
    { ruleId: "PROP-004", description: "Currency code must align with account entity",     status: "Testing",      matchField: "CURRENCY",    tolerance: "Exact",   confidence: 78, updated: "Mar 25" },
    { ruleId: "PROP-005", description: "Quantity difference within 0.001% of face value", status: "Generated",    matchField: "QUANTITY",    tolerance: "±0.001%", confidence: 88, updated: "Mar 24" },
    { ruleId: "PROP-006", description: "Settlement date lag ≤ 2 business days",            status: "Outdated",     matchField: "SETTLE_DATE", tolerance: "2 BD",    confidence: 55, updated: "Mar 1"  },
  ];

  /** Rules data — replace with your API call */
  rulesRows: RuleRow[] = [
    { ruleId: "RULE-101", description: "Counterparty BIC must match reference data",       status: "In Production", matchField: "BIC_CODE",    tolerance: "Exact",  confidence: 99, updated: "Jan 15" },
    { ruleId: "RULE-102", description: "Gross amount variance ≤ EUR 500",                   status: "In Production", matchField: "GROSS_AMOUNT",tolerance: "±500",   confidence: 95, updated: "Feb 10" },
    { ruleId: "RULE-103", description: "Asset class classification — Asset Services",       status: "Submitted",     matchField: "ASSET_CLASS", tolerance: "Exact",  confidence: 90, updated: "Mar 10" },
    { ruleId: "RULE-104", description: "MOT account type standard matching",                status: "In Production", matchField: "ACCT_TYPE",   tolerance: "Exact",  confidence: 98, updated: "Mar 1"  },
  ];
}

// ── DashboardComponent ─────────────────────────────────────────────────────────

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    AccountDropdownComponent,
    AccountHeaderComponent,
    RulesLogComponent,
    RulesTableComponent,   // ← added
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
    :host { display: block; font-family: "Inter", "Segoe UI", sans-serif; }
    .page { background: #f8fafc; min-height: 100vh; }
    .breadcrumb { display: flex; align-items: center; gap: 5px; background: #fff; border-bottom: 1px solid #f1f5f9; padding: 10px 28px; }
    .crumb { font-size: 12px; color: #94a3b8; cursor: pointer; }
    .crumb:hover { color: #6366f1; }
    .sep { font-size: 12px; color: #e2e8f0; }
    .content { padding: 20px 28px; display: flex; flex-direction: column; gap: 16px; }
  `],
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
        <app-rules-table />
      </div>
    </div>
  `,
})
export class DashboardComponent {
  accounts: Account[] = [
    { id: "HUF-00204500125", name: "UNICREDIT BK HUNGARY-PAR",  correlationId: "100004001", assetClass: "Asset Services", accountType: "MOT", platform: "TLM",   entity: "HBEU", reconciliationPlatform: "TLM"   },
    { id: "EUR-00103200088", name: "DEUTSCHE BANK FRANKFURT",   correlationId: "100004002", assetClass: "Fixed Income",   accountType: "NOS", platform: "TLM",   entity: "HBDE", reconciliationPlatform: "TLM"   },
    { id: "GBP-00501100042", name: "BARCLAYS LONDON CLEARING",  correlationId: "100004003", assetClass: "Equities",       accountType: "MOT", platform: "SWIFT", entity: "HBGB", reconciliationPlatform: "SWIFT" },
    { id: "USD-00781200031", name: "JP MORGAN NEW YORK",         correlationId: "100004004", assetClass: "Derivatives",    accountType: "NOS", platform: "TLM",   entity: "HBUS", reconciliationPlatform: "TLM"   },
  ];

  currentAccount: Account = this.accounts[0];

  stats: RuleStats = {
    total: 56, generated: 34, testing: 21, outdated: 1, submitted: 0,
    approved: null, rejected: null, inProduction: null, productionRules: null,
  };

  onAccountSelected(account: Account) {
    this.currentAccount = { ...account };
  }
}
