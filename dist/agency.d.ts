import { type Functions } from "firebase/functions";
import { type OrgNode, type OrgOwnerSummary, type UserRole } from "@everybenefits/shared";
export type AgencyMemberRow = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoUrl: string | null;
    role: UserRole;
    npn: string | null;
    agency: string | null;
    orgNodeId: string | null;
    accountStatus: "active" | "deactivated" | "pendingDeletion";
    approvalStatus?: "pending" | "approved" | "rejected";
    createdAt?: number | null;
};
export type ListAgencyMembersResult = {
    members: AgencyMemberRow[];
    nextPageToken: string | null;
    nodeNames?: Record<string, string>;
};
export type AgencyOnboardingInput = {
    agencyName: string;
    contactEmail?: string | null;
    npn?: string | null;
    agencyLicense?: string | null;
    notes?: string | null;
};
export type UserSummary = OrgOwnerSummary;
export type AgencyRepository = {
    listOwnedAgencies: () => Promise<OrgNode[]>;
    getOwnedAgency: (id: string) => Promise<OrgNode | null>;
    getAgencyWorkspace: (id: string) => Promise<{
        agency: OrgNode | null;
        assignableNodes: OrgNode[];
    }>;
    listOwnedOrgSubtree: (rootId: string, parentId?: string | null) => Promise<OrgNode[]>;
    listManagedAssigniableNodes: (rootId: string) => Promise<OrgNode[]>;
    updateOwnedAgency: (input: {
        id: string;
        name?: string;
        email?: string | null;
        paymentsEmail?: string | null;
        npn?: string | null;
        ein?: string | null;
        agencyLicense?: string | null;
        logoUrl?: string | null;
        ownerUids?: string[];
    }) => Promise<OrgNode | null>;
    createOwnedSubAgency: (input: {
        rootId: string;
        parentId: string;
        name: string;
        type?: string;
        email?: string | null;
        paymentsEmail?: string | null;
        npn?: string | null;
        ein?: string | null;
        agencyLicense?: string | null;
        ownerUids?: string[];
    }) => Promise<OrgNode | null>;
    listAgencyMembers: (filters: {
        rootId: string;
        orgNodeId?: string;
        role?: UserRole | "";
        query?: string;
        pageSize?: number;
        pageToken?: string | null;
    }) => Promise<ListAgencyMembersResult>;
    assignMemberToOrgNode: (rootId: string, uid: string, orgNodeId: string | null) => Promise<void>;
    uploadOwnedOrgLogo: (input: {
        orgNodeId: string;
        contentType: string;
        bytesBase64: string;
    }) => Promise<{
        downloadUrl: string;
        path: string;
    }>;
    resolveUserSummaries: (uids: string[]) => Promise<UserSummary[]>;
    submitAgencyOnboardingRequest: (input: AgencyOnboardingInput) => Promise<{
        requestId: string;
        status: "pending";
    }>;
};
export declare function createAgencyRepository(functions: Functions): AgencyRepository;
//# sourceMappingURL=agency.d.ts.map