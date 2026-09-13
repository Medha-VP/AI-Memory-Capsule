import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface GraphEdge {
    source: string;
    relation: string;
    target: string;
}
export interface Result__1 {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export type Result_1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export interface KnowledgeGraph {
    edges: Array<GraphEdge>;
    nodes: Array<GraphNode>;
}
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface DocumentView {
    id: bigint;
    hasPassword: boolean;
    owner: Principal;
    metadata: Array<string>;
    blob?: ExternalBlob;
    name?: string;
    locked: boolean;
    fileType?: string;
    summary?: string;
    category?: DocumentCategory;
    uploadedAt: bigint;
}
export interface GraphNode {
    id: string;
    kind: string;
    name: string;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: PasswordError;
};
export interface Cell {
    value: Value;
    name: string;
}
export interface UploadTrendPoint {
    period: string;
    count: bigint;
}
export interface AnalyticsOverview {
    byCategory: Array<CategoryCount>;
    totalDocuments: bigint;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface CategoryCount {
    count: bigint;
    category: DocumentCategory;
}
export enum DocumentCategory {
    finance = "finance",
    projects = "projects",
    education = "education",
    insurance = "insurance",
    achievements = "achievements",
    identity = "identity"
}
export enum PasswordError {
    noPassword = "noPassword",
    alreadySet = "alreadySet",
    notFound = "notFound",
    notOwner = "notOwner"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeDocumentPassword(id: bigint, password: string): Promise<Result>;
    deleteDocument(id: bigint): Promise<boolean>;
    execute(qJson: string): Promise<Result__1>;
    getAnalyticsOverview(): Promise<AnalyticsOverview>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getDocument(id: bigint, password: string | null): Promise<DocumentView | null>;
    getKnowledgeGraph(): Promise<KnowledgeGraph>;
    getUploadTrends(): Promise<Array<UploadTrendPoint>>;
    isCallerAdmin(): Promise<boolean>;
    listDocuments(): Promise<Array<DocumentView>>;
    removeDocumentPassword(id: bigint): Promise<Result>;
    schema(): Promise<string>;
    searchDocuments(searchText: string): Promise<Array<DocumentView>>;
    setDocumentPassword(id: bigint, password: string): Promise<Result>;
    uploadDocument(name: string, fileType: string, blob: ExternalBlob, password: string | null): Promise<bigint>;
    verifyDocumentPassword(id: bigint, password: string): Promise<boolean>;
}
