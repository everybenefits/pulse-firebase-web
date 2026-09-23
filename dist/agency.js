"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgencyRepository = createAgencyRepository;
const shared_1 = require("@everybenefits/shared");
const callables_1 = require("./callables");
const admin_1 = require("./admin");
function mapOwnerSummary(entry) {
    return {
        uid: String(entry.uid ?? ""),
        displayName: typeof entry.displayName === "string" ? entry.displayName : null,
        email: typeof entry.email === "string" ? entry.email : null,
        photoUrl: typeof entry.photoUrl === "string" ? entry.photoUrl : null,
    };
}
function mapOrgNodeWithOwners(entry) {
    const node = (0, admin_1.mapOrgNode)(entry);
    if (Array.isArray(entry.owners)) {
        node.owners = entry.owners
            .map((row) => row && typeof row === "object"
            ? mapOwnerSummary(row)
            : null)
            .filter((row) => row !== null && Boolean(row.uid));
    }
    return node;
}
function mapAgencyMemberRow(entry) {
    return {
        uid: String(entry.uid ?? ""),
        email: typeof entry.email === "string" ? entry.email : null,
        displayName: typeof entry.displayName === "string" ? entry.displayName : null,
        photoUrl: typeof entry.photoUrl === "string" ? entry.photoUrl : null,
        role: (0, shared_1.parseRole)(entry.role),
        npn: typeof entry.npn === "string" ? entry.npn : null,
        agency: typeof entry.agency === "string" ? entry.agency : null,
        orgNodeId: typeof entry.orgNodeId === "string" ? entry.orgNodeId : null,
        accountStatus: entry.accountStatus === "deactivated" ||
            entry.accountStatus === "pendingDeletion"
            ? entry.accountStatus
            : "active",
        approvalStatus: entry.approvalStatus === "pending" ||
            entry.approvalStatus === "approved" ||
            entry.approvalStatus === "rejected"
            ? entry.approvalStatus
            : undefined,
        createdAt: typeof entry.createdAt === "number" ? entry.createdAt : null,
    };
}
function createAgencyRepository(functions) {
    return {
        async listOwnedAgencies() {
            try {
                const data = await (0, callables_1.callCloudFunction)(functions, "listOwnedAgencies", {});
                return (data?.agencies ?? [])
                    .map(mapOrgNodeWithOwners)
                    .filter((n) => n.id);
            }
            catch (error) {
                if (error instanceof callables_1.FunctionsUnavailableError)
                    return [];
                throw error;
            }
        },
        async getOwnedAgency(id) {
            const data = await (0, callables_1.callCloudFunction)(functions, "getOwnedAgency", { id });
            return data?.node ? mapOrgNodeWithOwners(data.node) : null;
        },
        async getAgencyWorkspace(id) {
            const data = await (0, callables_1.callCloudFunction)(functions, "getAgencyWorkspace", { id });
            return {
                agency: data?.node ? mapOrgNodeWithOwners(data.node) : null,
                assignableNodes: (data?.assignableNodes ?? [])
                    .map(admin_1.mapOrgNode)
                    .filter((n) => n.id),
            };
        },
        async listOwnedOrgSubtree(rootId, parentId) {
            const data = await (0, callables_1.callCloudFunction)(functions, "listOwnedOrgSubtree", {
                rootId,
                parentId: parentId ?? null,
            });
            return (data?.nodes ?? []).map(admin_1.mapOrgNode).filter((n) => n.id);
        },
        async listManagedAssigniableNodes(rootId) {
            const data = await (0, callables_1.callCloudFunction)(functions, "listManagedAssigniableNodes", { rootId });
            return (data?.nodes ?? []).map(admin_1.mapOrgNode).filter((n) => n.id);
        },
        async updateOwnedAgency(input) {
            const data = await (0, callables_1.callCloudFunction)(functions, "updateOwnedAgency", input);
            return data?.node ? mapOrgNodeWithOwners(data.node) : null;
        },
        async createOwnedSubAgency(input) {
            const data = await (0, callables_1.callCloudFunction)(functions, "createOwnedSubAgency", input);
            return data?.node ? (0, admin_1.mapOrgNode)(data.node) : null;
        },
        async listAgencyMembers(filters) {
            const data = await (0, callables_1.callCloudFunction)(functions, "listAgencyMembers", filters);
            return {
                members: (data?.members ?? [])
                    .map(mapAgencyMemberRow)
                    .filter((m) => m.uid),
                nextPageToken: data?.nextPageToken ?? null,
                nodeNames: data?.nodeNames ?? {},
            };
        },
        async assignMemberToOrgNode(rootId, uid, orgNodeId) {
            await (0, callables_1.callCloudFunction)(functions, "assignMemberToOrgNode", {
                rootId,
                uid,
                orgNodeId,
            });
        },
        async uploadOwnedOrgLogo(input) {
            return await (0, callables_1.callCloudFunction)(functions, "uploadOwnedOrgLogo", input);
        },
        async resolveUserSummaries(uids) {
            const data = await (0, callables_1.callCloudFunction)(functions, "resolveUserSummaries", { uids });
            return (data?.users ?? [])
                .map(mapOwnerSummary)
                .filter((row) => row.uid);
        },
        async submitAgencyOnboardingRequest(input) {
            return await (0, callables_1.callCloudFunction)(functions, "submitAgencyOnboardingRequest", input);
        },
    };
}
