"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReleaseNotesRepository = createReleaseNotesRepository;
const shared_1 = require("@everybenefits/shared");
const callables_1 = require("./callables");
function mapReleaseNote(entry) {
    return shared_1.releaseNoteEntrySchema.parse(entry);
}
function createReleaseNotesRepository(functions) {
    return {
        async listPublishedReleaseNotes() {
            const data = await (0, callables_1.callCloudFunction)(functions, "listPublishedReleaseNotes", {});
            return (data?.notes ?? [])
                .map(mapReleaseNote)
                .filter((note) => note.slug);
        },
        async listReleaseNotesAdmin() {
            const data = await (0, callables_1.callCloudFunction)(functions, "listReleaseNotesAdmin", {});
            return (data?.notes ?? []).map((entry) => ({
                ...mapReleaseNote(entry),
                published: entry.published === true,
            }));
        },
        async upsertReleaseNote(input) {
            const data = await (0, callables_1.callCloudFunction)(functions, "upsertReleaseNote", input);
            if (!data?.note) {
                throw new Error("Release note save failed.");
            }
            return {
                ...mapReleaseNote(data.note),
                published: data.note.published === true,
            };
        },
        async deleteReleaseNote(id) {
            await (0, callables_1.callCloudFunction)(functions, "deleteReleaseNote", { id });
        },
    };
}
