export type InstallHost = 'claude' | 'codex' | 'cursor';
export type InstallMode = 'local' | 'marketplace';
export type InstallScope = 'local' | 'project' | 'user';

export interface InstallResult {
  readonly bundleRoot: string;
  readonly commit?: string;
  readonly contentHash?: string;
  readonly destination?: string;
  readonly host: InstallHost;
  readonly marketplace?: string;
  readonly mode?: InstallMode;
  readonly nextSteps?: readonly string[];
  readonly plugin: string;
  readonly previousContentHash?: string;
  readonly receipt?: string;
  readonly state: 'adopted' | 'already-installed' | 'installed' | 'replaced' | 'staged';
  readonly version: string;
}

export interface UninstallResult {
  readonly data: {
    readonly detail: string;
    readonly outcome: string;
    readonly paths: readonly string[];
    readonly policy: string;
  };
  readonly destination?: string;
  readonly forced?: boolean;
  readonly host: InstallHost;
  readonly mode: InstallMode;
  readonly nextSteps?: readonly string[];
  readonly plugin: string;
  readonly receipt: { readonly path: string; readonly status: string };
  readonly registrations: readonly {
    readonly action: string;
    readonly detail?: string;
    readonly id?: string;
    readonly kind: string;
    readonly name?: string;
  }[];
  readonly remnantReceipt?: string;
  readonly removed: { readonly directories: readonly string[]; readonly files: readonly string[] };
  readonly retained: readonly string[];
  readonly state: 'not-installed' | 'planned' | 'uninstalled';
  readonly version: string;
}

export declare function formatInstallResult(result: InstallResult): string;
export declare function formatUninstallResult(result: UninstallResult): string;
export declare function installBundle(options: {
  readonly from: string;
  readonly host: InstallHost;
  readonly mode?: InstallMode;
  readonly replace?: boolean;
  readonly scope?: InstallScope;
}): Promise<InstallResult>;
export declare function uninstallBundle(options: {
  readonly confirmPurge?: boolean;
  readonly force?: boolean;
  readonly from: string;
  readonly host: InstallHost;
  readonly keepData?: boolean;
  readonly mode?: InstallMode;
  readonly plan?: boolean;
  readonly purgeData?: boolean;
  readonly scope?: InstallScope;
}): Promise<UninstallResult>;
