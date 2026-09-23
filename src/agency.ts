import { type Functions } from "firebase/functions";
import {
  parseRole,
  type OrgNode,
  type OrgOwnerSummary,
  type UserRole,
} from "@everybenefits/shared";
import {
  FunctionsUnavailableError,
  callCloudFunction,
} from "./callables";
import { mapOrgNode } from "./admin";

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
  listOwnedOrgSubtree: (
    rootId: string,
    parentId?: string | null,
  ) => Promise<OrgNode[]>;
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
  assignMemberToOrgNode: (
    rootId: string,
    uid: string,
    orgNodeId: string | null,
  ) => Promise<void>;
  uploadOwnedOrgLogo: (input: {
    orgNodeId: string;
    contentType: string;
    bytesBase64: string;
  }) => Promise<{ downloadUrl: string; path: string }>;
  resolveUserSummaries: (uids: string[]) => Promise<UserSummary[]>;
  submitAgencyOnboardingRequest: (
    input: AgencyOnboardingInput,
  ) => Promise<{ requestId: string; status: "pending" }>;
};

function mapOwnerSummary(entry: Record<string, unknown>): OrgOwnerSummary {
  return {
    uid: String(entry.uid ?? ""),
    displayName:
      typeof entry.displayName === "string" ? entry.displayName : null,
    email: typeof entry.email === "string" ? entry.email : null,
    photoUrl: typeof entry.photoUrl === "string" ? entry.photoUrl : null,
  };
}

function mapOrgNodeWithOwners(entry: Record<string, unknown>): OrgNode {
  const node = mapOrgNode(entry);
  if (Array.isArray(entry.owners)) {
    node.owners = entry.owners
      .map((row) =>
        row && typeof row === "object"
          ? mapOwnerSummary(row as Record<string, unknown>)
          : null,
      )
      .filter((row): row is OrgOwnerSummary => row !== null && Boolean(row.uid));
  }
  return node;
}

function mapAgencyMemberRow(entry: Record<string, unknown>): AgencyMemberRow {
  return {
    uid: String(entry.uid ?? ""),
    email: typeof entry.email === "string" ? entry.email : null,
    displayName:
      typeof entry.displayName === "string" ? entry.displayName : null,
    photoUrl: typeof entry.photoUrl === "string" ? entry.photoUrl : null,
    role: parseRole(entry.role),
    npn: typeof entry.npn === "string" ? entry.npn : null,
    agency: typeof entry.agency === "string" ? entry.agency : null,
    orgNodeId: typeof entry.orgNodeId === "string" ? entry.orgNodeId : null,
    accountStatus:
      entry.accountStatus === "deactivated" ||
      entry.accountStatus === "pendingDeletion"
        ? entry.accountStatus
        : "active",
    approvalStatus:
      entry.approvalStatus === "pending" ||
      entry.approvalStatus === "approved" ||
      entry.approvalStatus === "rejected"
        ? entry.approvalStatus
        : undefined,
    createdAt:
      typeof entry.createdAt === "number" ? entry.createdAt : null,
  };
}

export function createAgencyRepository(functions: Functions): AgencyRepository {
  return {
    async listOwnedAgencies() {
      try {
        const data = await callCloudFunction<{
          agencies?: Array<Record<string, unknown>>;
        }>(functions, "listOwnedAgencies", {});
        return (data?.agencies ?? [])
          .map(mapOrgNodeWithOwners)
          .filter((n) => n.id);
      } catch (error) {
        if (error instanceof FunctionsUnavailableError) return [];
        throw error;
      }
    },
    async getOwnedAgency(id) {
      const data = await callCloudFunction<{
        node?: Record<string, unknown>;
      }>(functions, "getOwnedAgency", { id });
      return data?.node ? mapOrgNodeWithOwners(data.node) : null;
    },
    async getAgencyWorkspace(id) {
      const data = await callCloudFunction<{
        node?: Record<string, unknown>;
        assignableNodes?: Array<Record<string, unknown>>;
      }>(functions, "getAgencyWorkspace", { id });
      return {
        agency: data?.node ? mapOrgNodeWithOwners(data.node) : null,
        assignableNodes: (data?.assignableNodes ?? [])
          .map(mapOrgNode)
          .filter((n) => n.id),
      };
    },
    async listOwnedOrgSubtree(rootId, parentId) {
      const data = await callCloudFunction<{
        nodes?: Array<Record<string, unknown>>;
      }>(functions, "listOwnedOrgSubtree", {
        rootId,
        parentId: parentId ?? null,
      });
      return (data?.nodes ?? []).map(mapOrgNode).filter((n) => n.id);
    },
    async listManagedAssigniableNodes(rootId) {
      const data = await callCloudFunction<{
        nodes?: Array<Record<string, unknown>>;
      }>(functions, "listManagedAssigniableNodes", { rootId });
      return (data?.nodes ?? []).map(mapOrgNode).filter((n) => n.id);
    },
    async updateOwnedAgency(input) {
      const data = await callCloudFunction<{
        node?: Record<string, unknown>;
      }>(functions, "updateOwnedAgency", input);
      return data?.node ? mapOrgNodeWithOwners(data.node) : null;
    },
    async createOwnedSubAgency(input) {
      const data = await callCloudFunction<{
        node?: Record<string, unknown>;
      }>(functions, "createOwnedSubAgency", input);
      return data?.node ? mapOrgNode(data.node) : null;
    },
    async listAgencyMembers(filters) {
      const data = await callCloudFunction<{
        members?: Array<Record<string, unknown>>;
        nextPageToken?: string | null;
        nodeNames?: Record<string, string>;
      }>(functions, "listAgencyMembers", filters);
      return {
        members: (data?.members ?? [])
          .map(mapAgencyMemberRow)
          .filter((m) => m.uid),
        nextPageToken: data?.nextPageToken ?? null,
        nodeNames: data?.nodeNames ?? {},
      };
    },
    async assignMemberToOrgNode(rootId, uid, orgNodeId) {
      await callCloudFunction(functions, "assignMemberToOrgNode", {
        rootId,
        uid,
        orgNodeId,
      });
    },
    async uploadOwnedOrgLogo(input) {
      return await callCloudFunction<{ downloadUrl: string; path: string }>(
        functions,
        "uploadOwnedOrgLogo",
        input,
      );
    },
    async resolveUserSummaries(uids) {
      const data = await callCloudFunction<{
        users?: Array<Record<string, unknown>>;
      }>(functions, "resolveUserSummaries", { uids });
      return (data?.users ?? [])
        .map(mapOwnerSummary)
        .filter((row) => row.uid);
    },
    async submitAgencyOnboardingRequest(input) {
      return await callCloudFunction<{ requestId: string; status: "pending" }>(
        functions,
        "submitAgencyOnboardingRequest",
        input,
      );
    },
  };
}
